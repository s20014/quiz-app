import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { roomApi, playerApi, questionApi } from "@/services/api";

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
    joinRoom: (roomCodeParam: string) => Promise<void>;
    addPlayer: (name: string, roomCodeParam?: string) => Promise<string>;
    setCurrentQuestion: (question: Question) => Promise<void>;
    startAcceptingAnswers: () => void;
    stopAcceptingAnswers: () => void;
    submitAnswer: (playerId: string, answer: string | boolean) => Promise<void>;
    gradeQuestion: () => Promise<void>;
    calculateScores: () => void;
    resetQuestion: () => void;
    updatePlayerScore: (playerId: string, newScore: number) => Promise<void>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
    const [roomId, setRoomId] = useState<string | null>(null);
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentQuestion, setCurrentQuestionInternal] =
        useState<Question | null>(null);
    const [isAcceptingAnswers, setIsAcceptingAnswers] = useState(false);

    // Listen for events when room is created
    useEffect(() => {
        if (!roomId || !window.Echo) return;

        const channel = window.Echo.channel(`room.${roomId}`);

        // Listen for player joined
        channel.listen("PlayerJoinedEvent", (event: { player: Player }) => {
            setPlayers((prev) => {
                // Check if player already exists
                const exists = prev.some((p) => p.id === event.player.id);
                if (exists) return prev;

                return [...prev, event.player];
            });
        });

        // Listen for question asked
        channel.listen(
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
        channel.listen(
            "PlayerAnsweredEvent",
            (event: {
                player_id: string | number;
                answer: string | boolean;
            }) => {
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
        channel.listen(
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
        channel.listen(
            "ScoreUpdatedEvent",
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
        );

        return () => {
            window.Echo.leave(`room.${roomId}`);
        };
    }, [roomId]);

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

    const joinRoom = async (roomCodeParam: string) => {
        try {
            const { room } = await roomApi.getRoom(roomCodeParam);
            setRoomId(room.id.toString());
            setRoomCode(room.room_code);
        } catch (error) {
            console.error("Failed to join room:", error);
            throw error;
        }
    };

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

    const resetQuestion = () => {
        setPlayers((prev) =>
            prev.map((p) => ({
                ...p,
                answer: undefined,
                isCorrect: undefined,
            })),
        );
        setCurrentQuestionInternal(null);
        setIsAcceptingAnswers(false);
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

    return (
        <QuizContext.Provider
            value={{
                roomId,
                roomCode,
                players,
                currentQuestion: currentQuestion,
                isAcceptingAnswers,
                createRoom,
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
