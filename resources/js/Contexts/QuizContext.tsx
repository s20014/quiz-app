import {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";
import { roomApi, playerApi, questionApi } from "@/services/api";
import { useEchoPublic } from "@laravel/echo-react";

export type QuestionType = "true-false" | "multiple-choice" | "text-input";

export interface Player {
    id: string | number;
    name: string;
    score: number;
    answer?: string | boolean;
    isCorrect?: boolean;
}

export interface Question {
    type: QuestionType;
    correctAnswer?: string | boolean;
}

interface QuizContextType {
    roomId: string | null;
    roomCode: string | null;
    players: Player[];
    currentQuestion: Question | null;
    isAcceptingAnswers: boolean;
    createRoom: () => Promise<void>;
    resetRoom: () => Promise<void>;
    joinRoom: (roomCodeParam: string) => Promise<void>;
    addPlayer: (name: string, roomCodeParam?: string) => Promise<string>;
    setCurrentQuestion: (question: Question) => Promise<void>;
    startAcceptingAnswers: () => void;
    stopAcceptingAnswers: () => void;
    submitAnswer: (playerId: string, answer: string | boolean) => Promise<void>;
    gradeQuestion: () => Promise<void>;
    calculateScores: () => void;
    resetQuestion: () => Promise<void>;
    updatePlayerScore: (playerId: string, newScore: number) => Promise<void>;
    overridePlayerResult: (playerId: string, makeCorrect: boolean) => Promise<void>;
    kickPlayer: (playerId: string) => Promise<void>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
    const [roomId, setRoomId] = useState<string | null>(null);
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentQuestion, setCurrentQuestionInternal] =
        useState<Question | null>(null);
    const [isAcceptingAnswers, setIsAcceptingAnswers] = useState(false);

    // Listen for player joined
    useEchoPublic(
        roomId ? `room.${roomId}` : "",
        "PlayerJoinedEvent",
        useCallback((event: { player: Player }) => {
            setPlayers((prev) => {
                // IDを文字列比較して重複チェック
                const exists = prev.some(
                    (p) => p.id.toString() === event.player.id.toString(),
                );
                if (exists) return prev;
                return [...prev, event.player];
            });
        }, []),
    );

    // Listen for question reset
    useEchoPublic(
        roomId ? `room.${roomId}` : "",
        "QuestionResetEvent",
        useCallback(() => {
            setCurrentQuestionInternal(null);
            setIsAcceptingAnswers(false);
            setPlayers((prev) =>
                prev.map((p) => ({
                    ...p,
                    answer: undefined,
                    isCorrect: undefined,
                })),
            );
        }, []),
    );

    // Listen for question asked
    useEchoPublic(
        roomId ? `room.${roomId}` : "",
        "QuestionAskedEvent",
        (event: { question: Question }) => {
            setCurrentQuestionInternal(event.question);
            setIsAcceptingAnswers(true);
            // Reset player answers for the new question
            setPlayers((prev) =>
                prev.map((p) => ({
                    ...p,
                    answer: undefined,
                    isCorrect: undefined,
                })),
            );
        },
    );

    // Listen for player answered
    useEchoPublic(
        roomId ? `room.${roomId}` : "",
        "PlayerAnsweredEvent",
        (event: { player_id: string | number; answer: string | boolean }) => {
            setPlayers((prev) =>
                prev.map((p) =>
                    p.id.toString() === event.player_id.toString()
                        ? { ...p, answer: event.answer }
                        : p,
                ),
            );
        },
    );

    // Listen for question graded
    useEchoPublic(
        roomId ? `room.${roomId}` : "",
        "QuestionGradedEvent",
        (event: {
            results: Array<{
                player_id: number;
                player_name: string;
                answer: string;
                is_correct: boolean;
                new_score: number;
            }>;
        }) => {
            setPlayers((prev) =>
                prev.map((p) => {
                    const result = event.results.find(
                        (r) => r.player_id.toString() === p.id.toString(),
                    );
                    if (result) {
                        return {
                            ...p,
                            answer: result.answer,
                            isCorrect: result.is_correct,
                            score: result.new_score,
                        };
                    }
                    return p;
                }),
            );
            setIsAcceptingAnswers(false);
        },
    );

    // Listen for score updated
    useEchoPublic(
        roomId ? `room.${roomId}` : "",
        "ScoreUpdatedEvent",
        useCallback(
            (event: {
                playerId: number;
                playerName: string;
                oldScore: number;
                newScore: number;
            }) => {
                setPlayers((prev) =>
                    prev.map((p) =>
                        p.id.toString() === event.playerId.toString()
                            ? { ...p, score: event.newScore }
                            : p,
                    ),
                );
            },
            [],
        ),
    );

    // Listen for player kicked
    useEchoPublic(
        roomId ? `room.${roomId}` : "",
        "PlayerKickedEvent",
        useCallback((event: { player_id: number }) => {
            setPlayers((prev) =>
                prev.filter(
                    (p) => p.id.toString() !== event.player_id.toString(),
                ),
            );
        }, []),
    );

    const createRoom = async () => {
        try {
            const { room } = await roomApi.createRoom();
            setRoomId(room.id.toString());
            setRoomCode(room.room_code);
        } catch (error) {
            console.error("Failed to create room:", error);
            throw error;
        }
    };

    const joinRoom = useCallback(async (roomCodeParam: string) => {
        try {
            const { room } = await roomApi.getRoom(roomCodeParam);
            setRoomId(room.id.toString());
            setRoomCode(room.room_code);

            // DBの問題状態を復元（ホストのリロード対応）
            if (room.current_question) {
                const q = room.current_question as {
                    type: QuestionType;
                    correctAnswer?: string | boolean;
                    accepting_answers?: boolean;
                };
                setCurrentQuestionInternal({
                    type: q.type,
                    correctAnswer: q.correctAnswer,
                });
                setIsAcceptingAnswers(q.accepting_answers === true);
            }

            // プレイヤー一覧を取得してContextに設定（QuestionGradedEvent受信のため）
            const { players: roomPlayers } = await playerApi.getPlayers(
                room.id,
            );
            // 関数形式のupdateで、WebSocketで受け取った差分を失わないようにマージ
            setPlayers((prev) => {
                const dbPlayers = roomPlayers.map((p) => ({
                    id: p.id,
                    name: p.name,
                    score: p.score,
                }));
                const playerMap = new Map<string, Player>(
                    dbPlayers.map((p) => [p.id.toString(), p]),
                );
                // DBにまだ反映されていないイベント受信済みプレイヤーも保持
                for (const p of prev) {
                    if (!playerMap.has(p.id.toString())) {
                        playerMap.set(p.id.toString(), p);
                    }
                }
                return Array.from(playerMap.values());
            });
        } catch (error) {
            console.error("Failed to join room:", error);
            throw error;
        }
    }, []);

    const addPlayer = async (name: string, roomCodeParam?: string) => {
        const codeToUse = roomCodeParam || roomCode;

        if (!codeToUse) {
            throw new Error("Room not created yet");
        }

        try {
            const { player } = await playerApi.joinRoom(codeToUse, name);
            return player.id.toString();
        } catch (error) {
            console.error("Failed to join room:", error);
            throw error;
        }
    };

    const setCurrentQuestion = async (question: Question) => {
        if (!roomId) {
            throw new Error("Room not created yet");
        }

        try {
            await questionApi.startQuestion(roomId, question);
            // The event listener will update the local state
        } catch (error) {
            console.error("Failed to start question:", error);
            throw error;
        }
    };

    const startAcceptingAnswers = () => {
        setIsAcceptingAnswers(true);
    };

    const stopAcceptingAnswers = () => {
        setIsAcceptingAnswers(false);
    };

    const submitAnswer = async (playerId: string, answer: string | boolean) => {
        try {
            await playerApi.submitAnswer(playerId, answer);
            // The event listener will update the local state
        } catch (error) {
            console.error("Failed to submit answer:", error);
            throw error;
        }
    };

    const gradeQuestion = async () => {
        if (!roomId) {
            throw new Error("Room not created yet");
        }

        try {
            await questionApi.gradeQuestion(roomId);
            // The event listener will update the scores
        } catch (error) {
            console.error("Failed to grade question:", error);
            throw error;
        }
    };

    const calculateScores = () => {
        if (!currentQuestion || !currentQuestion.correctAnswer) return;

        setPlayers((prev) =>
            prev.map((p) => {
                if (p.answer === undefined) return p;

                const isCorrect = p.answer === currentQuestion.correctAnswer;
                return {
                    ...p,
                    isCorrect,
                    score: isCorrect ? p.score + 100 : p.score,
                };
            }),
        );
    };

    const resetQuestion = async () => {
        if (!roomId) return;
        // ローカル状態を即時リセット
        setPlayers((prev) =>
            prev.map((p) => ({
                ...p,
                answer: undefined,
                isCorrect: undefined,
            })),
        );
        setCurrentQuestionInternal(null);
        setIsAcceptingAnswers(false);
        // バックエンドに通知してプレイヤー側にも broadcast
        try {
            await questionApi.resetQuestion(roomId);
        } catch (error) {
            console.error("Failed to reset question:", error);
        }
    };

    const updatePlayerScore = async (playerId: string, newScore: number) => {
        try {
            await playerApi.updateScore(playerId, newScore);
            // The event listener will update the local state
        } catch (error) {
            console.error("Failed to update score:", error);
            throw error;
        }
    };

    const resetRoom = async () => {
        setPlayers([]);
        setCurrentQuestionInternal(null);
        setIsAcceptingAnswers(false);
        setRoomId(null);
        setRoomCode(null);
        try {
            const { room } = await roomApi.createRoom();
            setRoomId(room.id.toString());
            setRoomCode(room.room_code);
        } catch (error) {
            console.error("Failed to reset room:", error);
            throw error;
        }
    };

    const overridePlayerResult = async (playerId: string, makeCorrect: boolean) => {
        const player = players.find((p) => p.id.toString() === playerId);
        if (!player || player.isCorrect === makeCorrect) return;

        const scoreDelta = makeCorrect ? 100 : -100;
        const newScore = Math.max(0, player.score + scoreDelta);

        setPlayers((prev) =>
            prev.map((p) =>
                p.id.toString() === playerId ? { ...p, isCorrect: makeCorrect } : p,
            ),
        );

        try {
            await playerApi.updateScore(playerId, newScore);
        } catch (error) {
            setPlayers((prev) =>
                prev.map((p) =>
                    p.id.toString() === playerId
                        ? { ...p, isCorrect: player.isCorrect, score: player.score }
                        : p,
                ),
            );
            throw error;
        }
    };

    const kickPlayer = async (playerId: string) => {
        try {
            await playerApi.kickPlayer(playerId);
            // The event listener will remove the player from local state
        } catch (error) {
            console.error("Failed to kick player:", error);
            throw error;
        }
    };

    return (
        <QuizContext.Provider
            value={{
                roomId,
                roomCode,
                players,
                currentQuestion: currentQuestion,
                isAcceptingAnswers,
                createRoom,
                resetRoom,
                joinRoom,
                addPlayer,
                setCurrentQuestion,
                startAcceptingAnswers,
                stopAcceptingAnswers,
                submitAnswer,
                gradeQuestion,
                calculateScores,
                resetQuestion,
                updatePlayerScore,
                overridePlayerResult,
                kickPlayer,
            }}
        >
            {children}
        </QuizContext.Provider>
    );
}

export function useQuiz() {
    const context = useContext(QuizContext);
    if (context === undefined) {
        throw new Error("useQuiz must be used within a QuizProvider");
    }
    return context;
}
