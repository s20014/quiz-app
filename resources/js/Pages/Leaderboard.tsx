import { useQuiz } from "@/Contexts/QuizContext";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { Link } from "@inertiajs/react";

interface Props {
    roomId?: string;
}

export default function Leaderboard({ roomId }: Props) {
    const { players } = useQuiz();

    // スコア順にソート
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    const getRankBadgeColor = (rank: number) => {
        if (rank === 1)
            return "bg-linear-to-br from-yellow-400 to-yellow-600 text-white";
        if (rank === 2)
            return "bg-linear-to-br from-gray-300 to-gray-500 text-white";
        if (rank === 3)
            return "bg-linear-to-br from-amber-500 to-amber-700 text-white";
        return "bg-gray-100 text-gray-700";
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 pb-20">
            <div className="max-w-3xl mx-auto pt-8">
                {/* ヘッダー */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                        <Trophy className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h1 className="text-4xl mb-2">リーダーボード</h1>
                    <p className="text-gray-600">現在の順位とスコア</p>
                </div>

                {/* トップ3 */}
                {sortedPlayers.length > 0 && (
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        {/* 2位 */}
                        {sortedPlayers[1] && (
                            <div className="md:order-1 order-2">
                                <Card className="border-2 border-gray-300 bg-linear-to-br from-gray-50 to-gray-100">
                                    <CardContent className="pt-6 text-center">
                                        <div className="flex justify-center mb-3">
                                            <Medal className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <div className="text-6xl font-bold text-gray-400 mb-2">
                                            2
                                        </div>
                                        <p className="text-lg font-semibold mb-2">
                                            {sortedPlayers[1].name}
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Trophy className="w-5 h-5 text-yellow-500" />
                                            <p className="text-2xl font-bold text-indigo-600">
                                                {sortedPlayers[1].score}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* 1位（中央・大きめ） */}
                        {sortedPlayers[0] && (
                            <div className="md:order-2 order-1">
                                <Card className="border-4 border-yellow-400 bg-linear-to-br from-yellow-50 to-amber-100 md:transform md:scale-110">
                                    <CardContent className="pt-8 text-center">
                                        <div className="flex justify-center mb-4">
                                            <Crown className="w-16 h-16 text-yellow-500" />
                                        </div>
                                        <div className="text-7xl font-bold text-yellow-600 mb-3">
                                            1
                                        </div>
                                        <p className="text-xl font-bold mb-3">
                                            {sortedPlayers[0].name}
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Trophy className="w-6 h-6 text-yellow-600" />
                                            <p className="text-3xl font-bold text-indigo-600">
                                                {sortedPlayers[0].score}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* 3位 */}
                        {sortedPlayers[2] && (
                            <div className="md:order-3 order-3">
                                <Card className="border-2 border-amber-600 bg-linear-to-br from-amber-50 to-orange-100">
                                    <CardContent className="pt-6 text-center">
                                        <div className="flex justify-center mb-3">
                                            <Award className="w-12 h-12 text-amber-600" />
                                        </div>
                                        <div className="text-6xl font-bold text-amber-600 mb-2">
                                            3
                                        </div>
                                        <p className="text-lg font-semibold mb-2">
                                            {sortedPlayers[2].name}
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Trophy className="w-5 h-5 text-yellow-500" />
                                            <p className="text-2xl font-bold text-indigo-600">
                                                {sortedPlayers[2].score}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {/* 4位以下のリスト */}
                {sortedPlayers.length > 3 && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold mb-4 text-center">
                            その他の参加者
                        </h2>
                        {sortedPlayers.slice(3).map((player, index) => {
                            const rank = index + 4;
                            return (
                                <Card
                                    key={player.id}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <CardContent className="py-4">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeColor(rank)}`}
                                            >
                                                {rank}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-lg">
                                                    {player.name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-5 h-5 text-yellow-500" />
                                                <p className="text-2xl font-bold text-indigo-600">
                                                    {player.score}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* プレイヤーがいない場合 */}
                {sortedPlayers.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-xl font-semibold text-gray-500">
                                まだ参加者がいません
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* 戻るボタン */}
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
                    <Link href={roomId ? `/play/${roomId}/answer` : "/"}>
                        <Button
                            size="lg"
                            variant="outline"
                            className="shadow-lg"
                        >
                            解答画面に戻る
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
