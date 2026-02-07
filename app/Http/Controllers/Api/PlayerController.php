<?php

namespace App\Http\Controllers\Api;

use App\Events\PlayerJoinedEvent;
use App\Http\Controllers\Controller;
use App\Models\QuizRoom;
use App\Models\Player;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    /**
     * Register a player to a room
     */
    public function store(Request $request, $roomCode)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $room = QuizRoom::where('room_code', $roomCode)->firstOrFail();

        $player = Player::create([
            'room_id' => $room->id,
            'name' => $request->name,
            'score' => 0,
        ]);

        // Broadcast player joined event
        event(new PlayerJoinedEvent($player));

        return response()->json([
            'success' => true,
            'player' => [
                'id' => $player->id,
                'room_id' => $player->room_id,
                'name' => $player->name,
                'score' => $player->score,
                'joined_at' => $player->joined_at,
            ],
        ], 201);
    }

    /**
     * Get all players in a room
     */
    public function index($roomId)
    {
        $room = QuizRoom::findOrFail($roomId);
        $players = $room->players;

        return response()->json([
            'success' => true,
            'players' => $players->map(function ($player) {
                return [
                    'id' => $player->id,
                    'name' => $player->name,
                    'score' => $player->score,
                    'joined_at' => $player->joined_at,
                ];
            }),
        ]);
    }

    /**
     * Get a specific player by ID
     */
    public function show($playerId)
    {
        $player = Player::findOrFail($playerId);

        return response()->json([
            'success' => true,
            'player' => [
                'id' => $player->id,
                'room_id' => $player->room_id,
                'name' => $player->name,
                'score' => $player->score,
                'current_answer' => $player->current_answer,
                'joined_at' => $player->joined_at,
            ],
        ]);
    }

    /**
     * Submit an answer for a player
     */
    public function submitAnswer(Request $request, $playerId)
    {
        $request->validate([
            'answer' => 'required',
        ]);

        $player = Player::findOrFail($playerId);

        $player->current_answer = is_bool($request->answer)
            ? ($request->answer ? 'true' : 'false')
            : $request->answer;
        $player->save();

        // Broadcast answer to room
        event(new \App\Events\PlayerAnsweredEvent($player, $request->answer));

        return response()->json([
            'success' => true,
            'message' => 'Answer submitted successfully',
        ]);
    }

    /**
     * Update player score
     */
    public function updateScore(Request $request, $playerId)
    {
        $request->validate([
            'score' => 'required|integer|min:0',
        ]);

        $player = Player::findOrFail($playerId);
        $oldScore = $player->score;
        $player->score = $request->score;
        $player->save();

        // Broadcast score update to room
        event(new \App\Events\ScoreUpdatedEvent($player, $oldScore));

        return response()->json([
            'success' => true,
            'player' => [
                'id' => $player->id,
                'name' => $player->name,
                'score' => $player->score,
            ],
        ]);
    }
}
