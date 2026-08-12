'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { disconnectSocket, getSocket } from '@/lib/socket';
import {
  RoomState, RoomSettings, PlayerData, GameState,
  saveSessionData, getSessionData, clearSessionData,
} from '@/lib/types';
import { Socket } from 'socket.io-client';
import { getLastSocketError } from '@/lib/socket';
import { isValidRoomCode, normalizeRoomCode } from '@/lib/room-code';
import { DEFAULT_AVATAR } from '@/lib/player-avatar';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

interface UseSocketRoomReturn {
  room: RoomState | null;
  currentPlayer: PlayerData | null;
  connectionStatus: ConnectionStatus;
  socketError: string | null;
  roomLookupComplete: boolean;
  isHost: boolean;
  error: string | null;
  createRoom: (playerName: string, roomName: string, settings: RoomSettings, avatarUrl?: string) => Promise<{ success: boolean; roomCode?: string; error?: string }>;
  joinRoom: (roomCode: string, playerName: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  toggleReady: () => void;
  updateSettings: (settings: Partial<RoomSettings>) => Promise<boolean>;
  removePlayer: (targetPlayerId: string) => Promise<boolean>;
  startGame: () => Promise<{ success: boolean; error?: string; comingSoon?: boolean }>;
  pressBuzzer: () => Promise<boolean>;
  judgeAnswer: (playerId: string, result: 'correct' | 'wrong') => void;
  submitAnswer: (questionId: string, selectedAlternative: string) => void;
  requestRematch: () => Promise<boolean>;
  createQuiz: (quizName: string, questions: any[]) => Promise<{ success: boolean; quizId?: string; error?: string }>;
  createCustomContent: (payload: { gameType: string; title: string; items: any[] }) => Promise<{ success: boolean; contentId?: string; title?: string; error?: string }>;
  assignTeams: (teamCount: number) => Promise<boolean>;
  chooseTeam: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  selectSofaPlayer: (targetPlayerId: string) => Promise<boolean>;
  submitWrittenAnswer: (questionId: string, answer: string) => void;
  onGameEvent: (event: string, handler: (...args: any[]) => void) => void;
  offGameEvent: (event: string, handler: (...args: any[]) => void) => void;
}

export function useSocketRoom(roomCode?: string, enabled = true): UseSocketRoomReturn {
  const normalizedRoomCode = normalizeRoomCode(roomCode);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [roomLookupComplete, setRoomLookupComplete] = useState(!normalizedRoomCode);
  const roomRef = useRef<RoomState | null>(null);
  const playerIdRef = useRef<string | null>(null);

  const loadRoomFromCode = useCallback((sock: Socket) => {
    if (!normalizedRoomCode) {
      setRoomLookupComplete(true);
      return;
    }
    if (!isValidRoomCode(normalizedRoomCode)) {
      setError('Código de sala inválido.');
      setRoom(null);
      roomRef.current = null;
      setCurrentPlayer(null);
      setRoomLookupComplete(true);
      return;
    }

    const session = getSessionData();
    if (session && normalizeRoomCode(session.roomCode) === normalizedRoomCode) {
      sock.emit('room:reconnect', {
        roomCode: normalizedRoomCode,
        playerId: session.playerId,
        playerToken: session.playerToken,
      }, (response: any) => {
        if (response.success) {
          setRoomLookupComplete(true);
          playerIdRef.current = response.playerId;
          setRoom(response.room);
          roomRef.current = response.room;
          const me = response.room?.players?.find((p: PlayerData) => p.id === response.playerId);
          setCurrentPlayer(me || null);
          setError(null);
        } else {
          clearSessionData();
          sock.emit('room:get', { roomCode: normalizedRoomCode }, (lookupResponse: any) => {
            setRoomLookupComplete(true);
            if (lookupResponse.success) {
              setRoom(lookupResponse.room);
              roomRef.current = lookupResponse.room;
              setCurrentPlayer(null);
              setError(null);
            } else {
              setError(lookupResponse.error?.message || response.error?.message || 'Sala não encontrada.');
              setRoom(null);
              roomRef.current = null;
              setCurrentPlayer(null);
            }
          });
        }
      });
      return;
    }

    sock.emit('room:get', { roomCode: normalizedRoomCode }, (response: any) => {
      setRoomLookupComplete(true);
      if (response.success) {
        setRoom(response.room);
        roomRef.current = response.room;
        setCurrentPlayer(null);
        setError(null);
      } else {
        setRoom(null);
        roomRef.current = null;
        setCurrentPlayer(null);
        setError(response.error?.message || 'Sala não encontrada.');
      }
    });
  }, [normalizedRoomCode]);

  const getSocketInstance = useCallback((): Socket => {
    if (!enabled) return null as any;
    try {
      return getSocket();
    } catch {
      return null as any;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      disconnectSocket();
      setConnectionStatus('disconnected');
      setRoomLookupComplete(true);
      return;
    }
    let sock: Socket;
    try {
      sock = getSocket();
    } catch {
      setConnectionStatus('error');
      setSocketError(getLastSocketError());
      return;
    }

    const onConnect = () => {
      setConnectionStatus('connected');
      setError(null);
      if (!roomRef.current) loadRoomFromCode(sock);
    };

    const onDisconnect = () => {
      setConnectionStatus('disconnected');
      setSocketError(getLastSocketError());
    };
    const onConnectError = () => {
      setConnectionStatus('error');
      setSocketError(getLastSocketError());
    };
    const onReconnectAttempt = () => setConnectionStatus('reconnecting');

    const onRoomUpdated = (data: RoomState) => {
      setRoom(data);
      roomRef.current = data;
      if (playerIdRef.current) {
        const me = data.players.find(p => p.id === playerIdRef.current);
        if (me) setCurrentPlayer(me);
      }
    };

    const onRoomClosed = (data: { reason: string }) => {
      setError(data.reason || 'A sala foi encerrada.');
      setRoom(null);
      roomRef.current = null;
      setCurrentPlayer(null);
      clearSessionData();
    };

    const onPlayerKicked = (data: { reason: string }) => {
      setError(data.reason || 'Você foi removido da sala.');
      setRoom(null);
      roomRef.current = null;
      setCurrentPlayer(null);
      clearSessionData();
    };

    const onHostTransferred = (data: { newHostId: string; newHostName: string }) => {
      if (roomRef.current) {
        const updatedPlayers = roomRef.current.players.map(p => ({
          ...p,
          isHost: p.id === data.newHostId,
        }));
        const updatedRoom = { ...roomRef.current, players: updatedPlayers };
        setRoom(updatedRoom);
        roomRef.current = updatedRoom;
        if (playerIdRef.current) {
          const me = updatedPlayers.find(p => p.id === playerIdRef.current);
          if (me) setCurrentPlayer(me);
        }
      }
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('connect_error', onConnectError);
    sock.on('reconnect_attempt', onReconnectAttempt);
    sock.on('room:updated', onRoomUpdated);
    sock.on('room:closed', onRoomClosed);
    sock.on('player:kicked', onPlayerKicked);
    sock.on('host:transferred', onHostTransferred);

    if (sock.connected) {
      setConnectionStatus('connected');
      if (!roomRef.current) loadRoomFromCode(sock);
    }

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('connect_error', onConnectError);
      sock.off('reconnect_attempt', onReconnectAttempt);
      sock.off('room:updated', onRoomUpdated);
      sock.off('room:closed', onRoomClosed);
      sock.off('player:kicked', onPlayerKicked);
      sock.off('host:transferred', onHostTransferred);
    };
  }, [enabled, loadRoomFromCode]);

  const isHost = currentPlayer?.isHost ?? false;

  const createRoom = useCallback(async (playerName: string, roomName: string, settings: RoomSettings, avatarUrl?: string): Promise<{ success: boolean; roomCode?: string; error?: string }> => {
    return new Promise((resolve) => {
      const sock = getSocket();
      sock.emit('room:create', { playerName, roomName, settings, avatarUrl: avatarUrl || DEFAULT_AVATAR }, (response: any) => {
        if (response.success) {
          playerIdRef.current = response.playerId;
          saveSessionData({ roomCode: response.roomCode, playerId: response.playerId, playerToken: response.playerToken });
          setRoom(response.room);
          roomRef.current = response.room;
          const me = response.room.players.find((p: PlayerData) => p.id === response.playerId);
          setCurrentPlayer(me || null);
          setError(null);
          resolve({ success: true, roomCode: response.roomCode });
        } else {
          resolve({ success: false, error: response.error?.message || 'Erro ao criar sala.' });
        }
      });
    });
  }, []);

  const joinRoom = useCallback(async (roomCode: string, playerName: string, avatarUrl?: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const sock = getSocket();
      const normalizedCode = normalizeRoomCode(roomCode);
      sock.emit('room:join', { roomCode: normalizedCode, playerName, avatarUrl: avatarUrl || DEFAULT_AVATAR }, (response: any) => {
        if (response.success) {
          playerIdRef.current = response.playerId;
          saveSessionData({ roomCode: response.roomCode, playerId: response.playerId, playerToken: response.playerToken });
          setRoom(response.room);
          roomRef.current = response.room;
          const me = response.room.players.find((p: PlayerData) => p.id === response.playerId);
          setCurrentPlayer(me || null);
          setError(null);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: response.error?.message || 'Erro ao entrar na sala.' });
        }
      });
    });
  }, []);

  const leaveRoom = useCallback(() => {
    const sock = getSocket();
    const code = roomRef.current?.code;
    if (!code) return;
    sock.emit('room:leave', { roomCode: code });
    setRoom(null);
    roomRef.current = null;
    setCurrentPlayer(null);
    clearSessionData();
  }, []);

  const toggleReady = useCallback(() => {
    if (!roomRef.current || !playerIdRef.current) return;
    const me = roomRef.current.players.find(p => p.id === playerIdRef.current);
    if (!me || me.isHost) return;
    const sock = getSocket();
    sock.emit('player:set-ready', { roomCode: roomRef.current.code, ready: !me.isReady });
    setCurrentPlayer(prev => prev ? { ...prev, isReady: !prev.isReady } : prev);
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<RoomSettings>): Promise<boolean> => {
    if (!roomRef.current) return false;
    const sock = getSocket();
    return new Promise((resolve) => {
      sock.emit('room:update-settings', { roomCode: roomRef.current!.code, settings: newSettings }, (response: any) => {
        resolve(response.success);
      });
    });
  }, []);

  const removePlayer = useCallback(async (targetPlayerId: string): Promise<boolean> => {
    if (!roomRef.current) return false;
    const sock = getSocket();
    return new Promise((resolve) => {
      sock.emit('player:kick', { roomCode: roomRef.current!.code, targetPlayerId }, (response: any) => {
        resolve(response.success);
      });
    });
  }, []);

  const startGame = useCallback(async (): Promise<{ success: boolean; error?: string; comingSoon?: boolean }> => {
    if (!roomRef.current) return { success: false, error: 'Sala não encontrada.' };
    const sock = getSocket();
    return new Promise((resolve) => {
      sock.emit('game:start', { roomCode: roomRef.current!.code }, (response: any) => {
        if (response.success) resolve({ success: true, comingSoon: response.comingSoon === true });
        else resolve({ success: false, error: response.error?.message || 'Erro ao iniciar partida.' });
      });
    });
  }, []);

  const pressBuzzer = useCallback(async (): Promise<boolean> => {
    if (!roomRef.current) return false;
    const sock = getSocket();
    return new Promise((resolve) => {
      sock.emit('buzzer:press', { roomCode: roomRef.current!.code }, (response: any) => {
        resolve(response?.success ?? false);
      });
    });
  }, []);

  const judgeAnswer = useCallback((playerId: string, result: 'correct' | 'wrong') => {
    if (!roomRef.current) return;
    const sock = getSocket();
    sock.emit('answer:judge', { roomCode: roomRef.current.code, playerId, result });
  }, []);

  const submitAnswer = useCallback((questionId: string, selectedAlternative: string) => {
    if (!roomRef.current) return;
    const sock = getSocket();
    sock.emit('answer:submit', { roomCode: roomRef.current.code, questionId, selectedAlternative });
  }, []);

  const requestRematch = useCallback(async (): Promise<boolean> => {
    if (!roomRef.current) return false;
    const sock = getSocket();
    return new Promise((resolve) => {
      sock.emit('game:rematch', { roomCode: roomRef.current!.code }, (response: any) => {
        resolve(response?.success ?? false);
      });
    });
  }, []);

  const createQuiz = useCallback(async (quizName: string, questions: any[]): Promise<{ success: boolean; quizId?: string; error?: string }> => {
    return new Promise((resolve) => {
      const sock = getSocket();
      sock.emit('quiz:create', { quizName, questions }, (response: any) => {
        if (response.success) resolve({ success: true, quizId: response.quizId });
        else resolve({ success: false, error: response.error?.message || 'Erro ao criar quiz.' });
      });
    });
  }, []);

  const createCustomContent = useCallback(async (payload: { gameType: string; title: string; items: any[] }): Promise<{ success: boolean; contentId?: string; title?: string; error?: string }> => {
    return new Promise((resolve) => {
      const sock = getSocket();
      sock.emit('content:create', payload, (response: any) => {
        if (response.success) resolve({ success: true, contentId: response.contentId, title: response.title });
        else resolve({ success: false, error: response.error?.message || 'Erro ao salvar conteudo personalizado.' });
      });
    });
  }, []);

  const assignTeams = useCallback(async (teamCount: number): Promise<boolean> => {
    if (!roomRef.current) return false;
    const sock = getSocket();
    return new Promise((resolve) => {
      sock.emit('team:assign', { roomCode: roomRef.current!.code, teamCount }, (response: any) => {
        resolve(response?.success ?? false);
      });
    });
  }, []);

  const chooseTeam = useCallback(async (teamId: string): Promise<{ success: boolean; error?: string }> => {
    if (!roomRef.current) return { success: false, error: 'Sala nao encontrada.' };
    const sock = getSocket();
    return new Promise((resolve) => {
      sock.emit('team:choose', { roomCode: roomRef.current!.code, teamId }, (response: any) => {
        if (response?.success) resolve({ success: true });
        else resolve({ success: false, error: response?.error?.message || 'Nao foi possivel entrar no time.' });
      });
    });
  }, []);

  const selectSofaPlayer = useCallback(async (targetPlayerId: string): Promise<boolean> => {
    if (!roomRef.current) return false;
    const sock = getSocket();
    return new Promise((resolve) => {
      sock.emit('sofa:select', { roomCode: roomRef.current!.code, targetPlayerId }, (response: any) => {
        resolve(response?.success ?? false);
      });
    });
  }, []);

  const submitWrittenAnswer = useCallback((questionId: string, answer: string) => {
    if (!roomRef.current) return;
    const sock = getSocket();
    sock.emit('answer:written', { roomCode: roomRef.current.code, questionId, answer });
  }, []);

  const onGameEvent = useCallback((event: string, handler: (...args: any[]) => void) => {
    const sock = getSocket();
    sock.on(event, handler);
  }, []);

  const offGameEvent = useCallback((event: string, handler: (...args: any[]) => void) => {
    const sock = getSocket();
    sock.off(event, handler);
  }, []);

    return {
      room,
      currentPlayer,
      connectionStatus,
      socketError,
      roomLookupComplete,
      isHost,
      error,
      createRoom,
      joinRoom,
      leaveRoom,
      toggleReady,
      updateSettings,
      removePlayer,
      startGame,
      pressBuzzer,
      judgeAnswer,
      submitAnswer,
      requestRematch,
      createQuiz,
      createCustomContent,
      assignTeams,
      chooseTeam,
      selectSofaPlayer,
      submitWrittenAnswer,
      onGameEvent,
      offGameEvent,
    };
}
