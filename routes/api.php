<?php

use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\RoomController;
use Illuminate\Support\Facades\Route;

// Room management
Route::post('/rooms', [RoomController::class, 'store']);
Route::get('/rooms/{roomCode}', [RoomController::class, 'show']);

// Player management
Route::post('/rooms/{roomCode}/join', [PlayerController::class, 'store']);
Route::get('/rooms/{roomId}/players', [PlayerController::class, 'index']);
