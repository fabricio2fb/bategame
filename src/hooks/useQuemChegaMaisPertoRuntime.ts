'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { clearSessionData, getSessionData, RoomSettings, RoomState, RoomStatus, Team } from '@/lib/types';
import { getRoomPath } from '@/lib/room-code';

export interface NumericPublicQuestion {
  id: string;
  text: string;
  question?: string;
  category?: string;
  difficulty?: string;
}

export interface NumericRoundStanding {
  playerId?: string;
  playerName?: string;
  teamId?: string;
  teamName?: string;
  guess: number;
  distance: number;
  points: number;
  submittedByPlayerId?: string;
  submittedByPlayerName?: string;
}

export interface NumericPlayerGuess {
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  guess: number | null;
  distance: number | null;
  submittedAt: number | null;
}

export interface NumericGameState {
  status: RoomStatus;
  currentQuestionIndex: number;
  totalRounds?: number;
  totalQuestions?: number;
  currentQuestion: NumericPublicQuestion | null;
  roundStartedAt: number | null;
  roundDeadlineAt: number | null;
  submittedPlayerIds: string[];
  scores: Array<{ playerId: string; name: string; score: number }>;
  teamScores: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
  teams: Team[];
}

export interface NumericRoundReveal {
  questionId: string;
  correctValue: number;
  explanation?: string;
  reason: 'timeout' | 'all-submitted';
  roundIndex: number;
  roundNumber: number;
  totalRounds: number;
  guesses: NumericRoundStanding[];
  playerGuesses: NumericPlayerGuess[];
  missingPlayerIds: string[];
  winnerPlayerIds: string[];
  winnerTeamIds: string[];
}

export function useQuemChegaMaisPertoRuntime(roomCode: string) {
  const router = useRouter();
  const socketRef = useRef(getSocket());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [status, setStatus] = useState<RoomStatus | 'loading' | 'error'>('loading');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [scores, setScores] = useState<Array<{ playerId: string; name: string; score: number }>>([]);
  const [teamScores, setTeamScores] = useState<Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<NumericPublicQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [roundDeadlineAt, setRoundDeadlineAt] = useState<number | null>(null);
  const [submittedPlayerIds, setSubmittedPlayerIds] = useState<string[]>([]);
  const [lastReveal, setLastReveal] = useState<NumericRoundReveal | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [timer, setTimer] = useState(0);

  const applyRoom = useCallback((room: RoomState, currentPlayerId?: string) => {
    setSettings(room.settings);
    setTeams(room.teams || []);
    const resolvedPlayerId = currentPlayerId || playerId;
    const me = room.players.find((player) => player.id === resolvedPlayerId);
    if (me) {
      setPlayerName(me.name);
      setIsHost(me.isHost);
    }
    setScores(room.players.map((player) => ({ playerId: player.id, name: player.name, avatarUrl: player.avatarUrl, score: player.score })));
    setStatus(room.status);
  }, [playerId]);

  const applyGameState = useCallback((gameState: NumericGameState | null) => {
    if (!gameState) return;
    setStatus(gameState.status);
    setQuestionNumber(gameState.currentQuestionIndex + 1);
    setTotalRounds(gameState.totalRounds || gameState.totalQuestions || 0);
    setCurrentQuestion(gameState.currentQuestion);
    setRoundDeadlineAt(gameState.roundDeadlineAt);
    setSubmittedPlayerIds(gameState.submittedPlayerIds || []);
    setScores(gameState.scores || []);
    setTeamScores(gameState.teamScores || []);
    setTeams(gameState.teams || []);
  }, []);

  useEffect(() => {
    if (!roundDeadlineAt || status !== 'answering') {
      setTimer(0);
      return;
    }

    const update = () => {
      setTimer(Math.max(0, Math.ceil((roundDeadlineAt - Date.now()) / 1000)));
    };

    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [roundDeadlineAt, status]);

  useEffect(() => {
    if (countdownValue === null || countdownValue <= 0) return;
    const timeout = window.setTimeout(() => {
      setCountdownValue((current) => current === null ? null : Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [countdownValue]);

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => setConnectionStatus('disconnected');
    const onConnectError = () => setConnectionStatus('error');

    const onGameStarted = (data: { gameState?: NumericGameState }) => {
      setCountdownValue(null);
      applyGameState(data.gameState || null);
    };
    const onGameState = (data: NumericGameState) => {
      applyGameState(data);
    };
    const onGameCountdown = (data: { count: number }) => {
      setStatus('countdown');
      setCountdownValue(data.count);
      setLastReveal(null);
      setSubmitError(null);
    };
    const onNumericQuestion = (data: {
      question: NumericPublicQuestion;
      roundNumber: number;
      totalRounds: number;
      roundDeadlineAt: number;
      submittedPlayerIds?: string[];
    }) => {
      setStatus('answering');
      setCurrentQuestion(data.question);
      setQuestionNumber(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setRoundDeadlineAt(data.roundDeadlineAt);
      setSubmittedPlayerIds(data.submittedPlayerIds || []);
      setLastReveal(null);
      setSubmitError(null);
      setIsSubmitting(false);
      setCountdownValue(null);
    };
    const onGuessSubmitted = (data: { submittedPlayerIds?: string[] }) => {
      setSubmittedPlayerIds(data.submittedPlayerIds || []);
    };
    const onRoundReveal = (data: NumericRoundReveal) => {
      setStatus('round-reveal');
      setRoundDeadlineAt(null);
      setTimer(0);
      setLastReveal(data);
      setIsSubmitting(false);
    };
    const onScoreUpdated = (data: {
      scores?: Array<{ playerId: string; name: string; score: number }>;
      teamScores?: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
    }) => {
      setScores(data.scores || []);
      setTeamScores(data.teamScores || []);
    };
    const onGameFinished = (data: {
      scores?: Array<{ playerId: string; name: string; score: number }>;
      teamScores?: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
    }) => {
      setStatus('game-finished');
      setScores(data.scores || []);
      setTeamScores(data.teamScores || []);
      setRoundDeadlineAt(null);
      setTimer(0);
    };
    const onRematch = (data: { roomCode: string }) => {
      router.push(getRoomPath(data.roomCode));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('game:countdown', onGameCountdown);
    socket.on('game:started', onGameStarted);
    socket.on('game:state', onGameState);
    socket.on('question:numeric', onNumericQuestion);
    socket.on('guess:submitted', onGuessSubmitted);
    socket.on('round:reveal', onRoundReveal);
    socket.on('score:updated', onScoreUpdated);
    socket.on('game:finished', onGameFinished);
    socket.on('game:rematch', onRematch);

    const cleanup = () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('game:countdown', onGameCountdown);
      socket.off('game:started', onGameStarted);
      socket.off('game:state', onGameState);
      socket.off('question:numeric', onNumericQuestion);
      socket.off('guess:submitted', onGuessSubmitted);
      socket.off('round:reveal', onRoundReveal);
      socket.off('score:updated', onScoreUpdated);
      socket.off('game:finished', onGameFinished);
      socket.off('game:rematch', onRematch);
    };

    const session = getSessionData();
    if (!session) {
      setStatus('error');
      return cleanup;
    }

    socket.emit('room:reconnect', {
      roomCode,
      playerId: session.playerId,
      playerToken: session.playerToken,
    }, (response: {
      success: boolean;
      room?: RoomState;
      playerId?: string;
      playerToken?: string;
      gameState?: NumericGameState;
    }) => {
      if (!response.success || !response.room || !response.playerId) {
        clearSessionData();
        setStatus('error');
        return;
      }
      setPlayerId(response.playerId);
      applyRoom(response.room, response.playerId);
      applyGameState(response.gameState || null);
    });

    return cleanup;
  }, [applyGameState, applyRoom, roomCode, router]);

  const settingsSummary = useMemo(() => {
    const rounds = settings?.roundCount || totalRounds || 0;
    const roundTime = settings?.roundTimeSeconds || 0;
    const mode = settings?.gameMode === 'teams' ? 'equipes' : settings?.gameMode === 'couch' ? 'sofa' : 'individual';
    return `${rounds} rodadas, ${roundTime}s por rodada, modo ${mode}`;
  }, [settings, totalRounds]);

  const leave = useCallback(() => {
    socketRef.current.emit('room:leave', { roomCode }, () => {
      clearSessionData();
      router.push('/quem-chega-mais-perto');
    });
  }, [roomCode, router]);

  const rematch = useCallback(() => {
    socketRef.current.emit('game:rematch', { roomCode }, (response: { success: boolean }) => {
      if (response.success) router.push(getRoomPath(roomCode));
    });
  }, [roomCode, router]);

  const submitGuess = useCallback((guess: number) => {
    if (!currentQuestion) return;
    setIsSubmitting(true);
    setSubmitError(null);
    socketRef.current.emit('guess:submit', {
      roomCode,
      questionId: currentQuestion.id,
      guess,
    }, (response: { success: boolean; error?: { message?: string } }) => {
      setIsSubmitting(false);
      if (!response.success) {
        setSubmitError(response.error?.message || 'Nao foi possivel enviar o palpite.');
      }
    });
  }, [currentQuestion, roomCode]);

  return {
    roomCode,
    status,
    currentQuestion,
    questionNumber,
    totalRounds,
    timer,
    roundDeadlineAt,
    submittedPlayerIds,
    lastReveal,
    countdownValue,
    submitError,
    isSubmitting,
    playerId,
    playerName,
    isHost,
    settings,
    settingsSummary,
    scores,
    teamScores,
    teams,
    connectionStatus,
    soundOn,
    setSoundOn,
    leave,
    rematch,
    submitGuess,
  };
}
