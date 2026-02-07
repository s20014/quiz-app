<?php

namespace App\Events;

use App\Models\Player;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScoreUpdatedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $playerId;
    public $playerName;
    public $oldScore;
    public $newScore;
    public $roomId;

    /**
     * Create a new event instance.
     */
    public function __construct(Player $player, int $oldScore)
    {
        $this->playerId = $player->id;
        $this->playerName = $player->name;
        $this->oldScore = $oldScore;
        $this->newScore = $player->score;
        $this->roomId = $player->room_id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('room.' . $this->roomId),
        ];
    }
}
