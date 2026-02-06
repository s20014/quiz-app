<?php

namespace App\Services;

use App\Models\QuizRoom;
use Illuminate\Support\Str;

class RoomCodeGenerator
{
    /**
     * Generate a unique 8-character room code
     */
    public static function generate(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (QuizRoom::where('room_code', $code)->exists());

        return $code;
    }
}
