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
}
