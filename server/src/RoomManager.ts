import { GameRoom, Player, RoomSettings, RoomPublicData, CustomQuiz, Team, RoundEvent, sanitizeQuestion } from './types';
import * as crypto from 'crypto';
import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH } from './roomCode';

const ROOMS = new Map<string, GameRoom>();
const CUSTOM_QUIZZES = new Map<string, CustomQuiz>();

const DISCONNECT_TIMEOUT = 60000;
const INACTIVITY_CLEANUP = 30 * 60 * 1000;
const FINISHED_CLEANUP = 10 * 60 * 1000;

export class RoomManager {
  generateCode(): string {
    let code: string;
    do {
      code = '';
      const bytes = crypto.randomBytes(ROOM_CODE_LENGTH);
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_CHARS[bytes[i] % ROOM_CODE_CHARS.length];
      }
    } while (ROOMS.has(code));
    return code;
  }

  createRoom(code: string, name: string, hostPlayerId: string, settings: RoomSettings): GameRoom {
    const room: GameRoom = {
      code,
      name,
      hostPlayerId,
      status: 'lobby',
      settings,
      players: new Map(),
      teams: [],
      selectedQuestions: [],
      currentQuestionIndex: 0,
      currentBuzzerWinnerId: null,
      currentTeamId: null,
      blockedPlayerIds: new Set(),
      answeredPlayerIds: new Set(),
      roundHistory: [],
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      roundStartedAt: null,
      answerAttemptId: 0,
      answerDeadlineAt: null,
      answerTimer: null,
      teamRotationIndex: 0,
      usedQuestionIds: new Set(),
      usedFactKeys: new Set(),
      recentQuestionIds: [],
      categoryUsageCount: new Map(),
      difficultySequence: [],
    };
    ROOMS.set(code, room);
    return room;
  }

  getRoom(code: string): GameRoom | undefined {
    return ROOMS.get(code);
  }

  deleteRoom(code: string): boolean {
    return ROOMS.delete(code);
  }

  getPlayerInRoom(room: GameRoom, playerId: string): Player | undefined {
    return room.players.get(playerId);
  }

  addPlayer(room: GameRoom, player: Player): void {
    room.players.set(player.id, player);
    room.lastActivityAt = Date.now();
  }

  removePlayer(room: GameRoom, playerId: string): boolean {
    const result = room.players.delete(playerId);
    room.lastActivityAt = Date.now();
    return result;
  }

  transferHost(room: GameRoom): Player | null {
    const connectedPlayers = Array.from(room.players.values())
      .filter(p => p.isConnected && !p.isHost)
      .sort((a, b) => a.joinedAt - b.joinedAt);
    if (connectedPlayers.length === 0) return null;
    const newHost = connectedPlayers[0];
    newHost.isHost = true;
    newHost.isReady = false;
    room.hostPlayerId = newHost.id;
    room.lastActivityAt = Date.now();
    return newHost;
  }

  getAllRooms(): GameRoom[] {
    return Array.from(ROOMS.values());
  }

  getPublicRoomList(): RoomPublicData[] {
    const list: RoomPublicData[] = [];
    for (const room of ROOMS.values()) {
      if (room.settings.privacy !== 'public') continue;
      if (room.status !== 'lobby') continue;
      if (room.players.size >= room.settings.maxPlayers) continue;
      const host = room.players.get(room.hostPlayerId);
      list.push({
        code: room.code,
        name: room.name,
        hostName: host?.name ?? 'Anfitrião',
        status: room.status,
        settings: { ...room.settings },
        playerCount: room.players.size,
        createdAt: room.createdAt,
      });
    }
    list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }

  getRoomState(room: GameRoom): RoomState {
    return {
      code: room.code,
      name: room.name,
      hostPlayerId: room.hostPlayerId,
      status: room.status,
      settings: { ...room.settings },
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isHost: p.isHost,
        isReady: p.isReady,
        isConnected: p.isConnected,
        joinedAt: p.joinedAt,
        teamId: p.teamId,
        couchControl: p.couchControl,
        couchKeyLabel: p.couchKeyLabel,
      })),
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.selectedQuestions.length,
      currentBuzzerWinnerId: room.currentBuzzerWinnerId,
      currentTeamId: room.currentTeamId,
      blockedPlayerIds: Array.from(room.blockedPlayerIds),
      roundHistory: room.roundHistory.slice(-20),
      currentQuestion: null,
      orderedAlternatives: null,
      teams: room.teams,
    };
  }

  getGameState(room: GameRoom) {
    const question = room.selectedQuestions[room.currentQuestionIndex] || null;
    const safeQuestion = question ? sanitizeQuestion(question) : null;

    return {
      status: room.status,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.selectedQuestions.length,
      currentQuestion: safeQuestion,
      orderedAlternatives: null,
      currentBuzzerWinnerId: room.currentBuzzerWinnerId,
      currentTeamId: room.currentTeamId,
      blockedPlayerIds: Array.from(room.blockedPlayerIds),
      scores: Array.from(room.players.values())
        .map(p => ({ playerId: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score),
      teamScores: room.teams
        .map(t => ({
          teamId: t.id,
          name: t.name,
          color: t.color,
          score: t.score,
          activePlayerId: t.activePlayerId,
        }))
        .sort((a, b) => b.score - a.score),
      roundStartedAt: room.roundStartedAt,
      roundHistory: room.roundHistory.slice(-20),
      teams: room.teams,
    };
  }

  saveCustomQuiz(quiz: CustomQuiz): void {
    CUSTOM_QUIZZES.set(quiz.id, quiz);
  }

  getCustomQuiz(id: string): CustomQuiz | undefined {
    return CUSTOM_QUIZZES.get(id);
  }

  deleteCustomQuiz(id: string): boolean {
    return CUSTOM_QUIZZES.delete(id);
  }

  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  startCleanupLoop(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
  }

  stopCleanupLoop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [code, room] of ROOMS.entries()) {
      if (room.status === 'lobby' && room.players.size === 0) {
        ROOMS.delete(code);
        continue;
      }
      if (room.status === 'game-finished' && now - room.lastActivityAt > FINISHED_CLEANUP) {
        ROOMS.delete(code);
        continue;
      }
      if (now - room.lastActivityAt > INACTIVITY_CLEANUP) {
        ROOMS.delete(code);
        continue;
      }
      for (const [playerId, player] of room.players.entries()) {
        if (!player.isConnected && player.socketId === null) {
          if (now - room.lastActivityAt > DISCONNECT_TIMEOUT) {
            room.players.delete(playerId);
          }
        }
      }
    }

    for (const [quizId, quiz] of CUSTOM_QUIZZES.entries()) {
      const hasRoom = Array.from(ROOMS.values()).some(r => r.customQuiz?.id === quizId);
      if (!hasRoom) {
        CUSTOM_QUIZZES.delete(quizId);
      }
    }
  }

  markDisconnected(room: GameRoom, playerId: string): void {
    const player = room.players.get(playerId);
    if (player) {
      player.isConnected = false;
      player.socketId = null;
      room.lastActivityAt = Date.now();
    }
  }

  markConnected(room: GameRoom, playerId: string, socketId: string): Player | undefined {
    const player = room.players.get(playerId);
    if (player) {
      player.isConnected = true;
      player.socketId = socketId;
      room.lastActivityAt = Date.now();
    }
    return player;
  }

  schedulePlayerRemoval(room: GameRoom, playerId: string): void {
    setTimeout(() => {
      const currentRoom = ROOMS.get(room.code);
      if (!currentRoom) return;
      const player = currentRoom.players.get(playerId);
      if (!player || player.isConnected) return;
      currentRoom.players.delete(playerId);
      currentRoom.lastActivityAt = Date.now();
    }, DISCONNECT_TIMEOUT);
  }
}

type RoomState = import('./types').RoomState;

export const roomManager = new RoomManager();
