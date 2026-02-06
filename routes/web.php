<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home');
});

Route::get('/host', function () {
    return Inertia::render('Host');
});

Route::get('/play/{roomId}', function ($roomId) {
    return Inertia::render('PlayerJoin', [
        'roomId' => $roomId
    ]);
});

Route::get('/play/{roomId}/answer', function ($roomId) {
    return Inertia::render('PlayerAnswer', [
        'roomId' => $roomId
    ]);
});

Route::get('/leaderboard', function () {
    return Inertia::render('Leaderboard');
});
