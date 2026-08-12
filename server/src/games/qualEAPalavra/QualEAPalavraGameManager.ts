import { GameRoom, Player, Team } from '../../types';
import { normalizeWord, shuffleWordLetters, wordQuestionManager } from './WordQuestionManager';
import { WordQuestion } from './words';

type EmitRoom = (event: string, payload: unknown) => void;
type EmitPlayer = (player: Player, event: string, payload: unknown) => void;
type EmitRoomsUpdated = () => void;

interface RuntimeHooks {
  emitRoom: EmitRoom;
  emitPlayer: EmitPlayer;
  emitRoomsUpdated?: EmitRoomsUpdated;
}

interface WordAttempt {
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  attempt: string;
  correct: boolean;
  submittedAt: number;
}

interface WordRoomRuntime {
  words: WordQuestion[];
  scrambledByWordId: Map<string, string>;
  attemptsByPlayerId: Map<string, WordAttempt[]>;
  solvedByPlayerId: string | null;
  solvedByTeamId: string | null;
  revealTimer: ReturnType<typeof setTimeout> | null;
  hooks: RuntimeHooks;
}

export class QualEAPalavraGameManager {
  private runtimes = new Map<string, WordRoomRuntime>();

  prepareRoom(room: GameRoom): { success: true } | { success: false; error: string; available: number } {
    const result = wordQuestionManager.selectForRoom(room, room.usedQuestionIds);
    if (!result.success) {
      return { success: false, error: result.error, available: result.available };
    }

    this.cleanup(room.code);
    room.currentQuestionIndex = 0;
    room.roundHistory = [];
    room.blockedPlayerIds = new Set();
    room.answeredPlayerIds = new Set();
    room.roundStartedAt = null;
    room.answerDeadlineAt = null;
    room.roundDeadlineAt = null;
    room.currentBuzzerWinnerId = null;
    room.currentTeamId = null;

    for (const word of result.words) {
      room.usedQuestionIds.add(word.id);
    }

    this.runtimes.set(room.code, {
      words: result.words,
      scrambledByWordId: new Map(result.words.map((word) => [word.id, shuffleWordLetters(word.word)])),
      attemptsByPlayerId: new Map(),
      solvedByPlayerId: null,
      solvedByTeamId: null,
      revealTimer: null,
      hooks: { emitRoom: () => undefined, emitPlayer: () => undefined },
    });

    return { success: true };
  }

  start(room: GameRoom, hooks: RuntimeHooks): void {
    const runtime = this.requireRuntime(room);
    runtime.hooks = hooks;
    this.startRound(room);
  }

  submitAttempt(room: GameRoom, player: Player, data: { wordId?: string; attempt?: unknown }): {
    success: true;
    correct: boolean;
  } | {
    success: false;
    error: { code: string; message: string };
  } {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) {
      return { success: false, error: { code: 'GAME_NOT_STARTED', message: 'Partida nao iniciada.' } };
    }
    if (room.settings.gameType !== 'qual-e-a-palavra') {
      return { success: false, error: { code: 'INVALID_GAME_TYPE', message: 'Evento invalido para este jogo.' } };
    }
    if (room.status !== 'word-visible' && room.status !== 'answering') {
      return { success: false, error: { code: 'ROUND_NOT_OPEN', message: 'A rodada nao esta recebendo tentativas.' } };
    }
    if (!room.roundDeadlineAt || Date.now() > room.roundDeadlineAt) {
      this.revealRound(room, 'timeout');
      return { success: false, error: { code: 'TIME_EXPIRED', message: 'Tempo esgotado.' } };
    }
    if (runtime.solvedByPlayerId) {
      return { success: false, error: { code: 'ROUND_ALREADY_SOLVED', message: 'A palavra ja foi descoberta.' } };
    }

    const currentWord = this.getCurrentWord(room);
    if (!currentWord || data.wordId !== currentWord.id) {
      return { success: false, error: { code: 'WRONG_WORD', message: 'Palavra invalida.' } };
    }

    const attempt = normalizeWord(String(data.attempt || ''));
    if (!attempt) {
      return { success: false, error: { code: 'INVALID_ATTEMPT', message: 'Monte uma palavra antes de enviar.' } };
    }

    const team = player.teamId ? room.teams.find((entry) => entry.id === player.teamId) : undefined;
    const correct = attempt === normalizeWord(currentWord.word);
    const entry: WordAttempt = {
      playerId: player.id,
      playerName: player.name,
      teamId: player.teamId,
      teamName: team?.name,
      attempt,
      correct,
      submittedAt: Date.now(),
    };
    const attempts = runtime.attemptsByPlayerId.get(player.id) || [];
    attempts.push(entry);
    runtime.attemptsByPlayerId.set(player.id, attempts);
    room.lastActivityAt = Date.now();
    room.roundHistory.push({
      type: correct ? 'word-attempt-correct' : 'word-attempt-wrong',
      playerId: player.id,
      playerName: player.name,
      timestamp: Date.now(),
    });

    runtime.hooks.emitPlayer(player, 'word:attempt-result', {
      roomCode: room.code,
      wordId: currentWord.id,
      correct,
      attempt,
    });

    if (!correct) {
      return { success: true, correct: false };
    }

    runtime.solvedByPlayerId = player.id;
    runtime.solvedByTeamId = player.teamId || null;
    room.answeredPlayerIds.add(player.id);
    this.applyScore(room, player);
    this.solveRound(room, player, currentWord);
    return { success: true, correct: true };
  }

  getGameState(room: GameRoom): Record<string, unknown> | null {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return null;
    const word = this.getCurrentWord(room);
    return {
      status: room.status,
      gameType: 'qual-e-a-palavra',
      currentQuestionIndex: room.currentQuestionIndex,
      totalRounds: runtime.words.length,
      currentWord: word ? this.sanitizeWord(word, runtime.scrambledByWordId.get(word.id) || '') : null,
      roundStartedAt: room.roundStartedAt,
      roundDeadlineAt: room.roundDeadlineAt ?? null,
      solvedByPlayerId: runtime.solvedByPlayerId,
      solvedByTeamId: runtime.solvedByTeamId,
      submittedPlayerIds: Array.from(runtime.attemptsByPlayerId.keys()),
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
      teams: room.teams,
      roundHistory: room.roundHistory.slice(-20),
    };
  }

  cleanup(roomCode: string): void {
    const runtime = this.runtimes.get(roomCode);
    if (runtime?.revealTimer) clearTimeout(runtime.revealTimer);
    this.runtimes.delete(roomCode);
  }

  private startRound(room: GameRoom): void {
    const runtime = this.requireRuntime(room);
    const word = this.getCurrentWord(room);
    if (!word) {
      this.finishGame(room);
      return;
    }

    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }
    if (runtime.revealTimer) {
      clearTimeout(runtime.revealTimer);
      runtime.revealTimer = null;
    }

    runtime.attemptsByPlayerId = new Map();
    runtime.solvedByPlayerId = null;
    runtime.solvedByTeamId = null;
    room.answeredPlayerIds = new Set();
    room.blockedPlayerIds = new Set();
    room.status = 'word-visible';
    room.roundStartedAt = Date.now();
    room.roundDeadlineAt = room.roundStartedAt + (room.settings.roundTimeSeconds || 30) * 1000;
    room.answerDeadlineAt = room.roundDeadlineAt;
    room.lastActivityAt = Date.now();
    room.roundHistory.push({
      type: 'word-visible',
      timestamp: Date.now(),
      data: { wordId: word.id, roundIndex: room.currentQuestionIndex },
    });

    const payload = {
      roomCode: room.code,
      word: this.sanitizeWord(word, runtime.scrambledByWordId.get(word.id) || ''),
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.words.length,
      roundDeadlineAt: room.roundDeadlineAt,
      submittedPlayerIds: [],
    };

    if (room.currentQuestionIndex === 0) {
      runtime.hooks.emitRoom('game:started', { gameState: this.getGameState(room) });
    } else {
      runtime.hooks.emitRoom('game:state', this.getGameState(room));
    }
    runtime.hooks.emitRoom('word:scrambled', payload);

    setTimeout(() => {
      if (room.status !== 'word-visible') return;
      room.status = 'answering';
      runtime.hooks.emitRoom('game:state', this.getGameState(room));
    }, 250);

    room.answerTimer = setTimeout(() => {
      this.revealRound(room, 'timeout');
    }, Math.max(0, room.roundDeadlineAt - Date.now()));
  }

  private solveRound(room: GameRoom, player: Player, word: WordQuestion): void {
    const runtime = this.requireRuntime(room);
    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }

    room.status = 'round-reveal';
    room.roundDeadlineAt = null;
    room.answerDeadlineAt = null;
    room.lastActivityAt = Date.now();

    const team = player.teamId ? room.teams.find((entry) => entry.id === player.teamId) : undefined;
    const payload = {
      roomCode: room.code,
      wordId: word.id,
      correctWord: word.word,
      category: word.category,
      difficulty: word.difficulty,
      hint: word.hint,
      winnerPlayerId: player.id,
      winnerPlayerName: player.name,
      winnerTeamId: player.teamId,
      winnerTeamName: team?.name,
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.words.length,
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
    };

    runtime.hooks.emitRoom('word:solved', payload);
    runtime.hooks.emitRoom('round:reveal', { ...payload, reason: 'solved' });
    runtime.hooks.emitRoom('score:updated', {
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
    });

    runtime.revealTimer = setTimeout(() => this.advanceAfterReveal(room), 4000);
  }

  private revealRound(room: GameRoom, reason: 'timeout'): void {
    const runtime = this.runtimes.get(room.code);
    if (!runtime || room.status === 'round-reveal' || room.status === 'round-finished' || room.status === 'game-finished') return;

    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }

    const word = this.getCurrentWord(room);
    if (!word) {
      this.finishGame(room);
      return;
    }

    room.status = 'round-reveal';
    room.roundDeadlineAt = null;
    room.answerDeadlineAt = null;
    room.lastActivityAt = Date.now();
    room.roundHistory.push({
      type: 'word-round-reveal',
      timestamp: Date.now(),
      data: { wordId: word.id, reason },
    });

    runtime.hooks.emitRoom('round:reveal', {
      roomCode: room.code,
      wordId: word.id,
      correctWord: word.word,
      category: word.category,
      difficulty: word.difficulty,
      hint: word.hint,
      reason,
      winnerPlayerId: null,
      winnerPlayerName: null,
      winnerTeamId: null,
      winnerTeamName: null,
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.words.length,
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
    });

    runtime.revealTimer = setTimeout(() => this.advanceAfterReveal(room), 4000);
  }

  private advanceAfterReveal(room: GameRoom): void {
    const runtime = this.runtimes.get(room.code);
    if (!runtime || room.status === 'game-finished') return;

    room.status = 'round-finished';
    room.lastActivityAt = Date.now();
    runtime.hooks.emitRoom('game:state', this.getGameState(room));

    if (room.currentQuestionIndex >= runtime.words.length - 1) {
      this.finishGame(room);
      return;
    }

    room.currentQuestionIndex += 1;
    room.status = 'scoreboard';
    room.lastActivityAt = Date.now();
    runtime.hooks.emitRoom('game:state', this.getGameState(room));

    runtime.revealTimer = setTimeout(() => {
      this.startRound(room);
    }, 2000);
  }

  private finishGame(room: GameRoom): void {
    const runtime = this.runtimes.get(room.code);
    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }
    if (runtime?.revealTimer) {
      clearTimeout(runtime.revealTimer);
      runtime.revealTimer = null;
    }

    room.status = 'game-finished';
    room.roundDeadlineAt = null;
    room.answerDeadlineAt = null;
    room.lastActivityAt = Date.now();

    const payload = {
      gameType: 'qual-e-a-palavra',
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
    };

    runtime?.hooks.emitRoom('game:finished', payload);
    runtime?.hooks.emitRoom('game:state', this.getGameState(room));
    runtime?.hooks.emitRoomsUpdated?.();
  }

  private applyScore(room: GameRoom, player: Player): void {
    if (room.settings.gameMode === 'teams' && player.teamId) {
      const team = room.teams.find((entry) => entry.id === player.teamId);
      if (team) team.score += 1;
      return;
    }

    player.score += 1;
  }

  private getCurrentWord(room: GameRoom): WordQuestion | null {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return null;
    return runtime.words[room.currentQuestionIndex] || null;
  }

  private getScores(room: GameRoom): Array<{ playerId: string; name: string; avatarUrl?: string; score: number }> {
    return Array.from(room.players.values())
      .map((player) => ({ playerId: player.id, name: player.name, avatarUrl: player.avatarUrl, score: player.score }))
      .sort((a, b) => b.score - a.score);
  }

  private getTeamScores(room: GameRoom): Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }> {
    return room.teams
      .map((team: Team) => ({
        teamId: team.id,
        name: team.name,
        color: team.color,
        score: team.score,
        activePlayerId: team.activePlayerId,
      }))
      .sort((a, b) => b.score - a.score);
  }

  private sanitizeWord(word: WordQuestion, scrambled: string): Record<string, unknown> {
    return {
      id: word.id,
      scrambledWord: scrambled,
      letters: scrambled.split(''),
      category: word.category,
      difficulty: word.difficulty,
      length: normalizeWord(word.word).length,
    };
  }

  private requireRuntime(room: GameRoom): WordRoomRuntime {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) {
      throw new Error(`QualEAPalavra runtime missing for room ${room.code}`);
    }
    return runtime;
  }
}

export const qualEAPalavraGameManager = new QualEAPalavraGameManager();
