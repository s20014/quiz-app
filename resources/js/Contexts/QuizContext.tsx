import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { roomApi, playerApi } from '@/services/api';

export type QuestionType = 'true-false' | 'multiple-choice' | 'text-input';

export interface Player {
  id: string | number;
  name: string;
  score: number;
  answer?: string | boolean;
  isCorrect?: boolean;
}

export interface Question {
  type: QuestionType;
  correctAnswer?: string | boolean;
}

interface QuizContextType {
  roomId: string | null;
  roomCode: string | null;
  players: Player[];
  currentQuestion: Question | null;
  isAcceptingAnswers: boolean;
  createRoom: () => Promise<void>;
  addPlayer: (name: string) => Promise<string>;
  setCurrentQuestion: (question: Question) => void;
  startAcceptingAnswers: () => void;
  stopAcceptingAnswers: () => void;
  submitAnswer: (playerId: string, answer: string | boolean) => void;
  calculateScores: () => void;
  resetQuestion: () => void;
  updatePlayerScore: (playerId: string, newScore: number) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isAcceptingAnswers, setIsAcceptingAnswers] = useState(false);

  // Listen for PlayerJoinedEvent when room is created
  useEffect(() => {
    if (!roomId || !window.Echo) return;

    const channel = window.Echo.channel(`room.${roomId}`);

    channel.listen('PlayerJoinedEvent', (event: { player: Player }) => {
      setPlayers(prev => {
        // Check if player already exists
        const exists = prev.some(p => p.id === event.player.id);
        if (exists) return prev;

        return [...prev, event.player];
      });
    });

    return () => {
      window.Echo.leave(`room.${roomId}`);
    };
  }, [roomId]);

  const createRoom = async () => {
    try {
      const { room } = await roomApi.createRoom();
      setRoomId(room.id.toString());
      setRoomCode(room.room_code);
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  };

  const addPlayer = async (name: string) => {
    if (!roomCode) {
      throw new Error('Room not created yet');
    }

    try {
      const { player } = await playerApi.joinRoom(roomCode, name);
      return player.id.toString();
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  };

  const startAcceptingAnswers = () => {
    setIsAcceptingAnswers(true);
  };

  const stopAcceptingAnswers = () => {
    setIsAcceptingAnswers(false);
  };

  const submitAnswer = (playerId: string, answer: string | boolean) => {
    setPlayers(prev =>
      prev.map(p =>
        p.id === playerId ? { ...p, answer } : p
      )
    );
  };

  const calculateScores = () => {
    if (!currentQuestion || !currentQuestion.correctAnswer) return;

    setPlayers(prev =>
      prev.map(p => {
        if (p.answer === undefined) return p;
        
        const isCorrect = p.answer === currentQuestion.correctAnswer;
        return {
          ...p,
          isCorrect,
          score: isCorrect ? p.score + 100 : p.score,
        };
      })
    );
  };

  const resetQuestion = () => {
    setPlayers(prev =>
      prev.map(p => ({
        ...p,
        answer: undefined,
        isCorrect: undefined,
      }))
    );
    setCurrentQuestion(null);
    setIsAcceptingAnswers(false);
  };

  const updatePlayerScore = (playerId: string, newScore: number) => {
    setPlayers(prev =>
      prev.map(p =>
        p.id === playerId ? { ...p, score: newScore } : p
      )
    );
  };

  return (
    <QuizContext.Provider
      value={{
        roomId,
        roomCode,
        players,
        currentQuestion,
        isAcceptingAnswers,
        createRoom,
        addPlayer,
        setCurrentQuestion,
        startAcceptingAnswers,
        stopAcceptingAnswers,
        submitAnswer,
        calculateScores,
        resetQuestion,
        updatePlayerScore,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}