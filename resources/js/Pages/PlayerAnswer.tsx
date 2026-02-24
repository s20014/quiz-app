import { useState, useEffect, useRef } from "react";
import { useQuiz } from "@/Contexts/QuizContext";
import { playerApi } from "@/services/api";
import type { Player } from "@/Contexts/QuizContext";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Check, X, Trophy, Clock, Circle, Users } from "lucide-react";
import LeaderboardModal from "@/Components/LeaderboardModal";
import PlayersStatusModal from "@/Components/PlayersStatusModal";
import { toast } from "sonner";

interface Props {
    roomId: string;
}

export default function PlayerAnswer({ roomId }: Props) {
    const {
        players,
        currentQuestion,
        isAcceptingAnswers,
        submitAnswer,
        joinRoom,
    } = useQuiz();
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string>("");
    const [hasSubmitted, setHasSubmittedState] = useState<boolean>(() => {
        return sessionStorage.getItem("hasSubmitted") === "true";
    });
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showPlayersStatus, setShowPlayersStatus] = useState(false);
    const [isKicked, setIsKicked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // fetchPlayer完了フラグ（これがtrueになるまでリセットeffectをスキップ）
    const [playerLoaded, setPlayerLoaded] = useState(false);
    // 正誤結果のアニメーション用
    const [resultKey, setResultKey] = useState(0);

    const setHasSubmitted = (value: boolean) => {
        setHasSubmittedState(value);
        sessionStorage.setItem("hasSubmitted", value.toString());
    };

    // Join room channel to receive events
    useEffect(() => {
        joinRoom(roomId);
    }, [roomId, joinRoom]);

    // Fetch player data from API
    useEffect(() => {
        const fetchPlayer = async () => {
            const storedPlayerId = sessionStorage.getItem("playerId");
            if (!storedPlayerId) {
                setIsLoading(false);
                return;
            }

            setPlayerId(storedPlayerId);

            try {
                const { player } = await playerApi.getPlayer(storedPlayerId);
                setCurrentPlayer({
                    id: player.id,
                    name: player.name,
                    score: player.score,
                    answer: player.current_answer ?? undefined,
                });
                if (player.current_answer) {
                    setHasSubmitted(true);
                }
            } catch (error) {
                console.error("Failed to fetch player:", error);
            } finally {
                // APIから取得完了。これ以降はリセットeffectを有効にする
                setPlayerLoaded(true);
                setIsLoading(false);
            }
        };

        fetchPlayer();
    }, []);

    // WebSocket更新でcurrentPlayerを反映 / キック検知
    // answerとisCorrectは既存の値を優先してマージ（fetchPlayerの結果を上書きしない）
    useEffect(() => {
        if (!playerId || players.length === 0) return;
        const updatedPlayer = players.find((p) => p.id.toString() === playerId);
        if (updatedPlayer) {
            setCurrentPlayer((prev) => ({
                ...updatedPlayer,
                answer:
                    updatedPlayer.answer !== undefined
                        ? updatedPlayer.answer
                        : prev?.answer,
                isCorrect:
                    updatedPlayer.isCorrect !== undefined
                        ? updatedPlayer.isCorrect
                        : prev?.isCorrect,
            }));
        } else {
            setIsKicked(true);
        }
    }, [players, playerId]);

    // 正誤が確定したらアニメーションをトリガー
    useEffect(() => {
        if (currentPlayer?.isCorrect !== undefined) {
            setResultKey((k) => k + 1);
        }
    }, [currentPlayer?.isCorrect]);

    const handleSubmit = async () => {
        if (!playerId || !selectedAnswer) return;

        const answer =
            currentQuestion?.type === "true-false"
                ? selectedAnswer === "true"
                : selectedAnswer;

        try {
            await submitAnswer(playerId, answer);
            setHasSubmitted(true);
        } catch (error) {
            console.error("Failed to submit answer:", error);
            toast.error("回答の送信に失敗しました");
        }
    };

    // 新しい問題が始まったらリセット
    // playerLoadedがtrueになるまで待つことで、リロード直後の誤リセットを防止
    useEffect(() => {
        if (!playerLoaded) return;
        if (isAcceptingAnswers && currentPlayer?.answer === undefined) {
            setHasSubmitted(false);
            setSelectedAnswer("");
        }
    }, [isAcceptingAnswers, currentPlayer, playerLoaded]);

    // 問題がリセットされた（currentQuestion が null になった）時にリセット
    const prevQuestionRef = useRef<typeof currentQuestion>(undefined);
    useEffect(() => {
        if (!playerLoaded) return;
        if (
            prevQuestionRef.current !== undefined &&
            prevQuestionRef.current !== null &&
            currentQuestion === null
        ) {
            setHasSubmitted(false);
            setSelectedAnswer("");
            setCurrentPlayer((prev) =>
                prev
                    ? { ...prev, answer: undefined, isCorrect: undefined }
                    : null,
            );
        }
        prevQuestionRef.current = currentQuestion;
    }, [currentQuestion, playerLoaded]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-pink-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (isKicked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-50 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-xl font-semibold mb-2">
                            退出されました
                        </p>
                        <p className="text-gray-500">
                            ホストによってルームから退出されました
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!currentPlayer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">エラー</CardTitle>
                        <CardDescription className="text-center">
                            プレイヤー情報が見つかりません
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 p-4">
            <div className="max-w-2xl mx-auto pt-8">
                {/* プレイヤー情報 */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    プレイヤー名
                                </p>
                                <p className="text-2xl font-bold">
                                    {currentPlayer.name}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">
                                    現在のスコア
                                </p>
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    <p className="text-2xl font-bold text-indigo-600">
                                        {currentPlayer.score}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 回答画面: 送信済み > 待機中 > 回答フォーム の順で判定 */}
                {hasSubmitted || currentPlayer.answer !== undefined ? (
                    // 回答送信済み（リロードしても sessionStorage の hasSubmitted で維持）
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-xl font-semibold mb-2">
                                回答を送信しました！
                            </p>
                            <p className="text-gray-500">
                                結果発表をお待ちください
                            </p>
                            {currentPlayer.isCorrect !== undefined && (
                                <div
                                    key={resultKey}
                                    className="mt-6 animate-in fade-in zoom-in duration-500"
                                >
                                    <Badge
                                        variant={
                                            currentPlayer.isCorrect
                                                ? "default"
                                                : "secondary"
                                        }
                                        className={`text-lg px-6 py-2 ${currentPlayer.isCorrect ? "bg-green-500 hover:bg-green-500" : ""}`}
                                    >
                                        {currentPlayer.isCorrect ? (
                                            <>
                                                <Check className="w-5 h-5 mr-2" />
                                                正解！ +100点
                                            </>
                                        ) : (
                                            <>
                                                <X className="w-5 h-5 mr-2" />
                                                残念...
                                            </>
                                        )}
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : !currentQuestion ? (
                    // 問題がまだ出題されていない
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-xl font-semibold mb-2">
                                待機中...
                            </p>
                            <p className="text-gray-500">
                                ホストが問題を出題するまでお待ちください
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    // 回答フォーム（currentQuestion は null でないことが保証される）
                    <Card>
                        <CardHeader>
                            <CardTitle>回答を選択してください</CardTitle>
                            <CardDescription>
                                {currentQuestion.type === "true-false" &&
                                    "マルバツ問題"}
                                {currentQuestion.type === "multiple-choice" &&
                                    "4択問題"}
                                {currentQuestion.type === "text-input" &&
                                    "文字入力問題"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {currentQuestion.type === "true-false" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedAnswer("true")
                                        }
                                        disabled={!isAcceptingAnswers}
                                        className={`p-8 rounded-xl border-2 transition-all hover:scale-105 flex items-center justify-center ${
                                            selectedAnswer === "true"
                                                ? "border-green-500 bg-green-50 shadow-lg"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                        } ${!isAcceptingAnswers ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        <Circle
                                            className={`w-16 h-16 ${
                                                selectedAnswer === "true"
                                                    ? "text-green-600"
                                                    : "text-gray-400"
                                            }`}
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedAnswer("false")
                                        }
                                        disabled={!isAcceptingAnswers}
                                        className={`p-8 rounded-xl border-2 transition-all hover:scale-105 flex items-center justify-center ${
                                            selectedAnswer === "false"
                                                ? "border-red-500 bg-red-50 shadow-lg"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                        } ${!isAcceptingAnswers ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        <X
                                            className={`w-16 h-16 ${
                                                selectedAnswer === "false"
                                                    ? "text-red-600"
                                                    : "text-gray-400"
                                            }`}
                                        />
                                    </button>
                                </div>
                            )}

                            {currentQuestion.type === "multiple-choice" && (
                                <div className="grid grid-cols-2 gap-4">
                                    {["A", "B", "C", "D"].map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() =>
                                                setSelectedAnswer(option)
                                            }
                                            disabled={!isAcceptingAnswers}
                                            className={`p-8 rounded-xl border-2 transition-all hover:scale-105 ${
                                                selectedAnswer === option
                                                    ? "border-indigo-500 bg-indigo-50 shadow-lg"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            } ${!isAcceptingAnswers ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                            <p
                                                className={`text-5xl font-bold ${
                                                    selectedAnswer === option
                                                        ? "text-indigo-600"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                {option}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQuestion.type === "text-input" && (
                                <div className="space-y-4">
                                    <Input
                                        type="text"
                                        placeholder="回答を入力してください"
                                        value={selectedAnswer}
                                        onChange={(e) =>
                                            setSelectedAnswer(e.target.value)
                                        }
                                        disabled={!isAcceptingAnswers}
                                        className="text-lg h-14"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    !isAcceptingAnswers || !selectedAnswer
                                }
                                className="w-full"
                                size="lg"
                            >
                                回答を送信
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <p className="text-center text-sm text-gray-500 mt-6">
                    ルームID: {roomId}
                </p>

                {/* ボタン群 */}
                <div className="mt-6 flex flex-col gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full gap-2 cursor-pointer"
                        onClick={() => setShowPlayersStatus(true)}
                    >
                        <Users className="w-5 h-5 text-indigo-500" />
                        みんなの回答状況を見る
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full gap-2 cursor-pointer"
                        onClick={() => setShowLeaderboard(true)}
                    >
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        リーダーボードを見る
                    </Button>
                </div>
            </div>

            <PlayersStatusModal
                isOpen={showPlayersStatus}
                onClose={() => setShowPlayersStatus(false)}
            />
            <LeaderboardModal
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
            />
        </div>
    );
}
