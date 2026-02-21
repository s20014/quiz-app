import { useState, useEffect } from 'react';
import { useQuiz } from '@/Contexts/QuizContext';
import { playerApi } from '@/services/api';
import type { Player } from '@/Contexts/QuizContext';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Check, X, Trophy, Clock } from 'lucide-react';
import LeaderboardModal from '@/Components/LeaderboardModal';

interface Props {
  roomId: string;
}

export default function PlayerAnswer({ roomId }: Props) {
  const { players, currentQuestion, isAcceptingAnswers, submitAnswer, joinRoom } = useQuiz();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [hasSubmitted, setHasSubmittedState] = useState<boolean>(() => {
    return sessionStorage.getItem('hasSubmitted') === 'true';
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const setHasSubmitted = (value: boolean) => {
    setHasSubmittedState(value);
    sessionStorage.setItem('hasSubmitted', value.toString());
  };

  // Join room channel to receive events
  useEffect(() => {
    joinRoom(roomId);
  }, [roomId, joinRoom]);

  // Fetch player data from API
  useEffect(() => {
    const fetchPlayer = async () => {
      const storedPlayerId = sessionStorage.getItem('playerId');
      if (!storedPlayerId) {
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
        // If player has already answered, set hasSubmitted to true
        if (player.current_answer) {
          setHasSubmitted(true);
        }
      } catch (error) {
        console.error('Failed to fetch player:', error);
      }
    };

    fetchPlayer();
  }, []);

  // Update player from WebSocket when available
  useEffect(() => {
    if (playerId && players.length > 0) {
      const updatedPlayer = players.find(p => p.id.toString() === playerId);
      if (updatedPlayer) {
        setCurrentPlayer(updatedPlayer);
      }
    }
  }, [players, playerId]);

  const handleSubmit = async () => {
    if (!playerId || !selectedAnswer) return;

    const answer = currentQuestion?.type === 'true-false'
      ? selectedAnswer === 'true'
      : selectedAnswer;

    try {
      await submitAnswer(playerId, answer);
      setHasSubmitted(true);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('回答の送信に失敗しました');
    }
  };

  // 新しい問題が始まったらリセット
  useEffect(() => {
    if (isAcceptingAnswers && currentPlayer?.answer === undefined) {
      setHasSubmitted(false);
      setSelectedAnswer('');
    }
  }, [isAcceptingAnswers, currentPlayer]);

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
                <p className="text-sm text-gray-500">プレイヤー名</p>
                <p className="text-2xl font-bold">{currentPlayer.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">現在のスコア</p>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <p className="text-2xl font-bold text-indigo-600">{currentPlayer.score}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 回答画面 */}
        {!currentQuestion ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold mb-2">待機中...</p>
              <p className="text-gray-500">ホストが問題を出題するまでお待ちください</p>
            </CardContent>
          </Card>
        ) : hasSubmitted || currentPlayer.answer !== undefined ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-xl font-semibold mb-2">回答を送信しました！</p>
              <p className="text-gray-500">結果発表をお待ちください</p>
              {currentPlayer.isCorrect !== undefined && (
                <>
                  <div className="mt-6">
                    <Badge
                      variant={currentPlayer.isCorrect ? 'default' : 'secondary'}
                      className="text-lg px-6 py-2"
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
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>回答を選択してください</CardTitle>
              <CardDescription>
                {currentQuestion.type === 'true-false' && 'マルバツ問題'}
                {currentQuestion.type === 'multiple-choice' && '4択問題'}
                {currentQuestion.type === 'text-input' && '文字入力問題'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.type === 'true-false' && (
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    variant={selectedAnswer === 'true' ? 'default' : 'outline'}
                    onClick={() => setSelectedAnswer('true')}
                    disabled={!isAcceptingAnswers}
                    className="h-24 text-lg"
                  >
                    <Check className="w-6 h-6 mr-2" />
                    マル
                  </Button>
                  <Button
                    size="lg"
                    variant={selectedAnswer === 'false' ? 'default' : 'outline'}
                    onClick={() => setSelectedAnswer('false')}
                    disabled={!isAcceptingAnswers}
                    className="h-24 text-lg"
                  >
                    <X className="w-6 h-6 mr-2" />
                    バツ
                  </Button>
                </div>
              )}

              {currentQuestion.type === 'multiple-choice' && (
                <div className="grid grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <Button
                      key={option}
                      size="lg"
                      variant={selectedAnswer === option ? 'default' : 'outline'}
                      onClick={() => setSelectedAnswer(option)}
                      disabled={!isAcceptingAnswers}
                      className="h-24 text-xl font-bold"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'text-input' && (
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="回答を入力してください"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    disabled={!isAcceptingAnswers}
                    className="text-lg h-14"
                    autoFocus
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!isAcceptingAnswers || !selectedAnswer}
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

        {/* リーダーボードボタン */}
        <div className="mt-6 text-center">
          <Button variant="outline" size="lg" className="gap-2" onClick={() => setShowLeaderboard(true)}>
            <Trophy className="w-5 h-5 text-yellow-500" />
            リーダーボードを見る
          </Button>
        </div>
      </div>

      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
}