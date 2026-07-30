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
export type Strictness = 'exact' | 'normalized' | 'tolerant';

export interface Player {
  id: string;
  token: string;
  socketId: string | null;
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

export interface Question {
  id: string;
  text: string;
  answerType: AnswerType;
  category?: string;
  subcategory?: string;
  difficulty?: Difficulty;
  factKey?: string;
  alternatives?: string[];
  correctAlternativeIndex?: number;
  correctAnswer?: string;
  acceptedAnswers?: string[];
  strictness?: Strictness;
  timeLimitSeconds: number;
  explanation?: string;
}

export interface CustomQuiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  createdAt: number;
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

export interface RoundEvent {
  type: string;
  playerId?: string;
  playerName?: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface GameRoom {
  code: string;
  name: string;
  hostPlayerId: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: Map<string, Player>;
  teams: Team[];
  customQuiz?: CustomQuiz;
  selectedQuestions: Question[];
  currentQuestionIndex: number;
  currentBuzzerWinnerId: string | null;
  currentTeamId?: string | null;
  blockedPlayerIds: Set<string>;
  answeredPlayerIds: Set<string>;
  roundHistory: RoundEvent[];
  createdAt: number;
  lastActivityAt: number;
  roundStartedAt: number | null;
  buzzerPressedAt?: number | null;
  roundAttemptId?: number;
  buzzerTimer?: ReturnType<typeof setTimeout> | null;
  answerAttemptId?: number;
  answerDeadlineAt?: number | null;
  answerTimer?: ReturnType<typeof setTimeout> | null;
  sofaSelectedPlayerId?: string | null;
  teamRotationIndex?: number;
  usedQuestionIds: Set<string>;
  usedFactKeys: Set<string>;
  recentQuestionIds: string[];
  categoryUsageCount: Map<string, number>;
  difficultySequence: Difficulty[];
}

export interface RoomPublicData {
  code: string;
  name: string;
  hostName: string;
  status: RoomStatus;
  settings: RoomSettings;
  playerCount: number;
  createdAt: number;
}

export interface RoomState {
  code: string;
  name: string;
  hostPlayerId: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: Array<{
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
  }>;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentBuzzerWinnerId: string | null;
  currentTeamId?: string | null;
  blockedPlayerIds: string[];
  roundHistory: RoundEvent[];
  currentQuestion: Question | null;
  orderedAlternatives: string[] | null;
  teams: Team[];
  sofaSelectedPlayerId?: string | null;
}

export interface GameState {
  status: RoomStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: Question | null;
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

export interface PublicQuestion {
  id: string;
  text: string;
  question: string;
  answerType: AnswerType;
  category?: string;
  subcategory?: string;
  difficulty?: Difficulty;
  timeLimitSeconds: number;
}

export function sanitizeQuestion(q: Question): PublicQuestion {
  return {
    id: q.id,
    text: q.text,
    question: q.text,
    answerType: q.answerType,
    category: q.category,
    subcategory: q.subcategory,
    difficulty: q.difficulty,
    timeLimitSeconds: q.timeLimitSeconds,
  };
}
