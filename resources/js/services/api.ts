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
  current_answer?: string;
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

  /**
   * Get a specific player by ID
   */
  getPlayer: async (playerId: string | number): Promise<{ player: Player }> => {
    const response = await axios.get(`/api/players/${playerId}`);
    return response.data;
  },

  /**
   * Submit an answer for a player
   */
  submitAnswer: async (playerId: string | number, answer: string | boolean): Promise<{ success: boolean }> => {
    const response = await axios.post(`/api/players/${playerId}/answer`, { answer });
    return response.data;
  },

  /**
   * Update player score
   */
  updateScore: async (playerId: string | number, score: number): Promise<{ success: boolean; player: Player }> => {
    const response = await axios.patch(`/api/players/${playerId}/score`, { score });
    return response.data;
  },
};

export const questionApi = {
  /**
   * Start a new question for the room
   */
  startQuestion: async (roomId: string, questionData: { type: string; correctAnswer?: string | boolean }): Promise<{ question: any }> => {
    const response = await axios.post(`/api/rooms/${roomId}/questions`, questionData);
    return response.data;
  },

  /**
   * Grade the current question
   */
  gradeQuestion: async (roomId: string): Promise<{ results: Array<{ player_id: number; is_correct: boolean; new_score: number }> }> => {
    const response = await axios.post(`/api/rooms/${roomId}/questions/grade`);
    return response.data;
  },
};
