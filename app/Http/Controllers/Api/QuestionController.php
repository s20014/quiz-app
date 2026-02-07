<?php

namespace App\Http\Controllers\Api;

use App\Events\QuestionAskedEvent;
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

            // Compare answers (handle boolean conversion)
            if ($room->current_question['type'] === 'true-false') {
                $isCorrect = ($playerAnswer === 'true') === ($correctAnswer === true || $correctAnswer === 'true');
            } else {
                $isCorrect = $playerAnswer === $correctAnswer;
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

        // Broadcast results to all players
        event(new \App\Events\QuestionGradedEvent($room, $results));

        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }
}
