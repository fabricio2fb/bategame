export type RoomStatus =
  | 'lobby'
  | 'countdown'
  | 'question-visible'
  | 'buzzer-open'
  | 'player-selected'
  | 'answering'
  | 'answer-selected'
  | 'revealing'
  | 'correct'
  | 'wrong'
  | 'buzzer-reopening'
  | 'round-finished'
  | 'scoreboard'
  | 'game-finished';

export type GameMode = 'classic' | 'teams' | 'couch';
export type QuestionSource = 'official' | 'custom';
export type AnswerType = 'multiple-choice' | 'written' | 'spoken';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type RoomPrivacy = 'public' | 'private';

export interface PlayerData {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  joinedAt: number;
  teamId?: string;
  couchControl?: string;
  couchKeyLabel?: string;
}

export interface Team {
  id: string;
  name: string;
  score: number;
  color: string;
  playerIds: string[];
  activePlayerId?: string;
}

export interface RoomSettings {
  gameMode: GameMode;
  questionSource: QuestionSource;
  answerMode: AnswerType | 'mixed';
  questionCount: number;
  difficulty: Difficulty;
  categories: string[];
  maxPlayers: number;
  answerTimeSeconds: number;
  privacy: RoomPrivacy;
  wrongAnswerPenalty: number;
  allowRebound: boolean;
  teamTurnMode?: 'rotation' | 'free';
  customQuizId?: string;
  teamCount?: number;
}

export interface QuestionData {
  id: string;
  text: string;
  question?: string;
  answerType: AnswerType;
  category?: string;
  subcategory?: string;
  difficulty?: Difficulty;
  alternatives?: string[];
  timeLimitSeconds: number;
}

export interface RoundEvent {
  type: string;
  playerId?: string;
  playerName?: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface RoomState {
  code: string;
  name: string;
  hostPlayerId: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: PlayerData[];
  currentQuestionIndex: number;
  totalQuestions: number;
  currentBuzzerWinnerId: string | null;
  currentTeamId?: string | null;
  blockedPlayerIds: string[];
  roundHistory: RoundEvent[];
  currentQuestion: QuestionData | null;
  orderedAlternatives: string[] | null;
  teams: Team[];
}

export interface GameState {
  status: RoomStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: QuestionData | null;
  orderedAlternatives: string[] | null;
  currentBuzzerWinnerId: string | null;
  currentTeamId?: string | null;
  blockedPlayerIds: string[];
  scores: Array<{ playerId: string; name: string; score: number }>;
  teamScores: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
  roundStartedAt: number | null;
  answerDeadlineAt?: number | null;
  roundHistory: RoundEvent[];
  teams: Team[];
}

export interface PublicRoom {
  code: string;
  name: string;
  hostName: string;
  status: RoomStatus;
  settings: RoomSettings;
  playerCount: number;
  createdAt: number;
}

const SESSION_PREFIX = 'bateu_';

export function saveSessionData(data: { roomCode: string; playerId: string; playerToken: string }): void {
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}roomCode`, data.roomCode);
    sessionStorage.setItem(`${SESSION_PREFIX}playerId`, data.playerId);
    sessionStorage.setItem(`${SESSION_PREFIX}playerToken`, data.playerToken);
  } catch {}
}

export function getSessionData(): { roomCode: string; playerId: string; playerToken: string } | null {
  try {
    const roomCode = sessionStorage.getItem(`${SESSION_PREFIX}roomCode`);
    const playerId = sessionStorage.getItem(`${SESSION_PREFIX}playerId`);
    const playerToken = sessionStorage.getItem(`${SESSION_PREFIX}playerToken`);
    if (roomCode && playerId && playerToken) return { roomCode, playerId, playerToken };
    return null;
  } catch {
    return null;
  }
}

export function clearSessionData(): void {
  try {
    sessionStorage.removeItem(`${SESSION_PREFIX}roomCode`);
    sessionStorage.removeItem(`${SESSION_PREFIX}playerId`);
    sessionStorage.removeItem(`${SESSION_PREFIX}playerToken`);
  } catch {}
}
