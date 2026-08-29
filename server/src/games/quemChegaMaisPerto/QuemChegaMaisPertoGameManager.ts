import { GameRoom, Player, Team } from '../../types';
import { numericQuestionManager } from './NumericQuestionManager';
import { NumericQuestion } from './questions';
import { calculateNumericRoundScore, NumericGuessEntry, NumericRoundScoreResult } from './scoring';

type EmitRoom = (event: string, payload: unknown) => void;
type EmitRoomsUpdated = () => void;

interface RuntimeHooks {
  emitRoom: EmitRoom;
  emitRoomsUpdated?: EmitRoomsUpdated;
}

interface NumericGuess {
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  guess: number;
  submittedAt: number;
}

interface NumericRoomRuntime {
  questions: NumericQuestion[];
  guessesByPlayerId: Map<string, NumericGuess>;
  revealTimer: ReturnType<typeof setTimeout> | null;
  hooks: RuntimeHooks;
}

export class QuemChegaMaisPertoGameManager {
  private runtimes = new Map<string, NumericRoomRuntime>();

  prepareRoom(room: GameRoom): { success: true } | { success: false; error: string; available: number } {
    const result = numericQuestionManager.selectForRoom(room, room.usedQuestionIds);
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

    for (const question of result.questions) {
      room.usedQuestionIds.add(question.id);
    }

    this.runtimes.set(room.code, {
      questions: result.questions,
      guessesByPlayerId: new Map(),
      revealTimer: null,
      hooks: { emitRoom: () => undefined },
    });

    return { success: true };
  }

  start(room: GameRoom, hooks: RuntimeHooks): void {
    const runtime = this.requireRuntime(room);
    runtime.hooks = hooks;
    this.startRound(room);
  }

  submitGuess(room: GameRoom, player: Player, data: { questionId?: string; guess?: unknown }): {
    success: true;
  } | {
    success: false;
    error: { code: string; message: string };
  } {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) {
      return { success: false, error: { code: 'GAME_NOT_STARTED', message: 'Partida nao iniciada.' } };
    }
    if (room.settings.gameType !== 'quem-chega-mais-perto') {
      return { success: false, error: { code: 'INVALID_GAME_TYPE', message: 'Evento invalido para este jogo.' } };
    }
    if (room.status !== 'answering') {
      return { success: false, error: { code: 'ROUND_NOT_OPEN', message: 'A rodada nao esta recebendo palpites.' } };
    }
    if (!room.roundDeadlineAt || Date.now() > room.roundDeadlineAt) {
      this.revealRound(room, 'timeout');
      return { success: false, error: { code: 'TIME_EXPIRED', message: 'Tempo esgotado.' } };
    }

    const currentQuestion = this.getCurrentQuestion(room);
    if (!currentQuestion || data.questionId !== currentQuestion.id) {
      return { success: false, error: { code: 'WRONG_QUESTION', message: 'Pergunta invalida.' } };
    }
    if (runtime.guessesByPlayerId.has(player.id)) {
      return { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Voce ja enviou seu palpite nesta rodada.' } };
    }

    const guess = Number(data.guess);
    if (!Number.isFinite(guess)) {
      return { success: false, error: { code: 'INVALID_GUESS', message: 'Envie um palpite numerico.' } };
    }

    const team = player.teamId ? room.teams.find((entry) => entry.id === player.teamId) : undefined;
    runtime.guessesByPlayerId.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      teamId: player.teamId,
      teamName: team?.name,
      guess,
      submittedAt: Date.now(),
    });
    room.answeredPlayerIds.add(player.id);
    room.lastActivityAt = Date.now();
    room.roundHistory.push({
      type: 'guess-submitted',
      playerId: player.id,
      playerName: player.name,
      timestamp: Date.now(),
    });

    runtime.hooks.emitRoom('guess:submitted', {
      roomCode: room.code,
      questionId: currentQuestion.id,
      playerId: player.id,
      playerName: player.name,
      submittedPlayerIds: Array.from(runtime.guessesByPlayerId.keys()),
      submittedCount: runtime.guessesByPlayerId.size,
      expectedCount: this.getExpectedPlayers(room).length,
    });

    if (this.didEveryoneSubmit(room)) {
      this.revealRound(room, 'all-submitted');
    }

    return { success: true };
  }

  getGameState(room: GameRoom): Record<string, unknown> | null {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return null;
    const question = this.getCurrentQuestion(room);
    return {
      status: room.status,
      gameType: 'quem-chega-mais-perto',
      currentQuestionIndex: room.currentQuestionIndex,
      totalRounds: runtime.questions.length,
      currentQuestion: question ? this.sanitizeNumericQuestion(question) : null,
      roundStartedAt: room.roundStartedAt,
      roundDeadlineAt: room.roundDeadlineAt ?? null,
      submittedPlayerIds: Array.from(runtime.guessesByPlayerId.keys()),
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
      teams: room.teams,
      roundHistory: room.roundHistory.slice(-20),
    };
  }

  cleanup(roomCode: string): void {
    const runtime = this.runtimes.get(roomCode);
    if (runtime?.revealTimer) {
      clearTimeout(runtime.revealTimer);
    }
    this.runtimes.delete(roomCode);
  }

  private startRound(room: GameRoom): void {
    const runtime = this.requireRuntime(room);
    const question = this.getCurrentQuestion(room);
    if (!question) {
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

    runtime.guessesByPlayerId = new Map();
    room.answeredPlayerIds = new Set();
    room.blockedPlayerIds = new Set();
    room.status = 'answering';
    room.roundStartedAt = Date.now();
    room.roundDeadlineAt = room.roundStartedAt + (room.settings.roundTimeSeconds || 30) * 1000;
    room.answerDeadlineAt = room.roundDeadlineAt;
    room.lastActivityAt = Date.now();
    room.roundHistory.push({
      type: 'numeric-question-visible',
      timestamp: Date.now(),
      data: { questionId: question.id, roundIndex: room.currentQuestionIndex },
    });

    const payload = {
      roomCode: room.code,
      question: this.sanitizeNumericQuestion(question),
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.questions.length,
      roundDeadlineAt: room.roundDeadlineAt,
      submittedPlayerIds: [],
    };

    if (room.currentQuestionIndex === 0) {
      runtime.hooks.emitRoom('game:started', { gameState: this.getGameState(room) });
    } else {
      runtime.hooks.emitRoom('game:state', this.getGameState(room));
    }
    runtime.hooks.emitRoom('question:numeric', payload);

    room.answerTimer = setTimeout(() => {
      this.revealRound(room, 'timeout');
    }, Math.max(0, room.roundDeadlineAt - Date.now()));
  }

  private revealRound(room: GameRoom, reason: 'timeout' | 'all-submitted'): void {
    const runtime = this.runtimes.get(room.code);
    if (!runtime || room.status === 'round-reveal' || room.status === 'round-finished' || room.status === 'game-finished') return;

    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }

    const question = this.getCurrentQuestion(room);
    if (!question) {
      this.finishGame(room);
      return;
    }

    room.status = 'round-reveal';
    room.roundDeadlineAt = null;
    room.answerDeadlineAt = null;
    room.lastActivityAt = Date.now();

    const scoreResult = calculateNumericRoundScore({
      correctValue: question.correctValue,
      guesses: this.buildScoreGuesses(room, runtime),
      scoreTarget: room.settings.gameMode === 'teams' ? 'team' : 'player',
    });

    this.applyScore(room, scoreResult);
    room.roundHistory.push({
      type: 'numeric-round-reveal',
      timestamp: Date.now(),
      data: {
        questionId: question.id,
        reason,
        winnerPlayerIds: scoreResult.winnerPlayerIds,
        winnerTeamIds: scoreResult.winnerTeamIds,
      },
    });

    const payload = {
      roomCode: room.code,
      questionId: question.id,
      correctValue: question.correctValue,
      explanation: question.explanation,
      reason,
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.questions.length,
      guesses: scoreResult.standings,
      playerGuesses: this.buildPlayerRevealGuesses(room, runtime, question.correctValue),
      missingPlayerIds: this.getExpectedPlayers(room)
        .filter((player) => !runtime.guessesByPlayerId.has(player.id))
        .map((player) => player.id),
      winnerPlayerIds: scoreResult.winnerPlayerIds,
      winnerTeamIds: scoreResult.winnerTeamIds,
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
    };

    runtime.hooks.emitRoom('round:reveal', payload);
    runtime.hooks.emitRoom('score:updated', {
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
    });

    runtime.revealTimer = setTimeout(() => {
      this.advanceAfterReveal(room);
    }, 2500);
  }

  private advanceAfterReveal(room: GameRoom): void {
    const runtime = this.runtimes.get(room.code);
    if (!runtime || room.status === 'game-finished') return;

    room.status = 'round-finished';
    room.lastActivityAt = Date.now();
    runtime.hooks.emitRoom('game:state', this.getGameState(room));

    if (room.currentQuestionIndex >= runtime.questions.length - 1) {
      this.finishGame(room);
      return;
    }

    room.currentQuestionIndex += 1;
    room.status = 'scoreboard';
    room.lastActivityAt = Date.now();
    runtime.hooks.emitRoom('game:state', this.getGameState(room));

    runtime.revealTimer = setTimeout(() => {
      this.startRound(room);
    }, 500);
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
      gameType: 'quem-chega-mais-perto',
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
    };

    runtime?.hooks.emitRoom('game:finished', payload);
    runtime?.hooks.emitRoom('game:state', this.getGameState(room));
    runtime?.hooks.emitRoomsUpdated?.();
  }

  private applyScore(room: GameRoom, result: NumericRoundScoreResult): void {
    if (!result.hasValidGuesses) return;

    if (result.scoreTarget === 'team') {
      for (const teamId of result.winnerTeamIds) {
        const team = room.teams.find((entry) => entry.id === teamId);
        if (team) team.score += 1;
      }
      return;
    }

    for (const playerId of result.winnerPlayerIds) {
      const player = room.players.get(playerId);
      if (player) player.score += 1;
    }
  }

  private buildScoreGuesses(room: GameRoom, runtime: NumericRoomRuntime): NumericGuessEntry[] {
    return Array.from(room.players.values())
      .filter((player) => player.isConnected)
      .map((player) => {
        const guess = runtime.guessesByPlayerId.get(player.id);
        const team = player.teamId ? room.teams.find((entry) => entry.id === player.teamId) : undefined;
        return {
          playerId: player.id,
          playerName: player.name,
          teamId: player.teamId,
          teamName: team?.name,
          guess: guess?.guess ?? null,
        };
      });
  }

  private buildPlayerRevealGuesses(room: GameRoom, runtime: NumericRoomRuntime, correctValue: number): Array<Record<string, unknown>> {
    return Array.from(room.players.values())
      .filter((player) => player.isConnected)
      .map((player) => {
        const guess = runtime.guessesByPlayerId.get(player.id);
        const team = player.teamId ? room.teams.find((entry) => entry.id === player.teamId) : undefined;
        return {
          playerId: player.id,
          playerName: player.name,
          teamId: player.teamId,
          teamName: team?.name,
          guess: guess?.guess ?? null,
          distance: guess ? Math.abs(guess.guess - correctValue) : null,
          submittedAt: guess?.submittedAt ?? null,
        };
      })
      .sort((a, b) => {
        const left = typeof a.distance === 'number' ? a.distance : Number.POSITIVE_INFINITY;
        const right = typeof b.distance === 'number' ? b.distance : Number.POSITIVE_INFINITY;
        return left - right;
      });
  }

  private didEveryoneSubmit(room: GameRoom): boolean {
    const runtime = this.requireRuntime(room);
    const expectedPlayers = this.getExpectedPlayers(room);
    return expectedPlayers.length > 0 && expectedPlayers.every((player) => runtime.guessesByPlayerId.has(player.id));
  }

  private getExpectedPlayers(room: GameRoom): Player[] {
    return Array.from(room.players.values()).filter((player) => {
      if (!player.isConnected) return false;
      if (room.settings.gameMode === 'teams' && !player.teamId) return false;
      return true;
    });
  }

  private getCurrentQuestion(room: GameRoom): NumericQuestion | null {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return null;
    return runtime.questions[room.currentQuestionIndex] || null;
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

  private sanitizeNumericQuestion(question: NumericQuestion): Record<string, unknown> {
    return {
      id: question.id,
      text: question.text,
      question: question.text,
      category: question.category,
      difficulty: question.difficulty,
    };
  }

  private requireRuntime(room: GameRoom): NumericRoomRuntime {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) {
      throw new Error(`QuemChegaMaisPerto runtime missing for room ${room.code}`);
    }
    return runtime;
  }
}

export const quemChegaMaisPertoGameManager = new QuemChegaMaisPertoGameManager();
