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
import { GAME_REGISTRY } from './gameRegistry';
import { quemChegaMaisPertoGameManager } from './games/quemChegaMaisPerto/QuemChegaMaisPertoGameManager';
import { qualEAPalavraGameManager } from './games/qualEAPalavra/QualEAPalavraGameManager';
import { bateOTempoGameManager } from './games/bateOTempo/BateOTempoGameManager';
import { tresLetrasGameManager } from './games/tresLetras/TresLetrasGameManager';
import { isValidTresLetrasCombination, normalizeTresLetrasCombination } from './games/tresLetras/letters';
import { validateWrittenAnswer } from './validateAnswer';
import { Player, GameRoom, RoomSettings, RoomPrivacy, Difficulty, AnswerType, GameMode, GameType, QuestionSource, Question, ScoringMode } from './types';
import { isValidRoomCode, normalizeRoomCode } from './roomCode';

function isValidQuestionCount(v: any): v is 10 | 15 | 20 | 30 {
  return [10, 15, 20, 30].includes(v);
}
function isValidRoundCount(v: any): v is number {
  return Number.isInteger(v) && v >= 1 && v <= 20;
}
function isValidTargetTimeSeconds(v: any): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 300;
}
function isValidRoundTimeSeconds(v: any): v is number {
  return Number.isInteger(v) && v >= 5 && v <= 180;
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
function isValidGameType(v: any): v is GameType {
  return ['bateprimeiro', 'dado-de-forca', 'tres-letras', 'bate-o-tempo', 'qual-e-a-palavra', 'quem-chega-mais-perto'].includes(v);
}
function isValidScoringMode(v: any): v is ScoringMode {
  return ['exact', 'approximate'].includes(v);
}
function isValidBoardSize(v: any): v is 'small' | 'medium' | 'large' {
  return ['small', 'medium', 'large'].includes(v);
}
function isValidTeamAssignmentMode(v: any): v is 'random' | 'manual' {
  return ['random', 'manual'].includes(v);
}
function isValidQuestionSource(v: any): v is QuestionSource {
  return ['official', 'custom'].includes(v);
}

function generateId(): string { return crypto.randomUUID(); }
function generateToken(): string { return crypto.randomBytes(32).toString('hex'); }
function normalizeName(name: string): string { return name.trim().slice(0, 40); }

const AVATAR_MAX_BYTES = 300_000;
const AVATAR_MAX_DIMENSION = 1024;
const AVATAR_ROOM_MAX_BYTES = 2_000_000;

function sanitizeAvatarUrl(value: unknown, room?: GameRoom): string | undefined {
  if (typeof value !== 'string') return undefined;
  const avatarUrl = value.trim();
  if (!avatarUrl) return undefined;
  if (/^\/avatar-game\/[a-z0-9_-]+\.png$/i.test(avatarUrl)) return avatarUrl;
  const avatar = parseCustomAvatarDataUrl(avatarUrl);
  if (avatar && (!room || getRoomCustomAvatarBytes(room) + avatar.bytes <= AVATAR_ROOM_MAX_BYTES)) {
    return avatarUrl;
  }
  return undefined;
}

function parseCustomAvatarDataUrl(value: string): { bytes: number; format: 'png' | 'jpeg' | 'webp'; width: number; height: number } | null {
  const match = /^data:image\/(png|jpe?g|webp);base64,([a-z0-9+/=]+)$/i.exec(value);
  if (!match) return null;

  const format = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase() as 'png' | 'jpeg' | 'webp';
  const payload = match[2];
  let buffer: Buffer;
  try {
    buffer = Buffer.from(payload, 'base64');
  } catch {
    return null;
  }
  if (buffer.length === 0 || buffer.length > AVATAR_MAX_BYTES) return null;

  const dimensions = getImageDimensions(buffer, format);
  if (!dimensions) return null;
  if (dimensions.width < 1 || dimensions.height < 1) return null;
  if (dimensions.width > AVATAR_MAX_DIMENSION || dimensions.height > AVATAR_MAX_DIMENSION) return null;

  return { bytes: buffer.length, format, ...dimensions };
}

function getImageDimensions(buffer: Buffer, declaredFormat: 'png' | 'jpeg' | 'webp'): { width: number; height: number } | null {
  if (declaredFormat === 'png') return getPngDimensions(buffer);
  if (declaredFormat === 'jpeg') return getJpegDimensions(buffer);
  return getWebpDimensions(buffer);
}

function getPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  if (!buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return null;
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function getJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd9 || marker === 0xda) return null;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

function getWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X' && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunk === 'VP8 ' && buffer.length >= 30) {
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) return null;
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === 'VP8L' && buffer.length >= 25) {
    if (buffer[20] !== 0x2f) return null;
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  return null;
}

function getCustomAvatarBytes(value?: string): number {
  if (!value) return 0;
  return parseCustomAvatarDataUrl(value)?.bytes ?? 0;
}

function getRoomCustomAvatarBytes(room: GameRoom): number {
  let total = 0;
  for (const player of room.players.values()) {
    total += getCustomAvatarBytes(player.avatarUrl);
  }
  return total;
}

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

interface RateLimitEntry {
  count: number;
  resetAt: number;
  violations: number;
  blockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function normalizeIp(value: unknown): string {
  if (typeof value !== 'string') return 'unknown';
  const first = value.split(',')[0]?.trim() || 'unknown';
  return first.startsWith('::ffff:') ? first.slice(7) : first;
}

function getSocketIp(socket: import('socket.io').Socket): string {
  const forwardedFor = socket.handshake.headers['x-forwarded-for'];
  const realIp = socket.handshake.headers['x-real-ip'];
  const cfConnectingIp = socket.handshake.headers['cf-connecting-ip'];
  return normalizeIp(cfConnectingIp || realIp || forwardedFor || socket.handshake.address);
}

function checkRateLimitKey(key: string, maxCalls: number, windowMs: number, blockBaseMs = 0): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (entry?.blockedUntil && entry.blockedUntil > now) return false;
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
      violations: entry?.violations || 0,
      blockedUntil: 0,
    });
    return true;
  }
  if (entry.count >= maxCalls) {
    entry.violations += 1;
    if (blockBaseMs > 0) {
      entry.blockedUntil = now + Math.min(60_000, blockBaseMs * Math.pow(2, Math.min(entry.violations - 1, 5)));
    }
    return false;
  }
  entry.count++;
  return true;
}

function checkRateLimit(socketId: string, maxCalls: number = 10, windowMs: number = 1000): boolean {
  return checkRateLimitKey(`socket:${socketId}`, maxCalls, windowMs);
}

function checkIpRateLimit(socket: import('socket.io').Socket, bucket: string, maxCalls: number, windowMs: number, blockBaseMs = 2_000): boolean {
  return checkRateLimitKey(`ip:${getSocketIp(socket)}:${bucket}`, maxCalls, windowMs, blockBaseMs);
}

function checkSocketAndIpRateLimit(
  socket: import('socket.io').Socket,
  bucket: string,
  socketMaxCalls: number,
  socketWindowMs: number,
  ipMaxCalls: number,
  ipWindowMs: number,
): boolean {
  return checkRateLimit(socket.id, socketMaxCalls, socketWindowMs)
    && checkIpRateLimit(socket, bucket, ipMaxCalls, ipWindowMs);
}

questionManager.loadAll();

const app = express();
const httpServer = createServer(app);

const clientUrls = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map(s => s.trim())
  : ['https://tempale.online', 'https://www.tempale.online', 'http://localhost:3001'];
if (process.env.NODE_ENV !== 'production') {
  clientUrls.push('http://localhost:3000');
}

app.use((req, _res, next) => {
  if (req.path === '/' || req.path === '/health' || req.path.startsWith('/socket.io')) {
    console.log('[http]', {
      method: req.method,
      path: req.path,
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent'],
    });
  }
  next();
});

app.use(cors({ origin: clientUrls, credentials: true }));
app.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'tempale-socket',
    message: 'Tempale Socket.IO server is running.',
  });
});
app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'tempale-socket',
    questionsLoaded: questionManager.getTotalLoaded(),
  });
});

const io = new Server(httpServer, {
  cors: { origin: clientUrls, methods: ['GET', 'POST'], credentials: true },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.engine.on('connection_error', (err) => {
  console.error('[socket.io] connection_error', {
    code: err.code,
    message: err.message,
    context: err.context,
    origin: err.req?.headers.origin,
    url: err.req?.url,
  });
});

io.on('connection', (socket) => {
  console.log('[socket.io] connected', {
    id: socket.id,
    origin: socket.handshake.headers.origin,
    transport: socket.conn.transport.name,
    address: socket.handshake.address,
  });

  socket.use((packet, next) => {
    const eventName = typeof packet[0] === 'string' ? packet[0] : 'unknown';
    if (!checkIpRateLimit(socket, 'socket-events', 80, 1000, 5_000)) {
      const maybeCallback = packet[packet.length - 1];
      if (typeof maybeCallback === 'function') {
        maybeCallback({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisicoes.' } });
      }
      return next(new Error(`RATE_LIMIT:${eventName}`));
    }
    next();
  });

  socket.conn.on('upgrade', (transport) => {
    console.log('[socket.io] transport upgraded', {
      id: socket.id,
      transport: transport.name,
    });
  });

  socket.on('room:create', (data, callback) => {
    if (!checkSocketAndIpRateLimit(socket, 'room:create', 5, 10000, 20, 60000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { playerName, roomName, settings } = data;
      const avatarUrl = sanitizeAvatarUrl(data?.avatarUrl);
      if (data?.avatarUrl && !avatarUrl) {
        return callback?.({ success: false, error: { code: 'INVALID_AVATAR', message: 'Avatar invalido ou muito grande.' } });
      }
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
      const gameType: GameType = isValidGameType(settings.gameType) ? settings.gameType : 'bateprimeiro';
      if ((gameType === 'quem-chega-mais-perto' || gameType === 'qual-e-a-palavra' || gameType === 'bate-o-tempo' || gameType === 'tres-letras') && gameMode === 'couch') {
        const gameLabel =
          gameType === 'qual-e-a-palavra'
            ? 'Qual e a Palavra'
            : gameType === 'bate-o-tempo'
              ? 'Bate o Tempo'
              : gameType === 'tres-letras'
                ? '3 Letras'
                : 'Quem Chega Mais Perto';
        return callback?.({
          success: false,
          error: {
            code: 'INVALID_GAME_MODE',
            message: `${gameLabel} aceita apenas os modos Individual ou Equipes.`,
          },
        });
      }
      const scoringMode: ScoringMode | undefined =
        gameType === 'qual-e-a-palavra' || gameType === 'tres-letras'
          ? undefined
          : isValidScoringMode(settings.scoringMode)
            ? settings.scoringMode
            : undefined;
      const teamAssignmentMode = isValidTeamAssignmentMode(settings.teamAssignmentMode) ? settings.teamAssignmentMode : 'random';
      const roundCount = gameType !== 'bateprimeiro' ? (isValidRoundCount(settings.roundCount) ? settings.roundCount : 8) : undefined;
      const hasCategoryRoundConfig = gameType === 'qual-e-a-palavra' || gameType === 'quem-chega-mais-perto';
      const hasCustomContent = hasCategoryRoundConfig || gameType === 'tres-letras';
      const isDadoDeForca = gameType === 'dado-de-forca';
      const category = typeof settings.category === 'string' && settings.category.trim().length > 0
        ? normalizeName(settings.category)
        : Array.isArray(settings.categories) && typeof settings.categories[0] === 'string'
          ? normalizeName(settings.categories[0])
          : 'Tudo misturado';
      const roundTimeSeconds = isValidRoundTimeSeconds(settings.roundTimeSeconds)
        ? Math.min(settings.roundTimeSeconds, gameType === 'bate-o-tempo' ? 60 : 180)
        : gameType === 'bate-o-tempo' ? 60 : 30;
      const boardSize = isValidBoardSize(settings.boardSize) ? settings.boardSize : 'medium';
      const maxChargeSeconds =
        Number.isInteger(settings.maxChargeSeconds) && settings.maxChargeSeconds >= 1 && settings.maxChargeSeconds <= 10
          ? settings.maxChargeSeconds
          : 4;
      const targetTimeMode = settings.targetTimeMode === 'manual' || settings.targetTimeMode === 'system' ? settings.targetTimeMode : undefined;
      const targetTimeMinSeconds = isValidTargetTimeSeconds(settings.targetTimeMinSeconds) ? settings.targetTimeMinSeconds : 5;
      const targetTimeMaxSeconds = isValidTargetTimeSeconds(settings.targetTimeMaxSeconds) ? settings.targetTimeMaxSeconds : 30;
      const validTargetTimeRange =
        targetTimeMinSeconds < targetTimeMaxSeconds
          ? { targetTimeMinSeconds, targetTimeMaxSeconds }
          : { targetTimeMinSeconds: 5, targetTimeMaxSeconds: 30 };
      const targetTimeRoundSeconds = Array.isArray(settings.targetTimeRoundSeconds)
        ? settings.targetTimeRoundSeconds
            .slice(0, roundCount || 8)
            .filter((value: unknown): value is number => isValidTargetTimeSeconds(value))
        : undefined;
      const questionSource: QuestionSource = isValidQuestionSource(settings.questionSource) ? settings.questionSource : 'official';
      const answerMode = isValidAnswerMode(settings.answerMode) ? settings.answerMode : 'multiple-choice';

      if (gameMode === 'teams' && settings.questionSource !== 'custom') {
        // teams only with spoken or mixed to prevent issues
      }

      if (questionSource === 'custom') {
        if (hasCustomContent) {
          if (!settings.customContentId) {
            return callback?.({ success: false, error: { code: 'MISSING_CUSTOM_CONTENT', message: 'Conteudo personalizado nao fornecido.' } });
          }
          const content = roomManager.getCustomQuiz(settings.customContentId);
          if (!content || content.gameType !== gameType) {
            return callback?.({ success: false, error: { code: 'CUSTOM_CONTENT_NOT_FOUND', message: 'Conteudo personalizado nao encontrado.' } });
          }
        } else {
          if (!settings.customQuizId) {
            return callback?.({ success: false, error: { code: 'MISSING_CUSTOM_QUIZ', message: 'Quiz nao fornecido.' } });
          }
          const quiz = roomManager.getCustomQuiz(settings.customQuizId);
          if (!quiz) {
            return callback?.({ success: false, error: { code: 'CUSTOM_QUIZ_NOT_FOUND', message: 'Quiz nao encontrado.' } });
          }
        }
      } else {
        if (!Array.isArray(settings.categories) || settings.categories.length === 0) {
          return callback?.({ success: false, error: { code: 'INVALID_CATEGORIES', message: 'Selecione ao menos uma categoria.' } });
        }
      }

      const finalSettings: RoomSettings = {
        gameType,
        scoringMode,
        targetTimeMode,
        targetTimeSeconds: isValidTargetTimeSeconds(settings.targetTimeSeconds) ? settings.targetTimeSeconds : undefined,
        targetTimeMinSeconds: gameType === 'bate-o-tempo' && targetTimeMode !== 'manual' ? validTargetTimeRange.targetTimeMinSeconds : undefined,
        targetTimeMaxSeconds: gameType === 'bate-o-tempo' && targetTimeMode !== 'manual' ? validTargetTimeRange.targetTimeMaxSeconds : undefined,
        targetTimeRoundSeconds:
          gameType === 'bate-o-tempo' && targetTimeMode === 'manual' && targetTimeRoundSeconds?.length === roundCount
            ? targetTimeRoundSeconds
            : undefined,
        gameMode,
        questionSource,
        answerMode,
        questionCount: isValidQuestionCount(settings.questionCount) ? settings.questionCount : 15,
        roundCount,
        category: hasCategoryRoundConfig ? category : undefined,
        difficulty: isValidDifficulty(settings.difficulty) ? settings.difficulty : 'mixed',
        categories: hasCategoryRoundConfig ? [category] : settings.categories || ['Tudo misturado'],
        maxPlayers: isValidMaxPlayers(settings.maxPlayers) ? settings.maxPlayers : 8,
        answerTimeSeconds: hasCategoryRoundConfig
          ? roundTimeSeconds
          : isValidAnswerTimeSeconds(settings.answerTimeSeconds)
            ? settings.answerTimeSeconds
            : 15,
        roundTimeSeconds: hasCategoryRoundConfig || gameType === 'bate-o-tempo' ? roundTimeSeconds : undefined,
        votingTimeSeconds: undefined,
        endRoundOnFirstSubmit: gameType === 'tres-letras' ? settings.endRoundOnFirstSubmit === true : undefined,
        boardSize: isDadoDeForca ? boardSize : undefined,
        maxChargeSeconds: isDadoDeForca ? maxChargeSeconds : undefined,
        privacy: isValidPrivacy(settings.privacy) ? settings.privacy : 'public',
        wrongAnswerPenalty: typeof settings.wrongAnswerPenalty === 'number' ? settings.wrongAnswerPenalty : 0,
        allowRebound: settings.allowRebound !== false,
        teamTurnMode: settings.teamTurnMode || 'rotation',
        teamAssignmentMode: gameMode === 'teams' ? teamAssignmentMode : undefined,
        customQuizId: settings.customQuizId,
        customContentId: hasCustomContent && questionSource === 'custom' ? settings.customContentId : undefined,
        customContentTitle: hasCustomContent && questionSource === 'custom' ? normalizeName(settings.customContentTitle || 'Personalizado') : undefined,
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
        avatarUrl,
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
        gameManager.assignTeams(room, teamCount, finalSettings.teamAssignmentMode || 'random');
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
    if (!checkSocketAndIpRateLimit(socket, 'room:join', 10, 10000, 60, 60000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { roomCode, playerName } = data;
      const rawAvatarUrl = data?.avatarUrl;
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

      const avatarUrl = sanitizeAvatarUrl(rawAvatarUrl, room);
      if (rawAvatarUrl && !avatarUrl) {
        return callback?.({ success: false, error: { code: 'INVALID_AVATAR', message: 'Avatar invalido, muito grande ou limite da sala atingido.' } });
      }

      const normalizedName = normalizeName(playerName);
      if (Array.from(room.players.values()).some(p => p.name.toLowerCase() === normalizedName.toLowerCase())) {
        return callback?.({ success: false, error: { code: 'PLAYER_NAME_TAKEN', message: 'Nome já em uso.' } });
      }

      const playerId = generateId();
      const playerToken = generateToken();
      const player: Player = {
        id: playerId, token: playerToken, socketId: socket.id, name: normalizedName,
        avatarUrl,
        score: 0, isHost: false, isReady: false, isConnected: true, joinedAt: Date.now(),
      };

      if (room.settings.gameMode === 'teams' && room.teams.length > 0 && room.settings.teamAssignmentMode !== 'manual') {
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
      const { roomCode, teamCount, teamNames, teamColors, teamAssignmentMode } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player?.isHost) return callback?.({ success: false, error: { code: 'NOT_HOST', message: 'Apenas o host.' } });
      if (room.status !== 'lobby') return callback?.({ success: false, error: { code: 'GAME_STARTED', message: 'Partida já começou.' } });
      const tc = Math.min(Math.max(teamCount || 2, 2), 8);
      room.settings.teamCount = tc;
      if (isValidTeamAssignmentMode(teamAssignmentMode)) {
        room.settings.teamAssignmentMode = teamAssignmentMode;
      }
      gameManager.assignTeams(room, tc, room.settings.teamAssignmentMode || 'random');
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

  socket.on('team:choose', (data, callback) => {
    try {
      const { roomCode, teamId } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala nÃ£o encontrada.' } });
      if (room.status !== 'lobby') return callback?.({ success: false, error: { code: 'GAME_STARTED', message: 'Partida jÃ¡ comeÃ§ou.' } });
      if (room.settings.gameMode !== 'teams' || room.settings.teamAssignmentMode !== 'manual') {
        return callback?.({ success: false, error: { code: 'MANUAL_TEAMS_DISABLED', message: 'Escolha manual de times nao esta ativa.' } });
      }

      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador nÃ£o encontrado.' } });

      const result = gameManager.movePlayerToTeam(room, player.id, teamId);
      if (!result.success) {
        return callback?.({ success: false, error: { code: 'TEAM_JOIN_FAILED', message: result.error || 'Nao foi possivel entrar no time.' } });
      }

      room.lastActivityAt = Date.now();
      io.to(`room:${room.code}`).emit('room:updated', roomManager.getRoomState(room));
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

      const result = gameManager.movePlayerToTeam(room, playerId, targetTeamId);
      if (!result.success) {
        return callback?.({ success: false, error: { code: 'TEAM_MOVE_FAILED', message: result.error || 'Nao foi possivel mover jogador.' } });
      }

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
      const gameState = room.status !== 'lobby'
        ? room.settings.gameType === 'quem-chega-mais-perto'
          ? quemChegaMaisPertoGameManager.getGameState(room)
          : room.settings.gameType === 'qual-e-a-palavra'
            ? qualEAPalavraGameManager.getGameState(room)
            : room.settings.gameType === 'bate-o-tempo'
              ? bateOTempoGameManager.getGameState(room)
              : room.settings.gameType === 'tres-letras'
                ? tresLetrasGameManager.getGameState(room)
                : gameManager.getFullGameState(room)
        : null;
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

      const gameType = room.settings.gameType || 'bateprimeiro';
      if (gameType === 'bate-o-tempo') {
        const result = bateOTempoGameManager.prepareRoom(room);
        if (!result.success) {
          return callback?.({ success: false, error: { code: result.error, message: `Tempos-alvo insuficientes. Disponivel: ${result.available}.` } });
        }

        gameManager.resetScores(room);
        room.roundHistory = [];

        io.to(`room:${room.code}`).emit('game:countdown', { count: 3 });
        room.status = 'countdown';
        room.lastActivityAt = Date.now();
        io.to(`room:${room.code}`).emit('room:updated', roomManager.getRoomState(room));
        io.emit('rooms:updated', roomManager.getPublicRoomList());
        callback?.({ success: true });

        setTimeout(() => {
          bateOTempoGameManager.start(room, {
            emitRoom: (event, payload) => io.to(`room:${room.code}`).emit(event, payload),
            emitPlayer: (targetPlayer, event, payload) => {
              if (targetPlayer.socketId) io.to(targetPlayer.socketId).emit(event, payload);
            },
            emitRoomsUpdated: () => io.emit('rooms:updated', roomManager.getPublicRoomList()),
          });
        }, 3000);
        return;
      }

      if (gameType === 'quem-chega-mais-perto') {
        const result = quemChegaMaisPertoGameManager.prepareRoom(room);
        if (!result.success) {
          return callback?.({ success: false, error: { code: result.error, message: `Perguntas numericas insuficientes. Disponivel: ${result.available}.` } });
        }

        gameManager.resetScores(room);
        room.roundHistory = [];

        io.to(`room:${room.code}`).emit('game:countdown', { count: 3 });
        room.status = 'countdown';
        room.lastActivityAt = Date.now();
        io.to(`room:${room.code}`).emit('room:updated', roomManager.getRoomState(room));
        io.emit('rooms:updated', roomManager.getPublicRoomList());
        callback?.({ success: true });

        setTimeout(() => {
          quemChegaMaisPertoGameManager.start(room, {
            emitRoom: (event, payload) => io.to(`room:${room.code}`).emit(event, payload),
            emitRoomsUpdated: () => io.emit('rooms:updated', roomManager.getPublicRoomList()),
          });
        }, 3000);
        return;
      }

      if (gameType === 'qual-e-a-palavra') {
        const result = qualEAPalavraGameManager.prepareRoom(room);
        if (!result.success) {
          return callback?.({ success: false, error: { code: result.error, message: `Palavras insuficientes. Disponivel: ${result.available}.` } });
        }

        gameManager.resetScores(room);
        room.roundHistory = [];

        io.to(`room:${room.code}`).emit('game:countdown', { count: 3 });
        room.status = 'countdown';
        room.lastActivityAt = Date.now();
        io.to(`room:${room.code}`).emit('room:updated', roomManager.getRoomState(room));
        io.emit('rooms:updated', roomManager.getPublicRoomList());
        callback?.({ success: true });

        setTimeout(() => {
          qualEAPalavraGameManager.start(room, {
            emitRoom: (event, payload) => io.to(`room:${room.code}`).emit(event, payload),
            emitPlayer: (targetPlayer, event, payload) => {
              if (targetPlayer.socketId) io.to(targetPlayer.socketId).emit(event, payload);
            },
            emitRoomsUpdated: () => io.emit('rooms:updated', roomManager.getPublicRoomList()),
          });
        }, 3000);
        return;
      }

      if (gameType === 'tres-letras') {
        const result = tresLetrasGameManager.prepareRoom(room);
        if (!result.success) {
          return callback?.({ success: false, error: { code: result.error, message: `Combinacoes insuficientes. Disponivel: ${result.available}.` } });
        }

        gameManager.resetScores(room);
        room.roundHistory = [];

        io.to(`room:${room.code}`).emit('game:countdown', { count: 3 });
        room.status = 'countdown';
        room.lastActivityAt = Date.now();
        io.to(`room:${room.code}`).emit('room:updated', roomManager.getRoomState(room));
        io.emit('rooms:updated', roomManager.getPublicRoomList());
        callback?.({ success: true });

        setTimeout(() => {
          tresLetrasGameManager.start(room, {
            emitRoom: (event, payload) => io.to(`room:${room.code}`).emit(event, payload),
            emitRoomsUpdated: () => io.emit('rooms:updated', roomManager.getPublicRoomList()),
          });
        }, 3000);
        return;
      }

      if (gameType !== 'bateprimeiro') {
        const game = GAME_REGISTRY[gameType];
        const payload = {
          gameType,
          title: game.title,
          message: `${game.title} ainda esta em desenvolvimento.`,
        };
        io.to(`room:${room.code}`).emit('game:coming-soon', payload);
        callback?.({ success: true, comingSoon: true });
        return;
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
          openBuzzer(room);
        }, 2000);
      }, 3000);
    } catch (err) {
      console.error('[game:start] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('buzzer:press', (data, callback) => {
    if (!checkSocketAndIpRateLimit(socket, 'game-actions', 5, 2000, 120, 10000)) {
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

  socket.on('guess:submit', (data, callback) => {
    if (!checkSocketAndIpRateLimit(socket, 'game-actions', 10, 5000, 120, 10000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisicoes.' } });
    }
    try {
      const { roomCode } = data || {};
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala nao encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Voce nao esta nesta sala.' } });

      const result = quemChegaMaisPertoGameManager.submitGuess(room, player, data || {});
      callback?.(result);
    } catch (err) {
      console.error('[guess:submit] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('word:attempt', (data, callback) => {
    if (!checkSocketAndIpRateLimit(socket, 'game-actions', 20, 5000, 120, 10000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisicoes.' } });
    }
    try {
      const { roomCode } = data || {};
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala nao encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Voce nao esta nesta sala.' } });

      const result = qualEAPalavraGameManager.submitAttempt(room, player, data || {});
      callback?.(result);
    } catch (err) {
      console.error('[word:attempt] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('timer:start', (data, callback) => {
    if (!checkSocketAndIpRateLimit(socket, 'game-actions', 20, 5000, 120, 10000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisicoes.' } });
    }
    try {
      const { roomCode } = data || {};
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala nao encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Voce nao esta nesta sala.' } });

      const result = bateOTempoGameManager.startTimer(room, player);
      callback?.(result);
    } catch (err) {
      console.error('[timer:start] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('timer:stop', (data, callback) => {
    if (!checkSocketAndIpRateLimit(socket, 'game-actions', 20, 5000, 120, 10000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisicoes.' } });
    }
    try {
      const { roomCode } = data || {};
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala nao encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Voce nao esta nesta sala.' } });

      const result = bateOTempoGameManager.stopTimer(room, player);
      callback?.(result);
    } catch (err) {
      console.error('[timer:stop] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('vote:submit', (data, callback) => {
    if (!checkSocketAndIpRateLimit(socket, 'game-actions', 40, 5000, 120, 10000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisicoes.' } });
    }
    try {
      const { roomCode } = data || {};
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala nao encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Voce nao esta nesta sala.' } });

      const result = tresLetrasGameManager.submitVote(room, player, data || {});
      callback?.(result);
    } catch (err) {
      console.error('[vote:submit] error:', err);
      callback?.({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' } });
    }
  });

  socket.on('answer:submit', (data, callback) => {
    if (!checkSocketAndIpRateLimit(socket, 'game-actions', 5, 5000, 120, 10000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { roomCode, questionId, selectedAlternative } = data;
      const room = roomManager.getRoom(roomCode?.toUpperCase());
      if (!room) return callback?.({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Sala não encontrada.' } });
      const player = findPlayerBySocket(room, socket.id);
      if (!player) return callback?.({ success: false, error: { code: 'NOT_IN_ROOM', message: 'Você não está nesta sala.' } });
      if (room.settings.gameType === 'tres-letras') {
        const result = tresLetrasGameManager.submitAnswer(room, player, data || {});
        return callback?.(result);
      }
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
    if (!checkSocketAndIpRateLimit(socket, 'game-actions', 5, 5000, 120, 10000)) {
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
    if (!checkSocketAndIpRateLimit(socket, 'content:create', 3, 10000, 20, 60000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisições.' } });
    }
    try {
      const { quizDescription, questions } = data;
      const quizTitle = data.quizTitle || data.quizName;
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

  socket.on('content:create', (data, callback) => {
    if (!checkSocketAndIpRateLimit(socket, 'content:create', 3, 10000, 20, 60000)) {
      return callback?.({ success: false, error: { code: 'RATE_LIMIT', message: 'Muitas requisicoes.' } });
    }
    try {
      const { gameType, title, items } = data || {};
      if (gameType !== 'qual-e-a-palavra' && gameType !== 'quem-chega-mais-perto' && gameType !== 'tres-letras') {
        return callback?.({ success: false, error: { code: 'INVALID_GAME_TYPE', message: 'Jogo nao aceita conteudo personalizado.' } });
      }
      if (!title || typeof title !== 'string' || title.trim().length < 3) {
        return callback?.({ success: false, error: { code: 'INVALID_TITLE', message: 'Nome deve ter pelo menos 3 caracteres.' } });
      }
      if (!Array.isArray(items) || items.length < 5) {
        return callback?.({ success: false, error: { code: 'NOT_ENOUGH_ITEMS', message: 'Adicione pelo menos 5 itens.' } });
      }
      if (items.length > 100) {
        return callback?.({ success: false, error: { code: 'TOO_MANY_ITEMS', message: 'Maximo 100 itens.' } });
      }

      const contentId = crypto.randomUUID();
      const formattedQuestions: Question[] = items.map((item: any, idx: number) => {
        if (gameType === 'tres-letras') {
          const letters = normalizeTresLetrasCombination(String(item.combination || item.text || ''));
          return {
            id: `custom-content-${contentId}-${idx}`,
            text: letters.join(''),
            answerType: 'written',
            category: 'Personalizado',
            difficulty: 'mixed',
            correctAnswer: letters.join(''),
            acceptedAnswers: [letters.join('')],
            strictness: 'exact',
            timeLimitSeconds: 30,
          };
        }

        if (gameType === 'qual-e-a-palavra') {
          const word = String(item.word || item.text || '').trim().slice(0, 80);
          return {
            id: `custom-content-${contentId}-${idx}`,
            text: word,
            answerType: 'written',
            category: String(item.category || 'Personalizado').trim().slice(0, 40),
            difficulty: 'medium',
            correctAnswer: word,
            acceptedAnswers: [word],
            strictness: 'normalized',
            timeLimitSeconds: 30,
          };
        }

        const answerNumber = Number(item.answer);
        return {
          id: `custom-content-${contentId}-${idx}`,
          text: String(item.question || item.text || '').trim().slice(0, 500),
          answerType: 'written',
          category: String(item.category || 'Personalizado').trim().slice(0, 40),
          difficulty: 'medium',
          correctAnswer: Number.isFinite(answerNumber) ? String(answerNumber) : '',
          acceptedAnswers: Number.isFinite(answerNumber) ? [String(answerNumber)] : [],
          strictness: 'exact',
          timeLimitSeconds: 30,
        };
      });

      if (gameType === 'tres-letras') {
        const normalizedCombinations = formattedQuestions.map((question) => normalizeTresLetrasCombination(question.correctAnswer || '').join(''));
        if (formattedQuestions.some((question) => !isValidTresLetrasCombination(normalizeTresLetrasCombination(question.correctAnswer || '')))) {
          return callback?.({ success: false, error: { code: 'INVALID_ITEMS', message: 'Cada combinacao precisa ter exatamente 3 letras validas, sem repeticao.' } });
        }
        if (new Set(normalizedCombinations).size !== normalizedCombinations.length) {
          return callback?.({ success: false, error: { code: 'DUPLICATED_ITEMS', message: 'Remova combinacoes repetidas.' } });
        }
      }

      if (formattedQuestions.some((question) => !question.text || !question.correctAnswer)) {
        return callback?.({ success: false, error: { code: 'INVALID_ITEMS', message: 'Preencha todos os itens corretamente.' } });
      }

      const contentType = gameType === 'qual-e-a-palavra'
        ? 'word-list'
        : gameType === 'tres-letras'
          ? 'letter-combinations'
          : 'numeric-questions';
      const contentTitle = title.trim().slice(0, 60);
      roomManager.saveCustomQuiz({
        id: contentId,
        title: contentTitle,
        description: '',
        gameType,
        contentType,
        questions: formattedQuestions,
        createdAt: Date.now(),
      });

      callback?.({ success: true, contentId, title: contentTitle, itemCount: formattedQuestions.length });
      console.log(`[content:create] ${contentId} - "${contentTitle}" (${gameType}, ${formattedQuestions.length} items)`);
    } catch (err) {
      console.error('[content:create] error:', err);
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

      clearBuzzerTimer(room);
      clearAnswerTimer(room);
      room.status = 'lobby';
      room.selectedQuestions = [];
      room.currentQuestionIndex = 0;
      room.currentBuzzerWinnerId = null;
      room.currentTeamId = null;
      room.blockedPlayerIds = new Set();
      room.roundHistory = [];
      room.roundStartedAt = null;
      room.roundAttemptId = (room.roundAttemptId || 0) + 1;
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

  function clearBuzzerTimer(room: GameRoom): void {
    if (room.buzzerTimer) {
      clearTimeout(room.buzzerTimer);
      room.buzzerTimer = null;
    }
  }

  function openBuzzer(room: GameRoom, eligiblePlayerIds?: string[]): void {
    clearBuzzerTimer(room);
    room.roundAttemptId = (room.roundAttemptId || 0) + 1;
    const roundAttemptId = room.roundAttemptId;

    room.status = 'buzzer-open';
    room.currentBuzzerWinnerId = null;
    room.roundStartedAt = Date.now();
    io.to(`room:${room.code}`).emit('game:state', gameManager.getFullGameState(room));
    io.to(`room:${room.code}`).emit('buzzer:opened', { roundStartedAt: room.roundStartedAt, eligiblePlayerIds });

    const question = room.selectedQuestions[room.currentQuestionIndex];
    const buzzerTimeoutMs = Math.min((question?.timeLimitSeconds || 15) * 1000, 15000);
    room.buzzerTimer = setTimeout(() => {
      handleBuzzerTimeout(room, roundAttemptId);
    }, buzzerTimeoutMs);
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
    clearBuzzerTimer(room);
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
    clearBuzzerTimer(room);
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
      openBuzzer(room, eligible.map(p => p.id));
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

  function handleBuzzerTimeout(room: GameRoom, roundAttemptId?: number): void {
    if (roundAttemptId !== undefined && room.roundAttemptId !== roundAttemptId) return;
    if (room.status !== 'buzzer-open') return;
    if (room.currentBuzzerWinnerId !== null) return;
    clearBuzzerTimer(room);
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
    clearBuzzerTimer(room);
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
        openBuzzer(room);
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
