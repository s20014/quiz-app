<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Player extends Model
{
    protected $fillable = [
        'room_id',
        'name',
        'score',
        'current_answer',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    public function quizRoom()
    {
        return $this->belongsTo(QuizRoom::class, 'room_id');
    }
}
