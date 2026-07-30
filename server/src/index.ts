import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { roomManager } from './RoomManager';
import { questionManager } from './QuestionManager';
import { gameManager } from './GameManager';
import { validateWrittenAnswer } from './validateAnswer';
import { Player, GameRoom, RoomSettings, RoomPrivacy, Difficulty, AnswerType, GameMode, QuestionSource, Question } from './types';
import { isValidRoomCode, normalizeRoomCode } from './roomCode';

function isValidQuestionCount(v: any): v is 10 | 15 | 20 | 30 {
  return [10, 15, 20, 30].includes(v);
}
function isValidMaxPlayers(v: any): v is 4 | 6 | 8 | 12 | 16 {
  return [4, 6, 8, 12, 16].includes(v);
}
function isValidAnswerTimeSeconds(v: any): v is 5 | 10 | 15 | 20 | 30 {
  return [5, 10, 15, 20, 30].includes(v);
}
function isValidDifficulty(v: any): v is Difficulty {
  return ['easy', 'medium', 'hard', 'mixed'].includes(v);
}
function isValidAnswerMode(v: any): v is AnswerType | 'mixed' {
  return ['spoken', 'multiple-choice', 'written', 'mixed'].includes(v);
}
function isValidPrivacy(v: any): v is RoomPrivacy {
  return ['public', 'private'].includes(v);
}
function isValidGameMode(v: any): v is GameMode {
  return ['classic', 'teams', 'couch'].includes(v);
}
function isValidQuestionSource(v: any): v is QuestionSource {
  return ['official', 'custom'].includes(v);
}

function generateId(): string { return crypto.randomUUID(); }
function generateToken(): string { return crypto.randomBytes(32).toString('hex'); }
function normalizeName(name: string): string { return name.trim().slice(0, 40); }

const QUESTION_REPORT_REASONS = new Set([
  'resposta incorreta',
  'pergunta ambígua',
  'erro de português',
  'pergunta repetida',
  'outro',
]);
const QUESTION_REPORTS_PATH = path.resolve(__dirname, '..', '..', 'data', 'reports', 'question-problems.jsonl');

function appendQuestionReport(report: {
  questionId: string;
  reason: string;
  mode: string;
  category?: string;
  difficulty?: string;
  roomCode?: string;
  playerId?: string;
}): void {
  fs.mkdirSync(path.dirname(QUESTION_REPORTS_PATH), { recursive: true });
  fs.appendFileSync(QUESTION_REPORTS_PATH, `${JSON.stringify({ ...report, date: new Date().toISOString() })}\n`, 'utf-8');
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(socketId: string, maxCalls: number = 10, windowMs: number = 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(socketId);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(socketId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxCalls) return false;
  entry.count++;
  return true;
}

questionManager.loadAll();

const app = express();
app.use(cors());
const httpServer = createServer(app);

const clientUrls = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map(s => s.trim())
  : ['http://localhost:3001'];
if (process.env.NODE_ENV !== 'production') {
  clientUrls.push('http://localhost:3000');
}

const io = new Server(httpServer, {
  cors: { origin: clientUrls, methods: ['GET', 'POST'], credentials: true },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.on('room:create', (data, callback) => {
    if (!checkRateLimit(socket.id, 5, 10000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { playerName, roomName, settings } = data;
      if (!playerName || typeof playerName !== 'string' || playerName.trim().length < 2 || playerName.trim().length > 20) {
        return callback?.({ success: false, error: { code: 'INVALID_PLAYER_NAME', message: 'Nome deve ter entre 2 e 20 caracteres.' } });
      }
      if (!roomName || typeof roomName !== 'string' || roomName.trim().length < 3 || roomName.trim().length > 40) {
        return callback?.({ success: false, error: { code: 'INVALID_ROOM_NAME', message: 'Nome da sala deve ter entre 3 e 40 caracteres.' } });
      }
      if (!settings || typeof settings !== 'object') {
        return callback?.({ success: false, error: { code: 'INVALID_SETTINGS', message: 'Configurações inválidas.' } });
      }

      const gameMode: GameMode = isValidGameMode(settings.gameMode) ? settings.gameMode : 'classic';
      const questionSource: QuestionSource = isValidQuestionSource(settings.questionSource) ? settings.questionSource : 'official';
      const answerMode = isValidAnswerMode(settings.answerMode) ? settings.answerMode : 'multiple-choice';

      if (gameMode === 'teams' && settings.questionSource !== 'custom') {
        // teams only with spoken or mixed to prevent issues
      }

      if (questionSource === 'custom') {
        if (!settings.customQuizId) {
          return callback?.({ success: false, error: { code: 'MISSING_CUSTOM_QUIZ', message: 'Quiz não fornecido.' } });
        }
        const quiz = roomManager.getCustomQuiz(settings.customQuizId);
        if (!quiz) {
          return callback?.({ success: false, error: { code: 'CUSTOM_QUIZ_NOT_FOUND', message: 'Quiz não encontrado.' } });
        }
      } else {
        if (!Array.isArray(settings.categories) || settings.categories.length === 0) {
          return callback?.({ success: false, error: { code: 'INVALID_CATEGORIES', message: 'Selecione ao menos uma categoria.' } });
        }
      }

      const finalSettings: RoomSettings = {
        gameMode,
        questionSource,
        answerMode,
        questionCount: isValidQuestionCount(settings.questionCount) ? settings.questionCount : 15,
        difficulty: isValidDifficulty(settings.difficulty) ? settings.difficulty : 'mixed',
        categories: settings.categories || ['Tudo misturado'],
        maxPlayers: isValidMaxPlayers(settings.maxPlayers) ? settings.maxPlayers : 8,
        answerTimeSeconds: isValidAnswerTimeSeconds(settings.answerTimeSeconds) ? settings.answerTimeSeconds : 15,
        privacy: isValidPrivacy(settings.privacy) ? settings.privacy : 'public',
        wrongAnswerPenalty: typeof settings.wrongAnswerPenalty === 'number' ? settings.wrongAnswerPenalty : 0,
        allowRebound: settings.allowRebound !== false,
        teamTurnMode: settings.teamTurnMode || 'rotation',
        customQuizId: settings.customQuizId,
        teamCount: settings.teamCount,
      };

      const code = roomManager.generateCode();
      const playerId = generateId();
      const playerToken = generateToken();

      const player: Player = {
        id: playerId,
        token: playerToken,
        socketId: socket.id,
        name: normalizeName(playerName),
        score: 0,
        isHost: true,
        isReady: false,
        isConnected: true,
        joinedAt: Date.now(),
      };

      const room = roomManager.createRoom(code, normalizeName(roomName), playerId, finalSettings);
      roomManager.addPlayer(room, player);

      if (gameMode === 'teams') {
        const teamCount = finalSettings.teamCount || 2;
        gameManager.assignTeams(room, teamCount);
      }

      socket.join(`room:${code}`);
      const roomState = roomManager.getRoomState(room);
      callback?.({ success: true, roomCode: code, playerId, playerToken, room: roomState });
      io.emit('rooms:updated', roomManager.getPublicRoomList());
      console.log(`[room:create] ${code} - ${room.name} (${gameMode}, ${questionSource})`);
    } catch (err) {
      console.error('[room:create] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('room:join', (data, callback) => {
    if (!checkRateLimit(socket.id, 10, 10000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { roomCode, playerName } = data;
      if (!isValidRoomCode(roomCode)) {
        return callback?.({ success: false, error: { code: 'INVALID_ROOM_CODE', message: 'Código inválido.' } });
      }
      if (!playerName || typeof playerName !== 'string' || playerName.trim().length < 2 || playerName.trim().length > 20) {
        return callback?.({ success: false, error: { code: 'INVALID_PLAYER_NAME', message: 'Nome deve ter entre 2 e 20 caracteres.' } });
      }
      const code = normalizeRoomCode(roomCode);
      const room = roomManager.getRoom(code);
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      if (room.status !== 'lobby') return callback?.({ success: false, error: { code: 'GAME_ALREADY_STARTED', message: 'Partida já começou.' } });
      if (room.players.size >= room.settings.maxPlayers) return callback?.({ success: false, error: { code: 'ROOM_FULL', message: 'Sala cheia.' } });

      const normalizedName = normalizeName(playerName);
      if (Array.from(room.players.values()).some(p => p.name.toLowerCase() === normalizedName.toLowerCase())) {
        return callback?.({ success: false, error: { code: 'PLAYER_NAME_TAKEN', message: 'Nome já em uso.' } });
      }

      const playerId = generateId();
      const playerToken = generateToken();
      const player: Player = {
        id: playerId, token: playerToken, socketId: socket.id, name: normalizedName,
        score: 0, isHost: false, isReady: false, isConnected: true, joinedAt: Date.now(),
      };

      if (room.settings.gameMode === 'teams' && room.teams.length > 0) {
        const smallestTeam = room.teams.reduce((min, t) => t.playerIds.length < min.playerIds.length ? t : min, room.teams[0]);
        player.teamId = smallestTeam.id;
        smallestTeam.playerIds.push(playerId);
      }

      roomManager.addPlayer(room, player);
      socket.join(`room:${code}`);
      const roomState = roomManager.getRoomState(room);
      callback?.({ success: true, roomCode: code, playerId, playerToken, room: roomState });
      io.to(`room:${code}`).emit('room:updated', roomState);
      io.emit('rooms:updated', roomManager.getPublicRoomList());
      console.log(`[room:join] ${code} - ${normalizedName}`);
    } catch (err) {
      console.error('[room:join] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('room:get', (data, callback) => {
    try {
      const { roomCode } = data;
      if (!isValidRoomCode(roomCode)) {
        return callback?.({ success: false, error: { code: 'INVALID_ROOM_CODE', message: 'Código inválido.' } });
      }
      const room = roomManager.getRoom(normalizeRoomCode(roomCode));
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      callback?.({ success: true, room: roomManager.getRoomState(room) });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('player:set-ready', (data, callback) => {
    try {
      const { roomCode, ready } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Você não está nesta sala.' } });
      if (player.isHost) return callback?.({ success: false, error: { code: 'HOST_CANT_READY', message: 'Host não precisa ficar pronto.' } });
      if (room.status !== 'lobby') return callback?.({ success: false, error: { code: 'GAME_STARTED', message: 'Partida já começou.' } });
      player.isReady = !!ready;
      room.lastActivityAt = Date.now();
      io.to(`room:${roomCode}`).emit('room:updated', roomManager.getRoomState(room));
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('player:kick', (data, callback) => {
    try {
      const { roomCode, targetPlayerId } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Você não está nesta sala.' } });
      if (!player.isHost) return callback?.({ success: false, error: { code: 'NOT_HOST', message: 'Apenas o host pode remover.' } });
      if (player.id === targetPlayerId) return callback?.({ success: false, error: { code: 'CANNOT_KICK_SELF', message: 'Não pode remover a si mesmo.' } });
      if (room.status !== 'lobby') return callback?.({ success: false, error: { code: 'GAME_STARTED', message: 'Partida já começou.' } });
      const target = roomManager.getPlayerInRoom(room, targetPlayerId);
      if (!target) return callback?.({ success: false, error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado.' } });
      if (target.socketId) {
        const ts = io.sockets.sockets.get(target.socketId);
        if (ts) { ts.leave(`room:${roomCode}`); ts.emit('player:kicked', { reason: 'Removido pelo host.' }); }
      }
      roomManager.removePlayer(room, targetPlayerId);
      io.to(`room:${roomCode}`).emit('room:updated', roomManager.getRoomState(room));
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('team:assign', (data, callback) => {
    try {
      const { roomCode, teamCount, teamNames, teamColors } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player?.isHost) return callback?.({ success: false, error: { code: 'NOT_HOST', message: 'Apenas o host.' } });
      if (room.status !== 'lobby') return callback?.({ success: false, error: { code: 'GAME_STARTED', message: 'Partida já começou.' } });
      const tc = Math.min(Math.max(teamCount || 2, 2), 8);
      room.settings.teamCount = tc;
      gameManager.assignTeams(room, tc);
      if (teamNames) {
        for (let i = 0; i < Math.min(teamNames.length, room.teams.length); i++) {
          if (teamNames[i]) room.teams[i].name = teamNames[i];
        }
      }
      if (teamColors) {
        for (let i = 0; i < Math.min(teamColors.length, room.teams.length); i++) {
          if (teamColors[i]) room.teams[i].color = teamColors[i];
        }
      }
      room.lastActivityAt = Date.now();
      io.to(`room:${roomCode}`).emit('room:updated', roomManager.getRoomState(room));
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('team:move-player', (data, callback) => {
    try {
      const { roomCode, playerId, targetTeamId } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player?.isHost) return callback?.({ success: false, error: { code: 'NOT_HOST', message: 'Apenas o host.' } });
      const target = room.players.get(playerId);
      if (!target) return callback?.({ success: false, error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado.' } });
      const newTeam = room.teams.find(t => t.id === targetTeamId);
      if (!newTeam) return callback?.({ success: false, error: { code: 'TEAM_NOT_FOUND', message: 'Time não encontrado.' } });

      for (const t of room.teams) {
        t.playerIds = t.playerIds.filter(id => id !== playerId);
      }
      target.teamId = targetTeamId;
      newTeam.playerIds.push(playerId);

      room.lastActivityAt = Date.now();
      io.to(`room:${roomCode}`).emit('room:updated', roomManager.getRoomState(room));
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('room:update-settings', (data, callback) => {
    try {
      const { roomCode, settings } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player?.isHost) return callback?.({ success: false, error: { code: 'NOT_HOST', message: 'Apenas o host.' } });
      if (room.status !== 'lobby') return callback?.({ success: false, error: { code: 'GAME_STARTED', message: 'Partida já começou.' } });
      let changed = false;
      if (settings.questionCount !== undefined && isValidQuestionCount(settings.questionCount)) { room.settings.questionCount = settings.questionCount; changed = true; }
      if (settings.maxPlayers !== undefined && isValidMaxPlayers(settings.maxPlayers) && settings.maxPlayers >= room.players.size) { room.settings.maxPlayers = settings.maxPlayers; changed = true; }
      if (settings.answerTimeSeconds !== undefined && isValidAnswerTimeSeconds(settings.answerTimeSeconds)) { room.settings.answerTimeSeconds = settings.answerTimeSeconds; changed = true; }
      if (settings.difficulty !== undefined && isValidDifficulty(settings.difficulty)) { room.settings.difficulty = settings.difficulty; changed = true; }
      if (settings.answerMode !== undefined && isValidAnswerMode(settings.answerMode)) { room.settings.answerMode = settings.answerMode; changed = true; }
      if (settings.wrongAnswerPenalty !== undefined) { room.settings.wrongAnswerPenalty = settings.wrongAnswerPenalty; changed = true; }
      if (settings.allowRebound !== undefined) { room.settings.allowRebound = settings.allowRebound; changed = true; }
      if (settings.teamTurnMode !== undefined) { room.settings.teamTurnMode = settings.teamTurnMode; changed = true; }
      if (changed) {
        room.lastActivityAt = Date.now();
        io.to(`room:${roomCode}`).emit('room:updated', roomManager.getRoomState(room));
        io.emit('rooms:updated', roomManager.getPublicRoomList());
      }
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('room:leave', (data, callback) => {
    try {
      handleLeave(socket, data.roomCode, callback);
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('room:reconnect', (data, callback) => {
    try {
      const { roomCode, playerId, playerToken } = data;
      if (!isValidRoomCode(roomCode) || !playerId || !playerToken) {
        return callback?.({ success: false, error: { code: 'INVALID_DATA', message: 'Dados inválidos.' } });
      }
      const code = normalizeRoomCode(roomCode);
      const room = roomManager.getRoom(code);
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = roomManager.getPlayerInRoom(room, playerId);
      if (!player || player.token !== playerToken) {
        return callback?.({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido.' } });
      }
      roomManager.markConnected(room, playerId, socket.id);
      socket.join(`room:${code}`);
      const roomState = roomManager.getRoomState(room);
      const gameState = room.status !== 'lobby' ? gameManager.getFullGameState(room) : null;
      callback?.({ success: true, room: roomState, playerId: player.id, playerToken: player.token, gameState });
      io.to(`room:${code}`).emit('room:updated', roomState);
      console.log(`[reconnect] ${code} - ${player.name}`);
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('game:start', (data, callback) => {
    try {
      const { roomCode } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player?.isHost) return callback?.({ success: false, error: { code: 'NOT_HOST', message: 'Apenas o host.' } });
      if (room.status !== 'lobby') return callback?.({ success: false, error: { code: 'GAME_STARTED', message: 'Partida já começou.' } });

      if (room.settings.gameMode !== 'couch') {
        const nonHostPlayers = Array.from(room.players.values()).filter(p => !p.isHost);
        if (nonHostPlayers.length < 1) {
          return callback?.({ success: false, error: { code: 'NOT_ENOUGH_PLAYERS', message: 'Mínimo de 2 jogadores.' } });
        }
        const notReady = nonHostPlayers.filter(p => !p.isReady);
        if (notReady.length > 0) {
          return callback?.({ success: false, error: { code: 'PLAYERS_NOT_READY', message: `Aguardando ${notReady.length} jogador(es).` } });
        }
      }

      let result;
      if (room.settings.questionSource === 'custom' && room.settings.customQuizId) {
        const success = gameManager.selectCustomQuiz(room, room.settings.customQuizId);
        if (!success) return callback?.({ success: false, error: { code: 'CUSTOM_QUIZ_ERROR', message: 'Erro ao carregar quiz.' } });
        result = { success: true as const };
      } else {
        result = gameManager.selectQuestions(room);
      }
      if (!result.success) {
        return callback?.({ success: false, error: { code: result.error, message: `Perguntas insuficientes. Disponível: ${result.available}.` } });
      }

      if (room.settings.gameMode === 'teams' && room.teams.length > 0) {
        gameManager.rotateTeamActivePlayers(room);
      }

      gameManager.resetScores(room);
      room.roundHistory = [];

      io.to(`room:${roomCode}`).emit('game:countdown', { count: 3 });
      room.status = 'countdown';
      room.lastActivityAt = Date.now();
      io.to(`room:${roomCode}`).emit('room:updated', roomManager.getRoomState(room));
      io.emit('rooms:updated', roomManager.getPublicRoomList());
      callback?.({ success: true });

      setTimeout(() => {
        room.status = 'question-visible';
        const gameState = gameManager.getFullGameState(room);
        io.to(`room:${roomCode}`).emit('game:started', { gameState });

        setTimeout(() => {
          room.status = 'buzzer-open';
          room.currentBuzzerWinnerId = null;
          room.roundStartedAt = Date.now();
          io.to(`room:${roomCode}`).emit('game:state', gameManager.getFullGameState(room));
          io.to(`room:${roomCode}`).emit('buzzer:opened', { roundStartedAt: room.roundStartedAt });

          const timeLimit = room.selectedQuestions[room.currentQuestionIndex]?.timeLimitSeconds || 15;
          const buzzerTimeout = Math.min(timeLimit * 1000, 15000);
          setTimeout(() => {
            if (room.status === 'buzzer-open' && room.currentBuzzerWinnerId === null) {
              handleBuzzerTimeout(room);
            }
          }, buzzerTimeout);
        }, 2000);
      }, 3000);
    } catch (err) {
      console.error('[game:start] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('buzzer:press', (data, callback) => {
    if (!checkRateLimit(socket.id, 5, 2000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { roomCode } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Você não está nesta sala.' } });

      if (!gameManager.canPlayerBuzz(room, player.id)) {
        return callback?.({ success: false, error: { code: 'BUZZER_NOT_OPEN', message: 'Botão não disponível.' } });
      }

      const reactionTime = room.roundStartedAt ? Date.now() - room.roundStartedAt : 0;
      gameManager.addRoundEvent(room, { type: 'buzzer-pressed', playerId: player.id, playerName: player.name, data: { reactionTime } });

      callback?.({ success: true });
      startAnswerTurn(room, player, { reactionTime });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('answer:submit', (data, callback) => {
    if (!checkRateLimit(socket.id, 5, 5000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { roomCode, questionId, selectedAlternative } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Você não está nesta sala.' } });
      if (room.currentBuzzerWinnerId !== player.id) {
        return callback?.({ success: false, error: { code: 'NOT_YOUR_TURN', message: 'Não é sua vez.' } });
      }
      if (room.status !== 'answering') {
        return callback?.({ success: false, error: { code: 'NOT_ANSWERING', message: 'Aguarde vencer o buzzer para responder.' } });
      }
      if (room.blockedPlayerIds.has(player.id)) {
        return callback?.({ success: false, error: { code: 'ALREADY_TRIED', message: 'Voce ja tentou responder esta pergunta.' } });
      }
      const question = gameManager.getCurrentQuestion(room);
      if (!question || question.id !== questionId) {
        return callback?.({ success: false, error: { code: 'WRONG_QUESTION', message: 'Pergunta inválida.' } });
      }
      if (room.answerDeadlineAt && Date.now() > room.answerDeadlineAt) {
        handleAnswerTimeout(room, player.id, room.answerAttemptId);
        return callback?.({ success: false, error: { code: 'TIME_EXPIRED', message: 'Tempo esgotado.' } });
      }

      clearAnswerTimer(room);
      room.answeredPlayerIds.add(player.id);
      const isCorrect = question.alternatives && question.correctAlternativeIndex !== undefined
        ? selectedAlternative === question.alternatives[question.correctAlternativeIndex]
        : selectedAlternative === question.correctAnswer;

      room.lastActivityAt = Date.now();
      gameManager.addRoundEvent(room, { type: 'alternative-selected', playerId: player.id, playerName: player.name, data: { alternative: selectedAlternative } });

      if (isCorrect) {
        gameManager.handleCorrectAnswer(room, player.id);
        io.to(`room:${roomCode}`).emit('answer:result', {
          playerId: player.id, result: 'correct',
          scores: gameManager.getScores(room),
          teamScores: gameManager.getTeamScores(room),
        });
        setTimeout(() => advanceToNext(room), 1000);
      } else {
        gameManager.handleWrongAnswer(room, player.id);
        continueAfterFailedAttempt(room, player.id, 'wrong');
      }
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('answer:written', (data, callback) => {
    if (!checkRateLimit(socket.id, 5, 5000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { roomCode, questionId, answer } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Você não está nesta sala.' } });
      if (room.currentBuzzerWinnerId !== player.id) {
        return callback?.({ success: false, error: { code: 'NOT_YOUR_TURN', message: 'Não é sua vez.' } });
      }
      const question = gameManager.getCurrentQuestion(room);
      if (!question || question.id !== questionId) {
        return callback?.({ success: false, error: { code: 'WRONG_QUESTION', message: 'Pergunta inválida.' } });
      }

      if (room.status !== 'answering') {
        return callback?.({ success: false, error: { code: 'NOT_ANSWERING', message: 'Aguarde vencer o buzzer para responder.' } });
      }
      if (room.blockedPlayerIds.has(player.id)) {
        return callback?.({ success: false, error: { code: 'ALREADY_TRIED', message: 'Voce ja tentou responder esta pergunta.' } });
      }
      if (room.answerDeadlineAt && Date.now() > room.answerDeadlineAt) {
        handleAnswerTimeout(room, player.id, room.answerAttemptId);
        return callback?.({ success: false, error: { code: 'TIME_EXPIRED', message: 'Tempo esgotado.' } });
      }

      clearAnswerTimer(room);
      const result = validateWrittenAnswer(
        answer || '',
        question.correctAnswer || '',
        question.acceptedAnswers || [],
        question.strictness || 'normalized',
      );

      room.answeredPlayerIds.add(player.id);
      room.lastActivityAt = Date.now();
      gameManager.addRoundEvent(room, { type: 'written-submitted', playerId: player.id, playerName: player.name });

      if (result.isCorrect) {
        gameManager.handleCorrectAnswer(room, player.id);
        io.to(`room:${roomCode}`).emit('answer:result', {
          playerId: player.id, result: 'correct',
          scores: gameManager.getScores(room), teamScores: gameManager.getTeamScores(room),
        });
        setTimeout(() => advanceToNext(room), 1000);
      } else {
        gameManager.handleWrongAnswer(room, player.id);
        continueAfterFailedAttempt(room, player.id, 'wrong');
      }
      callback?.({ success: true, isCorrect: result.isCorrect });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('answer:judge', (data, callback) => {
    try {
      const { roomCode, playerId, result } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player?.isHost) return callback?.({ success: false, error: { code: 'NOT_HOST', message: 'Apenas o host.' } });

      const targetPlayer = room.players.get(playerId);
      if (!targetPlayer) return callback?.({ success: false, error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado.' } });
      if (room.currentBuzzerWinnerId !== playerId || room.status !== 'answering') {
        return callback?.({ success: false, error: { code: 'NOT_CURRENT_PLAYER', message: 'Este jogador nao esta respondendo.' } });
      }
      if (room.blockedPlayerIds.has(playerId)) {
        return callback?.({ success: false, error: { code: 'ALREADY_TRIED', message: 'Jogador ja tentou responder esta pergunta.' } });
      }
      if (room.answerDeadlineAt && Date.now() > room.answerDeadlineAt) {
        handleAnswerTimeout(room, playerId, room.answerAttemptId);
        return callback?.({ success: false, error: { code: 'TIME_EXPIRED', message: 'Tempo esgotado.' } });
      }

      clearAnswerTimer(room);
      room.answeredPlayerIds.add(playerId);
      room.lastActivityAt = Date.now();
      gameManager.addRoundEvent(room, { type: 'answer-judged', playerId, playerName: targetPlayer.name, data: { result } });

      if (result === 'correct') {
        gameManager.handleCorrectAnswer(room, playerId);
        io.to(`room:${roomCode}`).emit('answer:result', {
          playerId, result: 'correct',
          scores: gameManager.getScores(room), teamScores: gameManager.getTeamScores(room),
        });
        setTimeout(() => advanceToNext(room), 1000);
      } else {
        gameManager.handleWrongAnswer(room, playerId);
        continueAfterFailedAttempt(room, playerId, 'wrong');
      }
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('question:report-problem', (data, callback) => {
    try {
      const { roomCode, questionId, reason } = data || {};
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Você não está nesta sala.' } });
      const question = gameManager.getCurrentQuestion(room);
      if (!question || question.id !== questionId) {
        return callback?.({ success: false, error: { code: 'WRONG_QUESTION', message: 'Pergunta inválida.' } });
      }
      if (!QUESTION_REPORT_REASONS.has(reason)) {
        return callback?.({ success: false, error: { code: 'INVALID_REASON', message: 'Motivo inválido.' } });
      }
      appendQuestionReport({
        questionId,
        reason,
        mode: room.settings.gameMode,
        category: question.category,
        difficulty: question.difficulty,
        roomCode: room.code,
        playerId: player.id,
      });
      callback?.({ success: true });
    } catch (err) {
      console.error('[question:report-problem] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('quiz:create', (data, callback) => {
    if (!checkRateLimit(socket.id, 3, 10000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { quizTitle, quizDescription, questions } = data;
      if (!quizTitle || typeof quizTitle !== 'string' || quizTitle.trim().length < 3) {
        return callback?.({ success: false, error: { code: 'INVALID_QUIZ_TITLE', message: 'Título deve ter pelo menos 3 caracteres.' } });
      }
      if (!Array.isArray(questions) || questions.length < 5) {
        return callback?.({ success: false, error: { code: 'NOT_ENOUGH_QUESTIONS', message: 'Quiz deve ter pelo menos 5 perguntas.' } });
      }
      if (questions.length > 100) {
        return callback?.({ success: false, error: { code: 'TOO_MANY_QUESTIONS', message: 'Máximo 100 perguntas.' } });
      }

      const quizId = crypto.randomUUID();
      const formattedQuestions: Question[] = questions.map((q: any, idx: number) => ({
        id: `custom-${quizId}-${idx}`,
        text: String(q.text || '').slice(0, 500),
        answerType: (['multiple-choice', 'written', 'spoken'].includes(q.answerType) ? q.answerType : 'multiple-choice') as AnswerType,
        category: q.category || 'Personalizado',
        difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as any,
        alternatives: q.alternatives?.map((a: any) => String(a).slice(0, 200)).slice(0, 6),
        correctAlternativeIndex: q.correctAlternativeIndex,
        correctAnswer: q.correctAnswer || '',
        acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers.slice(0, 10) : [],
        strictness: (['exact', 'normalized', 'tolerant'].includes(q.strictness) ? q.strictness : 'normalized') as any,
        timeLimitSeconds: typeof q.timeLimitSeconds === 'number' ? Math.min(Math.max(q.timeLimitSeconds, 5), 60) : 15,
        explanation: q.explanation || '',
      }));

      roomManager.saveCustomQuiz({
        id: quizId,
        title: quizTitle.trim(),
        description: quizDescription || '',
        questions: formattedQuestions,
        createdAt: Date.now(),
      });

      callback?.({ success: true, quizId, questionCount: formattedQuestions.length });
      console.log(`[quiz:create] ${quizId} - "${quizTitle}" (${formattedQuestions.length} questions)`);
    } catch (err) {
      console.error('[quiz:create] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('game:rematch', (data, callback) => {
    try {
      const { roomCode } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player?.isHost) return callback?.({ success: false, error: { code: 'NOT_HOST', message: 'Apenas o host.' } });
      if (room.status !== 'game-finished') return callback?.({ success: false, error: { code: 'GAME_NOT_FINISHED', message: 'Partida não terminou.' } });

      room.status = 'lobby';
      room.selectedQuestions = [];
      room.currentQuestionIndex = 0;
      room.currentBuzzerWinnerId = null;
      room.currentTeamId = null;
      room.blockedPlayerIds = new Set();
      room.roundHistory = [];
      room.roundStartedAt = null;
      room.sofaSelectedPlayerId = null;
      room.buzzerPressedAt = null;
      room.lastActivityAt = Date.now();
      room.teamRotationIndex = 0;
      for (const p of room.players.values()) { p.score = 0; p.isReady = false; }
      for (const t of room.teams) { t.score = 0; t.activePlayerId = undefined; }

      io.to(`room:${roomCode}`).emit('room:updated', roomManager.getRoomState(room));
      io.to(`room:${roomCode}`).emit('game:rematch', { roomCode });
      io.emit('rooms:updated', roomManager.getPublicRoomList());
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('rooms:list', (data, callback) => {
    try {
      callback?.({ success: true, rooms: roomManager.getPublicRoomList() });
    } catch (err) {
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    for (const room of roomManager.getAllRooms()) {
      const player = findPlayerBySocket(room, socket.id);
      if (!player) continue;
      roomManager.markDisconnected(room, player.id);
      if (player.isHost) {
        const newHost = roomManager.transferHost(room);
        if (newHost) {
          io.to(`room:${room.code}`).emit('host:transferred', { newHostId: newHost.id, newHostName: newHost.name });
        } else {
          setTimeout(() => {
            const cr = roomManager.getRoom(room.code);
            if (cr && cr.players.size === 0) {
              roomManager.deleteRoom(room.code);
              io.emit('rooms:updated', roomManager.getPublicRoomList());
            }
          }, 60000);
        }
      }
      io.to(`room:${room.code}`).emit('room:updated', roomManager.getRoomState(room));
      io.emit('rooms:updated', roomManager.getPublicRoomList());
      roomManager.schedulePlayerRemoval(room, player.id);
    }
  });

  function clearAnswerTimer(room: GameRoom): void {
    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }
    room.answerDeadlineAt = null;
  }

  function getEligiblePlayers(room: GameRoom): Player[] {
    return Array.from(room.players.values()).filter((p) => {
      if (!p.isConnected) return false;
      if (room.blockedPlayerIds.has(p.id)) return false;
      if (room.settings.gameMode === 'teams') {
        if (!p.teamId) return false;
        if (room.settings.teamTurnMode === 'rotation' || room.settings.teamTurnMode === undefined) {
          const team = room.teams.find(t => t.id === p.teamId);
          if (!team || team.activePlayerId !== p.id) return false;
        }
      }
      if (room.settings.gameMode === 'couch' && !p.couchControl) return false;
      return true;
    });
  }

  function startAnswerTurn(room: GameRoom, player: Player, options: { reactionTime?: number; transferredFromPlayerId?: string } = {}): void {
    clearAnswerTimer(room);
    room.answerAttemptId = (room.answerAttemptId || 0) + 1;
    const attemptId = room.answerAttemptId;
    const answerTimeMs = room.settings.answerTimeSeconds * 1000;
    const answerDeadlineAt = Date.now() + answerTimeMs;

    room.currentBuzzerWinnerId = player.id;
    room.status = 'answering';
    room.lastActivityAt = Date.now();
    room.buzzerPressedAt = Date.now();
    room.answerDeadlineAt = answerDeadlineAt;

    if (options.transferredFromPlayerId) {
      gameManager.addRoundEvent(room, {
        type: 'answer-transferred',
        playerId: player.id,
        playerName: player.name,
        data: { fromPlayerId: options.transferredFromPlayerId },
      });
    }

    io.to(`room:${room.code}`).emit('game:state', gameManager.getFullGameState(room));
    io.to(`room:${room.code}`).emit('buzzer:winner', {
      winnerId: player.id,
      winnerName: player.name,
      reactionTime: options.reactionTime,
      transferred: !!options.transferredFromPlayerId,
      fromPlayerId: options.transferredFromPlayerId,
    });

    for (const p of room.players.values()) {
      if (!p.socketId) continue;
      const pSocket = io.sockets.sockets.get(p.socketId);
      if (!pSocket) continue;
      const pq = gameManager.getQuestionForPlayer(room, p.id);
      pSocket.emit('question:for-player', { ...pq, answerDeadlineAt, attemptId });
    }

    room.answerTimer = setTimeout(() => {
      handleAnswerTimeout(room, player.id, attemptId);
    }, answerTimeMs);
  }

  function finishAllWrong(room: GameRoom, result: 'all_wrong' | 'timeout' = 'all_wrong'): void {
    clearAnswerTimer(room);
    room.currentBuzzerWinnerId = null;
    room.status = 'round-finished';
    const question = gameManager.getCurrentQuestion(room);
    io.to(`room:${room.code}`).emit('answer:result', {
      playerId: null,
      result,
      correctAnswer: question?.correctAnswer,
      explanation: question?.explanation,
      scores: gameManager.getScores(room),
      teamScores: gameManager.getTeamScores(room),
      roundContinues: false,
    });
    setTimeout(() => advanceToNext(room), 3000);
  }

  function continueAfterFailedAttempt(room: GameRoom, failedPlayerId: string, result: 'wrong' | 'timeout'): void {
    clearAnswerTimer(room);
    const failedPlayer = room.players.get(failedPlayerId);
    const eligible = getEligiblePlayers(room);

    if (eligible.length === 0) {
      finishAllWrong(room, 'all_wrong');
      return;
    }

    if (eligible.length === 1) {
      const nextPlayer = eligible[0];
      io.to(`room:${room.code}`).emit('answer:result', {
        playerId: failedPlayerId,
        playerName: failedPlayer?.name,
        result,
        scores: gameManager.getScores(room),
        teamScores: gameManager.getTeamScores(room),
        roundContinues: true,
        nextPlayerId: nextPlayer.id,
        nextPlayerName: nextPlayer.name,
        autoTransferred: true,
      });
      startAnswerTurn(room, nextPlayer, { transferredFromPlayerId: failedPlayerId });
      return;
    }

    io.to(`room:${room.code}`).emit('answer:result', {
      playerId: failedPlayerId,
      playerName: failedPlayer?.name,
      result,
      scores: gameManager.getScores(room),
      teamScores: gameManager.getTeamScores(room),
      roundContinues: true,
      eligiblePlayerIds: eligible.map(p => p.id),
    });

    setTimeout(() => {
      if (room.status === 'round-finished' || room.status === 'game-finished') return;
      room.status = 'buzzer-open';
      room.currentBuzzerWinnerId = null;
      room.roundStartedAt = Date.now();
      io.to(`room:${room.code}`).emit('game:state', gameManager.getFullGameState(room));
      io.to(`room:${room.code}`).emit('buzzer:opened', { roundStartedAt: room.roundStartedAt, eligiblePlayerIds: eligible.map(p => p.id) });
      io.to(`room:${room.code}`).emit('buzzer:winner', { winnerId: null, winnerName: null, blockedPlayerId: failedPlayerId });
    }, 1500);
  }

  function handleLeave(socketRef: any, roomCode: string, callback?: Function): void {
    const room = roomManager.getRoom(roomCode?.toUpperCase());
    if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
    const player = findPlayerBySocket(room, socketRef.id);
    if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Você não está nesta sala.' } });
    socketRef.leave(`room:${roomCode}`);
    if (player.isHost) {
      roomManager.removePlayer(room, player.id);
      const newHost = roomManager.transferHost(room);
      if (newHost) {
        io.to(`room:${roomCode}`).emit('host:transferred', { newHostId: newHost.id, newHostName: newHost.name });
        io.to(`room:${roomCode}`).emit('room:updated', roomManager.getRoomState(room));
        io.emit('rooms:updated', roomManager.getPublicRoomList());
        callback?.({ success: true, transferredHost: true, newHostId: newHost.id });
      } else {
        clearAnswerTimer(room);
        io.to(`room:${roomCode}`).emit('room:closed', { reason: 'O host saiu da sala.' });
        roomManager.deleteRoom(room.code);
        io.emit('rooms:updated', roomManager.getPublicRoomList());
        callback?.({ success: true, closed: true });
      }
    } else {
      roomManager.removePlayer(room, player.id);
      io.to(`room:${roomCode}`).emit('room:updated', roomManager.getRoomState(room));
      io.emit('rooms:updated', roomManager.getPublicRoomList());
      callback?.({ success: true });
    }
  }

  function handleBuzzerTimeout(room: GameRoom): void {
    room.status = 'round-finished';
    gameManager.addRoundEvent(room, { type: 'buzzer-timeout' });
    const question = gameManager.getCurrentQuestion(room);
    io.to(`room:${room.code}`).emit('answer:result', {
      playerId: null, result: 'timeout',
      correctAnswer: question?.correctAnswer, explanation: question?.explanation,
      scores: gameManager.getScores(room), teamScores: gameManager.getTeamScores(room),
    });
    setTimeout(() => advanceToNext(room), 3000);
  }

  function handleAnswerTimeout(room: GameRoom, playerId: string, attemptId?: number): void {
    if (room.status !== 'answering') return;
    if (attemptId !== undefined && room.answerAttemptId !== attemptId) return;
    if (room.currentBuzzerWinnerId !== playerId) return;
    clearAnswerTimer(room);
    gameManager.handleWrongAnswer(room, playerId);
    gameManager.addRoundEvent(room, { type: 'answer-timeout', playerId });
    continueAfterFailedAttempt(room, playerId, 'timeout');
  }

  function advanceToNext(room: GameRoom): void {
    clearAnswerTimer(room);
    if (room.currentQuestionIndex >= room.selectedQuestions.length - 1) {
      room.status = 'game-finished';
      room.lastActivityAt = Date.now();
      io.to(`room:${room.code}`).emit('game:finished', {
        scores: gameManager.getScores(room),
        teamScores: gameManager.getTeamScores(room),
      });
      io.to(`room:${room.code}`).emit('game:state', gameManager.getFullGameState(room));
      io.emit('rooms:updated', roomManager.getPublicRoomList());
      return;
    }

    room.currentQuestionIndex++;
    room.currentBuzzerWinnerId = null;
    room.currentTeamId = null;
    room.blockedPlayerIds = new Set();
    room.answeredPlayerIds = new Set();
    room.answerAttemptId = (room.answerAttemptId || 0) + 1;
    room.status = 'scoreboard';
    room.lastActivityAt = Date.now();
    room.buzzerPressedAt = null;

    if (room.settings.gameMode === 'teams' && room.teams.length > 0) {
      gameManager.rotateTeamActivePlayers(room);
    }

    io.to(`room:${room.code}`).emit('score:updated', {
      scores: gameManager.getScores(room),
      teamScores: gameManager.getTeamScores(room),
    });
    io.to(`room:${room.code}`).emit('game:state', gameManager.getFullGameState(room));

    setTimeout(() => {
      room.status = 'question-visible';
      io.to(`room:${room.code}`).emit('game:state', gameManager.getFullGameState(room));

      setTimeout(() => {
        room.status = 'buzzer-open';
        room.currentBuzzerWinnerId = null;
        room.roundStartedAt = Date.now();
        io.to(`room:${room.code}`).emit('game:state', gameManager.getFullGameState(room));
        io.to(`room:${room.code}`).emit('buzzer:opened', { roundStartedAt: room.roundStartedAt });

        const question = room.selectedQuestions[room.currentQuestionIndex];
        const buzzerTimeout = Math.min((question?.timeLimitSeconds || 15) * 1000, 15000);
        setTimeout(() => {
          if (room.status === 'buzzer-open' && room.currentBuzzerWinnerId === null) {
            handleBuzzerTimeout(room);
          }
        }, buzzerTimeout);
      }, 2000);
    }, 3000);
  }
});

function findPlayerBySocket(room: GameRoom, socketId: string): Player | undefined {
  for (const player of room.players.values()) {
    if (player.socketId === socketId) return player;
  }
  return undefined;
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Socket.IO running on port ${PORT}`);
  console.log(`[server] Origins: ${clientUrls.join(', ')}`);
  roomManager.startCleanupLoop();
});

process.on('SIGINT', () => {
  console.log('[server] Shutting down...');
  roomManager.stopCleanupLoop();
  io.close();
  httpServer.close();
  process.exit(0);
});
