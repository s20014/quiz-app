import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Presentation, User } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [roomId, setRoomId] = useState('');

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.visit(`/play/${roomId.trim()}`);
    }
  };

  return (
    <>
      <Head title="ホーム" />
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2">クイズアプリ</h1>
            <p className="text-lg text-gray-600">リアルタイムでクイズを楽しもう！</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Presentation className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>ホストとして開始</CardTitle>
                <CardDescription>
                  クイズを出題して参加者の回答を集計します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/host">
                  <Button className="w-full" size="lg">
                    ホスト画面を開く
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>プレイヤーとして参加</CardTitle>
                <CardDescription>
                  ルームIDを入力して参加してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-id">ルームID</Label>
                    <Input
                      id="room-id"
                      type="text"
                      placeholder="例: abc123"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toLowerCase())}
                      className="uppercase"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={!roomId.trim()}>
                    参加する
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    または、ホストが表示するQRコードを読み取ってください
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
