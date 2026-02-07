<?php

use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\RoomController;
use Illuminate\Support\Facades\Route;

// Room management
Route::post('/rooms', [RoomController::class, 'store']);
Route::get('/rooms/{roomCode}', [RoomController::class, 'show']);

// Player management
Route::post('/rooms/{roomCode}/join', [PlayerController::class, 'store']);
Route::get('/rooms/{roomId}/players', [PlayerController::class, 'index']);
Route::get('/players/{playerId}', [PlayerController::class, 'show']);
Route::post('/players/{playerId}/answer', [PlayerController::class, 'submitAnswer']);
Route::patch('/players/{playerId}/score', [PlayerController::class, 'updateScore']);

// Question management
Route::post('/rooms/{roomId}/questions', [QuestionController::class, 'store']);
Route::post('/rooms/{roomId}/questions/grade', [QuestionController::class, 'grade']);
