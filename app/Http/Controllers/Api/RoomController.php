<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuizRoom;
use App\Services\RoomCodeGenerator;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * Create a new quiz room
     */
    public function store(Request $request)
    {
        $room = QuizRoom::create([
            'room_code' => RoomCodeGenerator::generate(),
            'status' => 'waiting',
        ]);

        return response()->json([
            'success' => true,
            'room' => [
                'id' => $room->id,
                'room_code' => $room->room_code,
                'status' => $room->status,
                'created_at' => $room->created_at,
            ],
        ], 201);
    }

    /**
     * Get room information by room code
     */
    public function show($roomCode)
    {
        $room = QuizRoom::where('room_code', $roomCode)
            ->with('players')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'room' => [
                'id' => $room->id,
                'room_code' => $room->room_code,
                'status' => $room->status,
                'current_question' => $room->current_question,
                'created_at' => $room->created_at,
            ],
            'players' => $room->players->map(function ($player) {
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
