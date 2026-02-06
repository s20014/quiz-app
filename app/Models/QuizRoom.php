<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizRoom extends Model
{
    protected $table = 'quiz_rooms';

    protected $fillable = [
        'room_code',
        'status',
        'current_question',
    ];

    protected $casts = [
        'current_question' => 'array',
    ];

    public function players()
    {
        return $this->hasMany(Player::class, 'room_id');
    }
}
