<?php

namespace App\Http\Controllers\Api;

use App\Events\QuestionAskedEvent;
use App\Events\QuestionResetEvent;
use App\Http\Controllers\Controller;
use App\Models\QuizRoom;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    /**
     * Start a new question for the room
     */
    public function store(Request $request, $roomId)
    {
        $request->validate([
            'type' => 'required|in:true-false,multiple-choice,text-input',
            'correctAnswer' => 'nullable',
        ]);

        $room = QuizRoom::findOrFail($roomId);

        $room->current_question = [
            'type' => $request->type,
            'correctAnswer' => $request->correctAnswer,
            'accepting_answers' => true,
        ];
        $room->status = 'in_progress';
        $room->save();

        // Broadcast question to all players
        event(new QuestionAskedEvent($room));

        return response()->json([
            'success' => true,
            'question' => $room->current_question,
        ]);
    }

    /**
     * Grade the current question
     */
    public function grade($roomId)
    {
        $room = QuizRoom::with('players')->findOrFail($roomId);

        if (!$room->current_question || !isset($room->current_question['correctAnswer'])) {
            return response()->json([
                'success' => false,
                'message' => 'No question with correct answer set',
            ], 400);
        }

        $correctAnswer = $room->current_question['correctAnswer'];
        $results = [];

        foreach ($room->players as $player) {
            $playerAnswer = $player->current_answer;
            $isCorrect = false;

            if ($playerAnswer !== null) {
                if ($room->current_question['type'] === 'true-false') {
                    // boolean/string 混在を文字列に正規化して比較
                    $normalizedPlayer = is_bool($playerAnswer)
                        ? ($playerAnswer ? 'true' : 'false')
                        : (string) $playerAnswer;
                    $normalizedCorrect = is_bool($correctAnswer)
                        ? ($correctAnswer ? 'true' : 'false')
                        : (string) $correctAnswer;
                    $isCorrect = $normalizedPlayer === $normalizedCorrect;
                } else {
                    $isCorrect = (string) $playerAnswer === (string) $correctAnswer;
                }
            }

            // Update score if correct
            if ($isCorrect) {
                $player->score += 100;
                $player->save();
            }

            $results[] = [
                'player_id' => $player->id,
                'player_name' => $player->name,
                'answer' => $playerAnswer,
                'is_correct' => $isCorrect,
                'new_score' => $player->score,
            ];
        }

        // 採点完了: accepting_answers を false に更新
        $room->current_question = array_merge(
            $room->current_question ?? [],
            ['accepting_answers' => false]
        );
        $room->save();

        // Broadcast results to all players
        event(new \App\Events\QuestionGradedEvent($room, $results));

        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }

    /**
     * Reset the current question
     */
    public function reset($roomId)
    {
        $room = QuizRoom::with('players')->findOrFail($roomId);

        // current_question をクリア
        $room->current_question = null;
        $room->save();

        // 全プレイヤーの回答をリセット
        foreach ($room->players as $player) {
            $player->current_answer = null;
            $player->save();
        }

        // Broadcast reset to all players
        event(new QuestionResetEvent($room));

        return response()->json(['success' => true]);
    }
}
