import { useState, useEffect } from "react";
import { useQuiz } from "@/Contexts/QuizContext";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import { Separator } from "@/Components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import {
    Check,
    Circle,
    X,
    Users,
    Play,
    StopCircle,
    RotateCcw,
    Trophy,
    CircleDot,
    ListOrdered,
    Type,
    Pencil,
    UserMinus,
    RefreshCcw,
} from "lucide-react";
import type { QuestionType } from "@/Contexts/QuizContext";

export default function Host() {
    const {
        roomCode,
        players,
        currentQuestion,
        isAcceptingAnswers,
        createRoom,
        resetRoom,
        joinRoom,
        setCurrentQuestion,
        startAcceptingAnswers,
        gradeQuestion,
        resetQuestion,
        updatePlayerScore,
        overridePlayerResult,
        kickPlayer,
    } = useQuiz();

    // ルームコードをlocalStorageに保存（リロード復元用）
    useEffect(() => {
        if (roomCode) {
            localStorage.setItem("hostRoomCode", roomCode);
        }
    }, [roomCode]);

    // リロード時は保存済みのルームに復帰、なければ新規作成
    useEffect(() => {
        const savedRoomCode = localStorage.getItem("hostRoomCode");
        if (savedRoomCode) {
            joinRoom(savedRoomCode).catch(() => {
                // ルームが存在しない場合は新規作成
                localStorage.removeItem("hostRoomCode");
                createRoom();
            });
        } else {
            createRoom();
        }
    }, []);

    const [selectedType, setSelectedType] =
        useState<QuestionType>("multiple-choice");
    const [correctAnswer, setCorrectAnswer] = useState<string>("");
    const [editingPlayer, setEditingPlayer] = useState<{
        id: string;
        name: string;
        score: number;
    } | null>(null);
    const [newScore, setNewScore] = useState<string>("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [canSetAnswer, setCanSetAnswer] = useState(true); // 初期状態は設定可能
    const [kickTarget, setKickTarget] = useState<{
        id: string | number;
        name: string;
    } | null>(null);
    const [showResetRoomDialog, setShowResetRoomDialog] = useState(false);

    // リロード復元時: currentQuestion の変化に合わせてローカルUI状態を同期
    useEffect(() => {
        if (currentQuestion) {
            setSelectedType(currentQuestion.type);
            setCanSetAnswer(false);
            if (currentQuestion.correctAnswer !== undefined) {
                if (typeof currentQuestion.correctAnswer === "boolean") {
                    setCorrectAnswer(
                        currentQuestion.correctAnswer ? "true" : "false",
                    );
                } else {
                    setCorrectAnswer(currentQuestion.correctAnswer as string);
                }
            }
        }
    }, [currentQuestion]);

    const playerUrl = roomCode
        ? `${window.location.origin}/play/${roomCode}`
        : "";

    const handleStartQuestion = () => {
        setCurrentQuestion({
            type: selectedType,
            correctAnswer:
                selectedType === "true-false"
                    ? correctAnswer === "true"
                    : correctAnswer,
        });
        startAcceptingAnswers();
        setCanSetAnswer(false); // 問題開始後は正解設定を無効にする
    };

    const handleStopAndCalculate = async () => {
        try {
            await gradeQuestion();
            // stopAcceptingAnswers is automatically called by gradeQuestion
        } catch (error) {
            console.error("Failed to grade question:", error);
            toast.error("採点に失敗しました");
        }
    };

    const handleReset = async () => {
        await resetQuestion();
        setCorrectAnswer("");
        setCanSetAnswer(true); // リセット後は正解設定を有効にする
    };

    const handleResetRoom = async () => {
        try {
            localStorage.removeItem("hostRoomCode");
            await resetRoom();
            setCorrectAnswer("");
            setCanSetAnswer(true);
            setShowResetRoomDialog(false);
            toast.success("新しいルームを作成しました");
        } catch {
            toast.error("ルームの作り直しに失敗しました");
        }
    };

    const handleOverridePlayerResult = async (
        playerId: string | number,
        makeCorrect: boolean,
    ) => {
        try {
            await overridePlayerResult(playerId.toString(), makeCorrect);
            toast.success(makeCorrect ? "正解に変更しました" : "不正解に変更しました");
        } catch {
            toast.error("変更に失敗しました");
        }
    };

    const handleOpenEditScore = (player: {
        id: string | number;
        name: string;
        score: number;
    }) => {
        setEditingPlayer({ ...player, id: player.id.toString() });
        setNewScore(player.score.toString());
        setIsDialogOpen(true);
    };

    const handleKickPlayer = (player: {
        id: string | number;
        name: string;
    }) => {
        setKickTarget(player);
    };

    const handleConfirmKick = async () => {
        if (!kickTarget) return;
        try {
            await kickPlayer(kickTarget.id.toString());
            toast.success(`${kickTarget.name} をキックしました`);
        } catch {
            toast.error("キックに失敗しました");
        } finally {
            setKickTarget(null);
        }
    };

    const handleSaveScore = async () => {
        if (editingPlayer) {
            const scoreValue = parseInt(newScore, 10);
            if (!isNaN(scoreValue) && scoreValue >= 0) {
                try {
                    await updatePlayerScore(
                        editingPlayer.id.toString(),
                        scoreValue,
                    );
                    setIsDialogOpen(false);
                    setEditingPlayer(null);
                    setNewScore("");
                } catch (error) {
                    console.error("Failed to update score:", error);
                    toast.error("スコアの更新に失敗しました");
                }
            }
        }
    };

    const handleAdjustScore = (adjustment: number) => {
        if (editingPlayer) {
            const currentScore = parseInt(newScore, 10) || 0;
            const adjusted = Math.max(0, currentScore + adjustment);
            setNewScore(adjusted.toString());
        }
    };

    const answeredCount = players.filter((p) => p.answer !== undefined).length;
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    // 同点のプレイヤーには同じ順位を返す (例: 1,1,1,4,5)
    const getRank = (index: number): number => {
        if (index === 0) return 1;
        return sortedPlayers[index].score === sortedPlayers[index - 1].score
            ? getRank(index - 1)
            : index + 1;
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl mb-2">ホスト画面</h1>
                        <p className="text-gray-600">
                            ルームコード: {roomCode || "作成中..."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentQuestion && (
                            <Badge
                                className={`text-sm px-3 py-1.5 ${isAcceptingAnswers ? "bg-green-500 hover:bg-green-500" : "bg-gray-500 hover:bg-gray-500"} text-white`}
                            >
                                {isAcceptingAnswers ? "● 受付中" : "■ 停止中"}
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowResetRoomDialog(true)}
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                        >
                            <RefreshCcw className="w-4 h-4 mr-1" />
                            ルーム作り直す
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* 左側: QRコードと参加者 */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>参加用QRコード</CardTitle>
                                <CardDescription>
                                    プレイヤーはこちらから参加
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                {roomCode ? (
                                    <>
                                        <div className="bg-white p-4 rounded-lg">
                                            <QRCode
                                                value={playerUrl}
                                                size={200}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4 text-center break-all">
                                            {playerUrl}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 py-8">
                                        ルーム作成中...
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    参加者 ({players.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {players.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        参加者を待っています...
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-75 overflow-y-auto">
                                        {players.map((player) => (
                                            <div
                                                key={player.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {player.name}
                                                    </p>
                                                    {currentQuestion &&
                                                        player.answer !==
                                                            undefined && (
                                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                                {player.isCorrect !==
                                                                undefined ? (
                                                                    <button
                                                                        type="button"
                                                                        title={player.isCorrect ? "クリックで不正解にする" : "クリックで正解にする"}
                                                                        onClick={() =>
                                                                            !isAcceptingAnswers &&
                                                                            handleOverridePlayerResult(
                                                                                player.id,
                                                                                !player.isCorrect,
                                                                            )
                                                                        }
                                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
                                                                            isAcceptingAnswers
                                                                                ? "cursor-default"
                                                                                : "cursor-pointer hover:opacity-75 hover:scale-105"
                                                                        } ${
                                                                            player.isCorrect
                                                                                ? "bg-green-500 text-white"
                                                                                : "bg-gray-200 text-gray-700"
                                                                        }`}
                                                                    >
                                                                        {player.isCorrect
                                                                            ? "正解"
                                                                            : "不正解"}
                                                                    </button>
                                                                ) : (
                                                                    <Badge variant="outline">
                                                                        回答済み
                                                                    </Badge>
                                                                )}
                                                                {player.isCorrect !==
                                                                    undefined && (
                                                                    <Badge variant="outline">
                                                                        回答:{" "}
                                                                        {typeof player.answer ===
                                                                        "boolean"
                                                                            ? player.answer
                                                                                ? "マル"
                                                                                : "バツ"
                                                                            : player.answer ===
                                                                                "true"
                                                                              ? "マル"
                                                                              : player.answer ===
                                                                                  "false"
                                                                                ? "バツ"
                                                                                : player.answer}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <p className="font-semibold">
                                                        {player.score}点
                                                    </p>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            onClick={() =>
                                                                handleOpenEditScore(
                                                                    player,
                                                                )
                                                            }
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() =>
                                                                handleKickPlayer(
                                                                    player,
                                                                )
                                                            }
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* 右側: 問題管理とランキング */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="question">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="question">
                                    問題管理
                                </TabsTrigger>
                                <TabsTrigger value="ranking">
                                    ランキング
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="question" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>問題設定</CardTitle>
                                        <CardDescription>
                                            問題形式を選択して正解を設定してください
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-base">
                                                問題形式を選択
                                            </Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedType(
                                                            "true-false",
                                                        );
                                                        setCorrectAnswer("");
                                                    }}
                                                    disabled={
                                                        !canSetAnswer ||
                                                        isAcceptingAnswers
                                                    }
                                                    className={`p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                                                        selectedType ===
                                                        "true-false"
                                                            ? "border-indigo-500 bg-indigo-50 shadow-md"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    } ${!canSetAnswer || isAcceptingAnswers ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                >
                                                    <CircleDot
                                                        className={`w-10 h-10 mx-auto mb-3 ${
                                                            selectedType ===
                                                            "true-false"
                                                                ? "text-indigo-600"
                                                                : "text-gray-400"
                                                        }`}
                                                    />
                                                    <p
                                                        className={`font-semibold text-sm ${
                                                            selectedType ===
                                                            "true-false"
                                                                ? "text-indigo-900"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        マルバツ
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        ○×問題
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedType(
                                                            "multiple-choice",
                                                        );
                                                        setCorrectAnswer("");
                                                    }}
                                                    disabled={
                                                        !canSetAnswer ||
                                                        isAcceptingAnswers
                                                    }
                                                    className={`p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                                                        selectedType ===
                                                        "multiple-choice"
                                                            ? "border-indigo-500 bg-indigo-50 shadow-md"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    } ${!canSetAnswer || isAcceptingAnswers ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                >
                                                    <ListOrdered
                                                        className={`w-10 h-10 mx-auto mb-3 ${
                                                            selectedType ===
                                                            "multiple-choice"
                                                                ? "text-indigo-600"
                                                                : "text-gray-400"
                                                        }`}
                                                    />
                                                    <p
                                                        className={`font-semibold text-sm ${
                                                            selectedType ===
                                                            "multiple-choice"
                                                                ? "text-indigo-900"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        4択
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        A/B/C/D
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedType(
                                                            "text-input",
                                                        );
                                                        setCorrectAnswer("");
                                                    }}
                                                    disabled={
                                                        !canSetAnswer ||
                                                        isAcceptingAnswers
                                                    }
                                                    className={`p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                                                        selectedType ===
                                                        "text-input"
                                                            ? "border-indigo-500 bg-indigo-50 shadow-md"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    } ${!canSetAnswer || isAcceptingAnswers ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                >
                                                    <Type
                                                        className={`w-10 h-10 mx-auto mb-3 ${
                                                            selectedType ===
                                                            "text-input"
                                                                ? "text-indigo-600"
                                                                : "text-gray-400"
                                                        }`}
                                                    />
                                                    <p
                                                        className={`font-semibold text-sm ${
                                                            selectedType ===
                                                            "text-input"
                                                                ? "text-indigo-900"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        文字入力
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        テキスト
                                                    </p>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-base">
                                                正解を設定
                                            </Label>
                                            {selectedType === "true-false" ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setCorrectAnswer(
                                                                "true",
                                                            )
                                                        }
                                                        disabled={
                                                            !canSetAnswer ||
                                                            isAcceptingAnswers
                                                        }
                                                        className={`p-8 rounded-xl border-2 transition-all hover:scale-105 ${
                                                            correctAnswer ===
                                                            "true"
                                                                ? "border-green-500 bg-green-50 shadow-lg"
                                                                : "border-gray-200 bg-white hover:border-gray-300"
                                                        } ${!canSetAnswer || isAcceptingAnswers ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                    >
                                                        <Circle
                                                            className={`w-16 h-16 mx-auto ${
                                                                correctAnswer ===
                                                                "true"
                                                                    ? "text-green-600"
                                                                    : "text-gray-400"
                                                            }`}
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setCorrectAnswer(
                                                                "false",
                                                            )
                                                        }
                                                        disabled={
                                                            !canSetAnswer ||
                                                            isAcceptingAnswers
                                                        }
                                                        className={`p-8 rounded-xl border-2 transition-all hover:scale-105 ${
                                                            correctAnswer ===
                                                            "false"
                                                                ? "border-red-500 bg-red-50 shadow-lg"
                                                                : "border-gray-200 bg-white hover:border-gray-300"
                                                        } ${!canSetAnswer || isAcceptingAnswers ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                    >
                                                        <X
                                                            className={`w-16 h-16 mx-auto ${
                                                                correctAnswer ===
                                                                "false"
                                                                    ? "text-red-600"
                                                                    : "text-gray-400"
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                            ) : selectedType ===
                                              "multiple-choice" ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {["A", "B", "C", "D"].map(
                                                        (option) => (
                                                            <button
                                                                key={option}
                                                                type="button"
                                                                onClick={() =>
                                                                    setCorrectAnswer(
                                                                        option,
                                                                    )
                                                                }
                                                                disabled={
                                                                    !canSetAnswer ||
                                                                    isAcceptingAnswers
                                                                }
                                                                className={`p-8 rounded-xl border-2 transition-all hover:scale-105 ${
                                                                    correctAnswer ===
                                                                    option
                                                                        ? "border-indigo-500 bg-indigo-50 shadow-lg"
                                                                        : "border-gray-200 bg-white hover:border-gray-300"
                                                                } ${!canSetAnswer || isAcceptingAnswers ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                            >
                                                                <p
                                                                    className={`text-5xl font-bold ${
                                                                        correctAnswer ===
                                                                        option
                                                                            ? "text-indigo-600"
                                                                            : "text-gray-400"
                                                                    }`}
                                                                >
                                                                    {option}
                                                                </p>
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                                                    <Input
                                                        id="correct-answer"
                                                        placeholder="正解のテキストを入力してください"
                                                        value={correctAnswer}
                                                        onChange={(e) =>
                                                            setCorrectAnswer(
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            !canSetAnswer ||
                                                            isAcceptingAnswers
                                                        }
                                                        className="text-lg h-14 border-0 focus-visible:ring-0 px-2"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="flex flex-col gap-3">
                                            {!currentQuestion ? (
                                                <Button
                                                    onClick={
                                                        handleStartQuestion
                                                    }
                                                    disabled={!correctAnswer}
                                                    size="lg"
                                                    className="w-full"
                                                >
                                                    <Play className="w-4 h-4 mr-2" />
                                                    回答受付開始
                                                </Button>
                                            ) : isAcceptingAnswers ? (
                                                <>
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                        <p className="text-sm font-semibold text-green-800 mb-2">
                                                            回答受付中...
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-green-700">
                                                                {answeredCount}{" "}
                                                                /{" "}
                                                                {players.length}{" "}
                                                                人が回答
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-white"
                                                            >
                                                                {Math.round(
                                                                    (answeredCount /
                                                                        Math.max(
                                                                            players.length,
                                                                            1,
                                                                        )) *
                                                                        100,
                                                                )}
                                                                %
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={
                                                            handleStopAndCalculate
                                                        }
                                                        size="lg"
                                                        variant="destructive"
                                                        className="w-full"
                                                    >
                                                        <StopCircle className="w-4 h-4 mr-2" />
                                                        回答締切 & 採点
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                        <p className="text-sm font-semibold text-blue-800 mb-2">
                                                            採点完了
                                                        </p>
                                                        <div className="flex items-center gap-4 text-sm text-blue-700">
                                                            <span className="flex items-center gap-1">
                                                                <Check className="w-4 h-4" />
                                                                正解:{" "}
                                                                {
                                                                    players.filter(
                                                                        (p) =>
                                                                            p.isCorrect,
                                                                    ).length
                                                                }
                                                                人
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <X className="w-4 h-4" />
                                                                不正解:{" "}
                                                                {
                                                                    players.filter(
                                                                        (p) =>
                                                                            p.isCorrect ===
                                                                            false,
                                                                    ).length
                                                                }
                                                                人
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={handleReset}
                                                        size="lg"
                                                        variant="outline"
                                                        className="w-full"
                                                    >
                                                        <RotateCcw className="w-4 h-4 mr-2" />
                                                        次の問題へリセット
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="ranking">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-yellow-500" />
                                            ランキング
                                        </CardTitle>
                                        <CardDescription>
                                            現在の得点順位
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {sortedPlayers.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-8">
                                                参加者がいません
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {sortedPlayers.map(
                                                    (player, index) => {
                                                        const rank =
                                                            getRank(index);
                                                        return (
                                                            <div
                                                                key={player.id}
                                                                className={`flex items-center gap-4 p-4 rounded-lg ${
                                                                    rank === 1
                                                                        ? "bg-linear-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300"
                                                                        : rank ===
                                                                            2
                                                                          ? "bg-linear-to-r from-gray-50 to-slate-50 border border-gray-300"
                                                                          : rank ===
                                                                              3
                                                                            ? "bg-linear-to-r from-orange-50 to-amber-50 border border-orange-300"
                                                                            : "bg-gray-50"
                                                                }`}
                                                            >
                                                                <div className="shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center border-2">
                                                                    <span className="font-bold text-lg">
                                                                        {rank}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="font-semibold">
                                                                        {
                                                                            player.name
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-bold text-indigo-600">
                                                                        {
                                                                            player.score
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        ポイント
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* ルーム作り直し確認ダイアログ */}
            <AlertDialog
                open={showResetRoomDialog}
                onOpenChange={setShowResetRoomDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ルームを作り直しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                            現在のルームと全参加者データが削除され、新しいルームが作成されます。この操作は取り消せません。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetRoom}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            作り直す
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* キック確認ダイアログ */}
            <AlertDialog
                open={kickTarget !== null}
                onOpenChange={(open) => !open && setKickTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>プレイヤーをキック</AlertDialogTitle>
                        <AlertDialogDescription>
                            「{kickTarget?.name}
                            」をルームから退出させますか？この操作は取り消せません。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmKick}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            キック
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* スコア編集ダイアログ */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-125">
                    <DialogHeader>
                        <DialogTitle>スコア編集</DialogTitle>
                        <DialogDescription>
                            {editingPlayer && (
                                <>
                                    プレイヤー:{" "}
                                    <span className="font-semibold">
                                        {editingPlayer.name}
                                    </span>
                                    <br />
                                    現在のスコア:{" "}
                                    <span className="font-semibold">
                                        {editingPlayer.score}点
                                    </span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>クイック調整</Label>
                            <div className="grid grid-cols-4 gap-2">
                                <Button
                                    onClick={() => handleAdjustScore(-100)}
                                    size="lg"
                                    variant="outline"
                                    className="h-16"
                                >
                                    <span className="text-lg font-bold">
                                        -100
                                    </span>
                                </Button>
                                <Button
                                    onClick={() => handleAdjustScore(-50)}
                                    size="lg"
                                    variant="outline"
                                    className="h-16"
                                >
                                    <span className="text-lg font-bold">
                                        -50
                                    </span>
                                </Button>
                                <Button
                                    onClick={() => handleAdjustScore(50)}
                                    size="lg"
                                    variant="outline"
                                    className="h-16"
                                >
                                    <span className="text-lg font-bold">
                                        +50
                                    </span>
                                </Button>
                                <Button
                                    onClick={() => handleAdjustScore(100)}
                                    size="lg"
                                    variant="outline"
                                    className="h-16"
                                >
                                    <span className="text-lg font-bold">
                                        +100
                                    </span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-score">新しいスコア</Label>
                            <Input
                                id="new-score"
                                type="number"
                                placeholder="スコアを入力"
                                value={newScore}
                                onChange={(e) => setNewScore(e.target.value)}
                                className="text-2xl h-16 text-center font-bold"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            onClick={() => setIsDialogOpen(false)}
                            variant="outline"
                        >
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleSaveScore}
                            disabled={
                                !newScore || isNaN(parseInt(newScore, 10))
                            }
                        >
                            保存
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
