import { useQuiz } from "@/Contexts/QuizContext";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Users, Check, X, Clock, Circle } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function PlayersStatusModal({ isOpen, onClose }: Props) {
    const { players, currentQuestion, isAcceptingAnswers } = useQuiz();

    if (!isOpen) return null;

    const answeredCount = players.filter((p) => p.answer !== undefined).length;
    const isGraded = players.some((p) => p.isCorrect !== undefined);

    const formatAnswer = (answer: string | boolean | undefined) => {
        if (answer === undefined) return null;
        if (typeof answer === "boolean")
            return answer ? "マル" : "バツ";
        if (answer === "true") return "マル";
        if (answer === "false") return "バツ";
        return answer;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center">
            {/* 背景オーバーレイ */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* モーダル本体 */}
            <div className="relative w-full max-w-md mx-4 mt-8 mb-8 max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
                {/* 閉じるボタン */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 hover:bg-gray-100 rounded-full cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </Button>

                <div className="p-6 pb-8">
                    {/* ヘッダー */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-full mb-3">
                            <Users className="w-7 h-7 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold">
                            {isGraded ? "回答結果" : "みんなの回答状況"}
                        </h2>
                        {currentQuestion && (
                            <p className="text-sm text-gray-500 mt-1">
                                {isGraded
                                    ? "採点が完了しました"
                                    : isAcceptingAnswers
                                      ? `${answeredCount} / ${players.length} 人が回答済み`
                                      : "回答を締め切りました"}
                            </p>
                        )}
                    </div>

                    {/* 問題なし */}
                    {!currentQuestion ? (
                        <div className="text-center py-10">
                            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">
                                問題が出題されていません
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* 回答進捗バー（採点前のみ） */}
                            {!isGraded && (
                                <div className="mb-5">
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                            style={{
                                                width:
                                                    players.length > 0
                                                        ? `${(answeredCount / players.length) * 100}%`
                                                        : "0%",
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* プレイヤー一覧 */}
                            {players.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        参加者がいません
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {players.map((player) => (
                                        <div
                                            key={player.id}
                                            className={`flex items-center justify-between p-3 rounded-xl border ${
                                                isGraded
                                                    ? player.isCorrect
                                                        ? "border-green-200 bg-green-50"
                                                        : "border-red-200 bg-red-50"
                                                    : player.answer !== undefined
                                                      ? "border-indigo-200 bg-indigo-50"
                                                      : "border-gray-200 bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* アイコン */}
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                        isGraded
                                                            ? player.isCorrect
                                                                ? "bg-green-500"
                                                                : "bg-red-500"
                                                            : player.answer !== undefined
                                                              ? "bg-indigo-500"
                                                              : "bg-gray-300"
                                                    }`}
                                                >
                                                    {isGraded ? (
                                                        player.isCorrect ? (
                                                            <Check className="w-4 h-4 text-white" />
                                                        ) : (
                                                            <X className="w-4 h-4 text-white" />
                                                        )
                                                    ) : player.answer !== undefined ? (
                                                        <Check className="w-4 h-4 text-white" />
                                                    ) : (
                                                        <Clock className="w-4 h-4 text-white" />
                                                    )}
                                                </div>

                                                {/* 名前 */}
                                                <span className="font-medium text-sm">
                                                    {player.name}
                                                </span>
                                            </div>

                                            {/* 右側: ステータス or 回答内容 */}
                                            <div className="flex items-center gap-2">
                                                {isGraded ? (
                                                    <>
                                                        {/* 回答内容 */}
                                                        {player.answer !== undefined && (
                                                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                                                {currentQuestion.type === "true-false" ? (
                                                                    formatAnswer(player.answer) === "マル" ? (
                                                                        <Circle className="w-5 h-5 text-gray-500" />
                                                                    ) : (
                                                                        <X className="w-5 h-5 text-gray-500" />
                                                                    )
                                                                ) : (
                                                                    formatAnswer(player.answer)
                                                                )}
                                                            </span>
                                                        )}
                                                        {/* 正解/不正解 */}
                                                        <Badge
                                                            className={
                                                                player.isCorrect
                                                                    ? "bg-green-500 hover:bg-green-500 text-white text-xs"
                                                                    : "bg-red-500 hover:bg-red-500 text-white text-xs"
                                                            }
                                                        >
                                                            {player.isCorrect
                                                                ? "正解"
                                                                : "不正解"}
                                                        </Badge>
                                                    </>
                                                ) : (
                                                    <Badge
                                                        variant={
                                                            player.answer !== undefined
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className={
                                                            player.answer !== undefined
                                                                ? "bg-indigo-500 hover:bg-indigo-500 text-xs"
                                                                : "text-xs"
                                                        }
                                                    >
                                                        {player.answer !== undefined
                                                            ? "回答済み"
                                                            : "待機中"}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
