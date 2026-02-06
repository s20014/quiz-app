import axios from 'axios';

export interface Room {
  id: number;
  room_code: string;
  status: 'waiting' | 'in_progress' | 'finished';
  current_question?: any;
  created_at: string;
}

export interface Player {
  id: number;
  room_id: number;
  name: string;
  score: number;
  joined_at: string;
}

export const roomApi = {
  /**
   * Create a new quiz room
   */
  createRoom: async (): Promise<{ room: Room }> => {
    const response = await axios.post('/api/rooms');
    return response.data;
  },

  /**
   * Get room information by room code
   */
  getRoom: async (roomCode: string): Promise<{ room: Room; players: Player[] }> => {
    const response = await axios.get(`/api/rooms/${roomCode}`);
    return response.data;
  },
};

export const playerApi = {
  /**
   * Register a player to a room
   */
  joinRoom: async (roomCode: string, name: string): Promise<{ player: Player }> => {
    const response = await axios.post(`/api/rooms/${roomCode}/join`, { name });
    return response.data;
  },

  /**
   * Get all players in a room
   */
  getPlayers: async (roomId: number): Promise<{ players: Player[] }> => {
    const response = await axios.get(`/api/rooms/${roomId}/players`);
    return response.data;
  },
};
