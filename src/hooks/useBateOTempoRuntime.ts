'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { clearSessionData, getSessionData, RoomSettings, RoomState, RoomStatus, Team } from '@/lib/types';
import { getRoomPath } from '@/lib/room-code';

export type BateOTempoTimerStatus = 'not-started' | 'running' | 'stopped' | 'timeout';

export interface BateOTempoTimerStatusEntry {
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  status: BateOTempoTimerStatus;
}

export interface BateOTempoGameState {
  status: RoomStatus;
  gameType: 'bate-o-tempo';
  currentQuestionIndex: number;
  totalRounds?: number;
  targetMs?: number;
  targetLabel?: string;
  roundStartedAt: number | null;
  roundDeadlineAt: number | null;
  timerStatuses: BateOTempoTimerStatusEntry[];
  scores: Array<{ playerId: string; name: string; avatarUrl?: string; score: number }>;
  teamScores: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
  teams: Team[];
}

export interface BateOTempoRoundRevealResult {
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  elapsedMs: number | null;
  elapsedLabel: string | null;
  distanceMs: number | null;
  distanceLabel: string | null;
  points: number;
}

export interface BateOTempoRoundReveal {
  reason: 'timeout' | 'all-stopped';
  roundIndex: number;
  roundNumber: number;
  totalRounds: number;
  targetMs: number;
  targetLabel: string;
  scoringMode: 'exact' | 'approximate';
  exactToleranceMs: number;
  results: BateOTempoRoundRevealResult[];
  winnerPlayerIds: string[];
  winnerTeamIds: string[];
  scores: Array<{ playerId: string; name: string; avatarUrl?: string; score: number }>;
  teamScores: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
}

export interface BateOTempoPersonalTimerResult {
  roomCode: string;
  roundIndex: number;
  roundNumber: number;
  playerId: string;
  status: 'stopped' | 'timeout';
  elapsedMs: number | null;
  elapsedLabel: string | null;
  stoppedAt: number;
}

export function useBateOTempoRuntime(roomCode: string) {
  const router = useRouter();
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [status, setStatus] = useState<RoomStatus | 'loading' | 'error'>('loading');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [scores, setScores] = useState<Array<{ playerId: string; name: string; avatarUrl?: string; score: number }>>([]);
  const [teamScores, setTeamScores] = useState<Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [targetMs, setTargetMs] = useState<number | null>(null);
  const [targetLabel, setTargetLabel] = useState('');
  const [roundDeadlineAt, setRoundDeadlineAt] = useState<number | null>(null);
  const [timerStatuses, setTimerStatuses] = useState<BateOTempoTimerStatusEntry[]>([]);
  const [personalTimerResult, setPersonalTimerResult] = useState<BateOTempoPersonalTimerResult | null>(null);
  const [lastReveal, setLastReveal] = useState<BateOTempoRoundReveal | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
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

  const applyGameState = useCallback((gameState: BateOTempoGameState | null) => {
    if (!gameState) return;
    setStatus(gameState.status);
    setQuestionNumber(gameState.currentQuestionIndex + 1);
    setTotalRounds(gameState.totalRounds || 0);
    setTargetMs(typeof gameState.targetMs === 'number' ? gameState.targetMs : null);
    setTargetLabel(gameState.targetLabel || '');
    setRoundDeadlineAt(gameState.roundDeadlineAt || null);
    setTimerStatuses(gameState.timerStatuses || []);
    setScores(gameState.scores || []);
    setTeamScores(gameState.teamScores || []);
    setTeams(gameState.teams || []);
  }, []);

  useEffect(() => {
    if (!roundDeadlineAt || (status !== 'target-visible' && status !== 'running')) {
      setTimer(0);
      return;
    }

    const update = () => setTimer(Math.max(0, Math.ceil((roundDeadlineAt - Date.now()) / 1000)));
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
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => setConnectionStatus('disconnected');
    const onConnectError = () => setConnectionStatus('error');
    const onGameCountdown = (data: { count: number }) => {
      setStatus('countdown');
      setCountdownValue(data.count);
      setPersonalTimerResult(null);
      setLastReveal(null);
      setActionError(null);
    };
    const onGameStarted = (data: { gameState?: BateOTempoGameState }) => {
      setCountdownValue(null);
      applyGameState(data.gameState || null);
    };
    const onGameState = (data: BateOTempoGameState) => applyGameState(data);
    const onRoundTarget = (data: {
      roundNumber: number;
      totalRounds: number;
      targetMs: number;
      targetLabel: string;
      roundDeadlineAt: number;
      timerStatuses?: BateOTempoTimerStatusEntry[];
    }) => {
      setStatus('target-visible');
      setQuestionNumber(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setTargetMs(data.targetMs);
      setTargetLabel(data.targetLabel);
      setRoundDeadlineAt(data.roundDeadlineAt);
      setTimerStatuses(data.timerStatuses || []);
      setPersonalTimerResult(null);
      setLastReveal(null);
      setActionError(null);
      setIsActing(false);
      setCountdownValue(null);
    };
    const onTimerStatus = (data: { timerStatuses?: BateOTempoTimerStatusEntry[] }) => {
      setTimerStatuses(data.timerStatuses || []);
    };
    const onTimerStoppedResult = (data: BateOTempoPersonalTimerResult) => {
      setPersonalTimerResult(data);
      setIsActing(false);
      setActionError(null);
    };
    const onRoundReveal = (data: BateOTempoRoundReveal) => {
      setStatus('round-reveal');
      setRoundDeadlineAt(null);
      setTimer(0);
      setLastReveal(data);
      setScores(data.scores || []);
      setTeamScores(data.teamScores || []);
      setTimerStatuses((current) => current.map((entry) => entry.status === 'running' || entry.status === 'not-started' ? { ...entry, status: 'timeout' } : entry));
      setIsActing(false);
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
      setRoundDeadlineAt(null);
      setTimer(0);
    };
    const onRematch = (data: { roomCode: string }) => router.push(getRoomPath(data.roomCode));

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('game:countdown', onGameCountdown);
    socket.on('game:started', onGameStarted);
    socket.on('game:state', onGameState);
    socket.on('round:target', onRoundTarget);
    socket.on('player:timer-status', onTimerStatus);
    socket.on('timer:stopped-result', onTimerStoppedResult);
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
      socket.off('round:target', onRoundTarget);
      socket.off('player:timer-status', onTimerStatus);
      socket.off('timer:stopped-result', onTimerStoppedResult);
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
      gameState?: BateOTempoGameState;
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

  const currentTimerStatus = useMemo(() => {
    return timerStatuses.find((entry) => entry.playerId === playerId)?.status || 'not-started';
  }, [playerId, timerStatuses]);

  useEffect(() => {
    if (!roundDeadlineAt || (status !== 'target-visible' && status !== 'running')) return;
    if (timer > 0 || currentTimerStatus === 'stopped' || personalTimerResult) return;
    if (Date.now() < roundDeadlineAt) return;
    setPersonalTimerResult({
      roomCode,
      roundIndex: Math.max(0, questionNumber - 1),
      roundNumber: questionNumber || 1,
      playerId: playerId || '',
      status: 'timeout',
      elapsedMs: null,
      elapsedLabel: null,
      stoppedAt: Date.now(),
    });
  }, [currentTimerStatus, personalTimerResult, playerId, questionNumber, roomCode, roundDeadlineAt, status, timer]);

  const settingsSummary = useMemo(() => {
    const rounds = settings?.roundCount || totalRounds || 0;
    const limit = settings?.roundTimeSeconds || 0;
    const mode = settings?.gameMode === 'teams' ? 'equipes' : settings?.gameMode === 'couch' ? 'sofa' : 'individual';
    const scoring = settings?.scoringMode === 'exact' ? 'exato' : 'aproximado';
    return `${rounds} rodadas, ${limit}s por rodada, modo ${mode}, ${scoring}`;
  }, [settings, totalRounds]);

  const leave = useCallback(() => {
    const socket = socketRef.current || getSocket();
    socketRef.current = socket;
    socket.emit('room:leave', { roomCode }, () => {
      clearSessionData();
      router.push('/bate-o-tempo');
    });
  }, [roomCode, router]);

  const rematch = useCallback(() => {
    const socket = socketRef.current || getSocket();
    socketRef.current = socket;
    socket.emit('game:rematch', { roomCode }, (response: { success: boolean }) => {
      if (response.success) router.push(getRoomPath(roomCode));
    });
  }, [roomCode, router]);

  const startTimer = useCallback(() => {
    setIsActing(true);
    setActionError(null);
    setPersonalTimerResult(null);
    const socket = socketRef.current || getSocket();
    socketRef.current = socket;
    socket.emit('timer:start', { roomCode }, (response: { success: boolean; error?: { message?: string } }) => {
      setIsActing(false);
      if (!response.success) setActionError(response.error?.message || 'Nao foi possivel iniciar o cronometro.');
    });
  }, [roomCode]);

  const stopTimer = useCallback(() => {
    setIsActing(true);
    setActionError(null);
    const socket = socketRef.current || getSocket();
    socketRef.current = socket;
    socket.emit('timer:stop', { roomCode }, (response: { success: boolean; elapsedMs?: number; elapsedLabel?: string; error?: { message?: string } }) => {
      setIsActing(false);
      if (!response.success) {
        setActionError(response.error?.message || 'Nao foi possivel parar o cronometro.');
        return;
      }
      if (typeof response.elapsedMs === 'number') {
        setPersonalTimerResult({
          roomCode,
          roundIndex: Math.max(0, questionNumber - 1),
          roundNumber: questionNumber || 1,
          playerId: playerId || '',
          status: 'stopped',
          elapsedMs: response.elapsedMs,
          elapsedLabel: response.elapsedLabel || null,
          stoppedAt: Date.now(),
        });
      }
    });
  }, [playerId, questionNumber, roomCode]);

  return {
    roomCode,
    status,
    questionNumber,
    totalRounds,
    timer,
    targetMs,
    targetLabel,
    roundDeadlineAt,
    timerStatuses,
    currentTimerStatus,
    personalTimerResult,
    lastReveal,
    countdownValue,
    actionError,
    isActing,
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
    startTimer,
    stopTimer,
  };
}
