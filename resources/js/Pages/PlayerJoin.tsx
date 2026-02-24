import { useState } from "react";
import { router } from "@inertiajs/react";
import { useQuiz } from "@/Contexts/QuizContext";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { User } from "lucide-react";
import { toast } from "sonner";

const MAX_NAME_LENGTH = 20;

interface Props {
    roomId: string;
}

export default function PlayerJoin({ roomId }: Props) {
    const { addPlayer } = useQuiz();
    const [name, setName] = useState("");

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            try {
                const playerId = await addPlayer(name.trim(), roomId);
                // プレイヤーIDをセッションストレージに保存（前のゲームの回答状態はリセット）
                sessionStorage.setItem("playerId", playerId);
                sessionStorage.removeItem("hasSubmitted");
                router.visit(`/play/${roomId}/answer`);
            } catch (error) {
                console.error("Failed to join room:", error);
                toast.error("ルームへの参加に失敗しました");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-teal-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <User className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-center">クイズに参加</CardTitle>
                    <CardDescription className="text-center">
                        ルームID: {roomId}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleJoin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">ニックネーム</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="名前を入力してください"
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value.slice(
                                            0,
                                            MAX_NAME_LENGTH,
                                        ),
                                    )
                                }
                                maxLength={MAX_NAME_LENGTH}
                                autoFocus
                                required
                            />
                            <p
                                className={`text-xs text-right ${name.length >= MAX_NAME_LENGTH ? "text-red-500" : "text-gray-400"}`}
                            >
                                {name.length}/{MAX_NAME_LENGTH}
                            </p>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={!name.trim()}
                        >
                            参加する
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
