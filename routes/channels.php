<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Public room channel for quiz participants
Broadcast::channel('room.{roomId}', function () {
    return true; // Public channel, no authentication required
});
