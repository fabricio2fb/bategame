'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { clearSessionData, getSessionData, RoomSettings, RoomState, RoomStatus, Team } from '@/lib/types';
import { getRoomPath } from '@/lib/room-code';
import { useDeadlineSeconds } from './useDeadlineSeconds';

export interface TresLetrasRound {
  id: string;
  letters: string[];
}

export interface TresLetrasAnswer {
  answerId: string;
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  text: string;
  repeated: boolean;
  submittedAt?: number;
}

export interface TresLetrasRevealAnswer extends TresLetrasAnswer {
  normalizedText: string;
  correctVotes: number;
  wrongVotes: number;
  outcome: 'accepted-unique' | 'accepted-repeated' | 'rejected' | 'tie';
  points: number;
}

interface TresLetrasGameState {
  status: RoomStatus;
  currentQuestionIndex: number;
  totalRounds?: number;
  currentRound: TresLetrasRound | null;
  roundStartedAt: number | null;
  roundDeadlineAt: number | null;
  votingDeadlineAt: number | null;
  submittedPlayerIds: string[];
  scores: Array<{ playerId: string; name: string; avatarUrl?: string; score: number }>;
  teamScores: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
  teams: Team[];
}

export interface TresLetrasVotingState {
  roundId: string;
  letters: string[];
  answers: TresLetrasAnswer[];
  votingDeadlineAt: number;
}

export interface TresLetrasVoteCount {
  answerId: string;
  correctVotes: number;
  wrongVotes: number;
  totalVotes: number;
}

export interface TresLetrasRoundReveal {
  roundId: string;
  letters: string[];
  reason: 'timeout' | 'all-voted';
  roundIndex: number;
  roundNumber: number;
  totalRounds: number;
  answers: TresLetrasRevealAnswer[];
  missingPlayerIds: string[];
  scores: Array<{ playerId: string; name: string; avatarUrl?: string; score: number }>;
  teamScores: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
}

export function useTresLetrasRuntime(roomCode: string) {
  const router = useRouter();
  const socketRef = useRef(getSocket());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [status, setStatus] = useState<RoomStatus | 'loading' | 'error'>('loading');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [scores, setScores] = useState<Array<{ playerId: string; name: string; avatarUrl?: string; score: number }>>([]);
  const [teamScores, setTeamScores] = useState<Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentRound, setCurrentRound] = useState<TresLetrasRound | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [writingDeadlineAt, setWritingDeadlineAt] = useState<number | null>(null);
  const [votingDeadlineAt, setVotingDeadlineAt] = useState<number | null>(null);
  const [submittedPlayerIds, setSubmittedPlayerIds] = useState<string[]>([]);
  const [votingState, setVotingState] = useState<TresLetrasVotingState | null>(null);
  const [voteCounts, setVoteCounts] = useState<TresLetrasVoteCount[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [lastReveal, setLastReveal] = useState<TresLetrasRoundReveal | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const activeDeadline = status === 'letters-visible' || status === 'writing'
    ? writingDeadlineAt
    : status === 'voting'
      ? votingDeadlineAt
      : null;
  const timer = useDeadlineSeconds(activeDeadline, activeDeadline !== null);

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

  const applyGameState = useCallback((gameState: TresLetrasGameState | null) => {
    if (!gameState) return;
    setStatus(gameState.status);
    setQuestionNumber(gameState.currentQuestionIndex + 1);
    setTotalRounds(gameState.totalRounds || 0);
    setCurrentRound(gameState.currentRound);
    setWritingDeadlineAt(gameState.roundDeadlineAt || null);
    setVotingDeadlineAt(gameState.votingDeadlineAt || null);
    setSubmittedPlayerIds(gameState.submittedPlayerIds || []);
    setScores(gameState.scores || []);
    setTeamScores(gameState.teamScores || []);
    setTeams(gameState.teams || []);
  }, []);

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
    const onGameCountdown = (data: { count: number }) => {
      setStatus('countdown');
      setCountdownValue(data.count);
      setVotingState(null);
      setVoteCounts([]);
      setMyVotes({});
      setLastReveal(null);
      setSubmitError(null);
    };
    const onGameStarted = (data: { gameState?: TresLetrasGameState }) => {
      setCountdownValue(null);
      applyGameState(data.gameState || null);
    };
    const onGameState = (data: TresLetrasGameState) => applyGameState(data);
    const onRoundLetters = (data: {
      roundId: string;
      letters: string[];
      roundNumber: number;
      totalRounds: number;
      writingDeadlineAt: number;
      submittedPlayerIds?: string[];
    }) => {
      setStatus('writing');
      setCurrentRound({ id: data.roundId, letters: data.letters });
      setQuestionNumber(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setWritingDeadlineAt(data.writingDeadlineAt);
      setVotingDeadlineAt(null);
      setSubmittedPlayerIds(data.submittedPlayerIds || []);
      setVotingState(null);
      setVoteCounts([]);
      setMyVotes({});
      setLastReveal(null);
      setCountdownValue(null);
      setSubmitError(null);
      setIsSubmitting(false);
    };
    const onAnswerSubmitted = (data: { submittedPlayerIds?: string[] }) => {
      setSubmittedPlayerIds(data.submittedPlayerIds || []);
    };
    const onVotingStart = (data: TresLetrasVotingState) => {
      setStatus('voting');
      setVotingState(data);
      setVotingDeadlineAt(data.votingDeadlineAt);
      setWritingDeadlineAt(null);
      setVoteCounts([]);
      setMyVotes({});
      setSubmitError(null);
      setIsSubmitting(false);
    };
    const onVoteSubmitted = (data: { voteCounts?: TresLetrasVoteCount[]; playerId?: string; answerId?: string }) => {
      setVoteCounts(data.voteCounts || []);
    };
    const onRoundReveal = (data: TresLetrasRoundReveal) => {
      setStatus('round-reveal');
      setVotingDeadlineAt(null);
      setWritingDeadlineAt(null);
      setLastReveal(data);
      setVoteCounts([]);
      setScores(data.scores || []);
      setTeamScores(data.teamScores || []);
      setIsSubmitting(false);
    };
    const onScoreUpdated = (data: {
      scores?: Array<{ playerId: string; name: string; avatarUrl?: string; score: number }>;
      teamScores?: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
    }) => {
      setScores(data.scores || []);
      setTeamScores(data.teamScores || []);
    };
    const onGameFinished = (data: {
      scores?: Array<{ playerId: string; name: string; avatarUrl?: string; score: number }>;
      teamScores?: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
    }) => {
      setStatus('game-finished');
      setScores(data.scores || []);
      setTeamScores(data.teamScores || []);
      setVotingDeadlineAt(null);
      setWritingDeadlineAt(null);
    };
    const onRematch = (data: { roomCode: string }) => router.push(getRoomPath(data.roomCode));

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('game:countdown', onGameCountdown);
    socket.on('game:started', onGameStarted);
    socket.on('game:state', onGameState);
    socket.on('round:letters', onRoundLetters);
    socket.on('answer:submitted', onAnswerSubmitted);
    socket.on('voting:start', onVotingStart);
    socket.on('vote:submitted', onVoteSubmitted);
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
      socket.off('round:letters', onRoundLetters);
      socket.off('answer:submitted', onAnswerSubmitted);
      socket.off('voting:start', onVotingStart);
      socket.off('vote:submitted', onVoteSubmitted);
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
      gameState?: TresLetrasGameState;
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
    const writingTime = settings?.roundTimeSeconds || 0;
    const mode = settings?.gameMode === 'teams' ? 'equipes' : 'individual';
    return `${rounds} rodadas, ${writingTime}s de escrita, modo ${mode}`;
  }, [settings, totalRounds]);

  const leave = useCallback(() => {
    socketRef.current.emit('room:leave', { roomCode }, () => {
      clearSessionData();
      router.push('/tres-letras');
    });
  }, [roomCode, router]);

  const rematch = useCallback(() => {
    socketRef.current.emit('game:rematch', { roomCode }, (response: { success: boolean }) => {
      if (response.success) router.push(getRoomPath(roomCode));
    });
  }, [roomCode, router]);

  const submitAnswer = useCallback((answer: string) => {
    if (!currentRound) return;
    setIsSubmitting(true);
    setSubmitError(null);
    socketRef.current.emit('answer:submit', {
      roomCode,
      roundId: currentRound.id,
      answer,
    }, (response: { success: boolean; error?: { message?: string } }) => {
      setIsSubmitting(false);
      if (!response.success) {
        setSubmitError(response.error?.message || 'Nao foi possivel enviar sua resposta.');
      }
    });
  }, [currentRound, roomCode]);

  const submitVote = useCallback((answerId: string, vote: 'correct' | 'wrong') => {
    if (!votingState) return;
    setSubmitError(null);
    setMyVotes((current) => ({ ...current, [answerId]: vote }));
    socketRef.current.emit('vote:submit', {
      roomCode,
      roundId: votingState.roundId,
      answerId,
      vote,
    }, (response: { success: boolean; error?: { message?: string } }) => {
      if (!response.success) {
        setMyVotes((current) => {
          const next = { ...current };
          delete next[answerId];
          return next;
        });
        setSubmitError(response.error?.message || 'Nao foi possivel registrar o voto.');
      }
    });
  }, [roomCode, votingState]);

  return {
    roomCode,
    status,
    currentRound,
    questionNumber,
    totalRounds,
    timer,
    submittedPlayerIds,
    votingState,
    voteCounts,
    myVotes,
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
    submitAnswer,
    submitVote,
  };
}
