import { GameRoom, Player, Team } from '../../types';
import { BateOTempoTimeEntry, calculateBateOTempoRoundScore, formatClockMs } from './scoring';

type EmitRoom = (event: string, payload: unknown) => void;
type EmitPlayer = (player: Player, event: string, payload: unknown) => void;
type EmitRoomsUpdated = () => void;

interface RuntimeHooks {
  emitRoom: EmitRoom;
  emitPlayer: EmitPlayer;
  emitRoomsUpdated?: EmitRoomsUpdated;
}

type TimerStatus = 'not-started' | 'running' | 'stopped' | 'timeout';

interface PlayerTimerState {
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  status: TimerStatus;
  startedAt: number | null;
  stoppedAt: number | null;
  elapsedMs: number | null;
}

interface BateOTempoRuntime {
  targetTimesMs: number[];
  timersByPlayerId: Map<string, PlayerTimerState>;
  revealTimer: ReturnType<typeof setTimeout> | null;
  hooks: RuntimeHooks;
}

const DEFAULT_ROUNDS = 8;
const DEFAULT_ROUND_LIMIT_SECONDS = 90;

export class BateOTempoGameManager {
  private runtimes = new Map<string, BateOTempoRuntime>();

  prepareRoom(room: GameRoom): { success: true } | { success: false; error: string; available: number } {
    const roundCount = Math.max(1, Math.min(20, room.settings.roundCount || DEFAULT_ROUNDS));
    const targetTimesMs = this.buildTargetTimesMs(room, roundCount);
    if (targetTimesMs.length < roundCount) {
      return { success: false, error: 'NOT_ENOUGH_TARGET_TIMES', available: targetTimesMs.length };
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

    this.runtimes.set(room.code, {
      targetTimesMs,
      timersByPlayerId: new Map(),
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

  startTimer(room: GameRoom, player: Player): { success: true } | { success: false; error: { code: string; message: string } } {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return { success: false, error: { code: 'GAME_NOT_STARTED', message: 'Partida nao iniciada.' } };
    if (room.settings.gameType !== 'bate-o-tempo') return { success: false, error: { code: 'INVALID_GAME_TYPE', message: 'Evento invalido para este jogo.' } };
    if (room.status !== 'target-visible' && room.status !== 'running') {
      return { success: false, error: { code: 'ROUND_NOT_OPEN', message: 'A rodada nao esta aberta.' } };
    }
    if (!room.roundDeadlineAt || Date.now() > room.roundDeadlineAt) {
      this.revealRound(room, 'timeout');
      return { success: false, error: { code: 'TIME_EXPIRED', message: 'Tempo esgotado.' } };
    }

    const timer = runtime.timersByPlayerId.get(player.id);
    if (!timer) return { success: false, error: { code: 'PLAYER_NOT_EXPECTED', message: 'Jogador nao participa desta rodada.' } };
    if (timer.status === 'running') return { success: false, error: { code: 'ALREADY_RUNNING', message: 'Seu cronometro ja esta rodando.' } };
    if (timer.status === 'stopped') return { success: false, error: { code: 'ALREADY_STOPPED', message: 'Voce ja parou nesta rodada.' } };

    timer.status = 'running';
    timer.startedAt = Date.now();
    room.status = 'running';
    room.lastActivityAt = Date.now();
    runtime.hooks.emitPlayer(player, 'timer:started-ack', {
      roomCode: room.code,
      roundIndex: room.currentQuestionIndex,
      startedAt: timer.startedAt,
    });
    runtime.hooks.emitRoom('player:timer-status', this.buildTimerStatusPayload(room, player, 'running'));
    runtime.hooks.emitRoom('game:state', this.getGameState(room));
    return { success: true };
  }

  stopTimer(room: GameRoom, player: Player): { success: true; elapsedMs: number; elapsedLabel: string } | { success: false; error: { code: string; message: string } } {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return { success: false, error: { code: 'GAME_NOT_STARTED', message: 'Partida nao iniciada.' } };
    if (room.settings.gameType !== 'bate-o-tempo') return { success: false, error: { code: 'INVALID_GAME_TYPE', message: 'Evento invalido para este jogo.' } };
    if (room.status !== 'running' && room.status !== 'target-visible') {
      return { success: false, error: { code: 'ROUND_NOT_OPEN', message: 'A rodada nao esta aberta.' } };
    }
    if (!room.roundDeadlineAt || Date.now() > room.roundDeadlineAt) {
      this.revealRound(room, 'timeout');
      return { success: false, error: { code: 'TIME_EXPIRED', message: 'Tempo esgotado.' } };
    }

    const timer = runtime.timersByPlayerId.get(player.id);
    if (!timer) return { success: false, error: { code: 'PLAYER_NOT_EXPECTED', message: 'Jogador nao participa desta rodada.' } };
    if (timer.status !== 'running' || !timer.startedAt) {
      return { success: false, error: { code: 'NOT_RUNNING', message: 'Inicie seu cronometro antes de parar.' } };
    }

    timer.status = 'stopped';
    timer.stoppedAt = Date.now();
    timer.elapsedMs = Math.max(0, timer.stoppedAt - timer.startedAt);
    room.answeredPlayerIds.add(player.id);
    room.lastActivityAt = Date.now();
    const personalPayload = {
      roomCode: room.code,
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      playerId: player.id,
      status: 'stopped' as const,
      elapsedMs: timer.elapsedMs,
      elapsedLabel: formatClockMs(timer.elapsedMs),
      stoppedAt: timer.stoppedAt,
    };
    runtime.hooks.emitPlayer(player, 'timer:stopped-result', personalPayload);
    runtime.hooks.emitRoom('player:timer-status', this.buildTimerStatusPayload(room, player, 'stopped'));
    runtime.hooks.emitRoom('game:state', this.getGameState(room));

    if (this.didEveryoneStop(room)) {
      this.revealRound(room, 'all-stopped');
    }

    return { success: true, elapsedMs: timer.elapsedMs, elapsedLabel: formatClockMs(timer.elapsedMs) };
  }

  getGameState(room: GameRoom): Record<string, unknown> | null {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return null;
    const targetMs = this.getCurrentTargetMs(room);
    return {
      status: room.status,
      gameType: 'bate-o-tempo',
      currentQuestionIndex: room.currentQuestionIndex,
      totalRounds: runtime.targetTimesMs.length,
      targetMs,
      targetLabel: formatClockMs(targetMs),
      roundStartedAt: room.roundStartedAt,
      roundDeadlineAt: room.roundDeadlineAt ?? null,
      timerStatuses: this.getPublicTimerStatuses(runtime),
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
    const targetMs = this.getCurrentTargetMs(room);
    if (!targetMs) {
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

    runtime.timersByPlayerId = new Map(
      this.getExpectedPlayers(room).map((player) => {
        const team = player.teamId ? room.teams.find((entry) => entry.id === player.teamId) : undefined;
        return [player.id, {
          playerId: player.id,
          playerName: player.name,
          teamId: player.teamId,
          teamName: team?.name,
          status: 'not-started' as TimerStatus,
          startedAt: null,
          stoppedAt: null,
          elapsedMs: null,
        }];
      })
    );

    room.answeredPlayerIds = new Set();
    room.blockedPlayerIds = new Set();
    room.status = 'target-visible';
    room.roundStartedAt = Date.now();
    const roundLimitSeconds = room.settings.roundTimeSeconds || DEFAULT_ROUND_LIMIT_SECONDS;
    room.roundDeadlineAt = room.roundStartedAt + roundLimitSeconds * 1000;
    room.answerDeadlineAt = room.roundDeadlineAt;
    room.lastActivityAt = Date.now();
    room.roundHistory.push({
      type: 'target-visible',
      timestamp: Date.now(),
      data: { roundIndex: room.currentQuestionIndex, targetMs },
    });

    if (room.currentQuestionIndex === 0) {
      runtime.hooks.emitRoom('game:started', { gameState: this.getGameState(room) });
    } else {
      runtime.hooks.emitRoom('game:state', this.getGameState(room));
    }
    runtime.hooks.emitRoom('round:target', {
      roomCode: room.code,
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.targetTimesMs.length,
      targetMs,
      targetLabel: formatClockMs(targetMs),
      roundDeadlineAt: room.roundDeadlineAt,
      timerStatuses: this.getPublicTimerStatuses(runtime),
    });

    room.answerTimer = setTimeout(() => {
      this.revealRound(room, 'timeout');
    }, Math.max(0, room.roundDeadlineAt - Date.now()));
  }

  private revealRound(room: GameRoom, reason: 'timeout' | 'all-stopped'): void {
    const runtime = this.runtimes.get(room.code);
    if (!runtime || room.status === 'round-reveal' || room.status === 'round-finished' || room.status === 'game-finished') return;

    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }

    const now = Date.now();
    for (const timer of runtime.timersByPlayerId.values()) {
      if (timer.status !== 'stopped') {
        timer.status = 'timeout';
        timer.stoppedAt = now;
        timer.elapsedMs = null;
        const player = room.players.get(timer.playerId);
        if (player) {
          runtime.hooks.emitPlayer(player, 'timer:stopped-result', {
            roomCode: room.code,
            roundIndex: room.currentQuestionIndex,
            roundNumber: room.currentQuestionIndex + 1,
            playerId: player.id,
            status: 'timeout' as const,
            elapsedMs: null,
            elapsedLabel: null,
            stoppedAt: now,
          });
        }
      }
    }

    const targetMs = this.getCurrentTargetMs(room);
    room.status = 'round-reveal';
    room.roundDeadlineAt = null;
    room.answerDeadlineAt = null;
    room.lastActivityAt = Date.now();

    const scoreResult = calculateBateOTempoRoundScore({
      targetMs,
      entries: this.buildScoreEntries(runtime),
      scoringMode: room.settings.scoringMode === 'exact' ? 'exact' : 'approximate',
      scoreTarget: room.settings.gameMode === 'teams' ? 'team' : 'player',
    });
    this.applyScore(room, scoreResult);
    room.roundHistory.push({
      type: 'bate-o-tempo-round-reveal',
      timestamp: Date.now(),
      data: { roundIndex: room.currentQuestionIndex, reason, winnerPlayerIds: scoreResult.winnerPlayerIds, winnerTeamIds: scoreResult.winnerTeamIds },
    });

    const payload = {
      roomCode: room.code,
      reason,
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.targetTimesMs.length,
      targetMs,
      targetLabel: formatClockMs(targetMs),
      scoringMode: room.settings.scoringMode || 'approximate',
      exactToleranceMs: 50,
      results: scoreResult.standings.map((entry) => ({
        ...entry,
        elapsedLabel: typeof entry.elapsedMs === 'number' ? formatClockMs(entry.elapsedMs) : null,
        distanceLabel: typeof entry.distanceMs === 'number' ? formatClockMs(entry.distanceMs) : null,
      })),
      winnerPlayerIds: scoreResult.winnerPlayerIds,
      winnerTeamIds: scoreResult.winnerTeamIds,
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
    };

    runtime.hooks.emitRoom('round:reveal', payload);
    runtime.hooks.emitRoom('score:updated', { scores: this.getScores(room), teamScores: this.getTeamScores(room) });

    runtime.revealTimer = setTimeout(() => this.advanceAfterReveal(room), 5000);
  }

  private advanceAfterReveal(room: GameRoom): void {
    const runtime = this.runtimes.get(room.code);
    if (!runtime || room.status === 'game-finished') return;

    room.status = 'round-finished';
    room.lastActivityAt = Date.now();
    runtime.hooks.emitRoom('game:state', this.getGameState(room));

    if (room.currentQuestionIndex >= runtime.targetTimesMs.length - 1) {
      this.finishGame(room);
      return;
    }

    room.currentQuestionIndex += 1;
    room.status = 'scoreboard';
    room.lastActivityAt = Date.now();
    runtime.hooks.emitRoom('game:state', this.getGameState(room));
    runtime.revealTimer = setTimeout(() => this.startRound(room), 2000);
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
    const payload = { gameType: 'bate-o-tempo', scores: this.getScores(room), teamScores: this.getTeamScores(room) };
    runtime?.hooks.emitRoom('game:finished', payload);
    runtime?.hooks.emitRoom('game:state', this.getGameState(room));
    runtime?.hooks.emitRoomsUpdated?.();
  }

  private buildTargetTimesMs(room: GameRoom, roundCount: number): number[] {
    if (room.settings.targetTimeMode === 'manual' && Array.isArray(room.settings.targetTimeRoundSeconds)) {
      return room.settings.targetTimeRoundSeconds
        .slice(0, roundCount)
        .map((seconds) => Math.round(seconds * 1000))
        .filter((ms) => Number.isFinite(ms) && ms > 0);
    }

    const minMs = Math.round((room.settings.targetTimeMinSeconds || 5) * 1000);
    const maxMs = Math.round((room.settings.targetTimeMaxSeconds || 30) * 1000);
    const low = Math.max(1000, Math.min(minMs, maxMs - 1));
    const high = Math.max(low + 1, maxMs);
    return Array.from({ length: roundCount }, () => low + Math.floor(Math.random() * (high - low + 1)));
  }

  private getCurrentTargetMs(room: GameRoom): number {
    const runtime = this.requireRuntime(room);
    return runtime.targetTimesMs[room.currentQuestionIndex] || 0;
  }

  private buildTimerStatusPayload(room: GameRoom, player: Player, status: TimerStatus): Record<string, unknown> {
    const runtime = this.requireRuntime(room);
    const timer = runtime.timersByPlayerId.get(player.id);
    return {
      roomCode: room.code,
      roundIndex: room.currentQuestionIndex,
      playerId: player.id,
      playerName: player.name,
      status,
      timerStatuses: this.getPublicTimerStatuses(runtime),
      submittedCount: Array.from(runtime.timersByPlayerId.values()).filter((entry) => entry.status === 'stopped').length,
      expectedCount: runtime.timersByPlayerId.size,
      startedAt: status === 'running' ? timer?.startedAt : undefined,
    };
  }

  private getPublicTimerStatuses(runtime: BateOTempoRuntime): Array<Record<string, unknown>> {
    return Array.from(runtime.timersByPlayerId.values()).map((timer) => ({
      playerId: timer.playerId,
      playerName: timer.playerName,
      teamId: timer.teamId,
      teamName: timer.teamName,
      status: timer.status,
    }));
  }

  private buildScoreEntries(runtime: BateOTempoRuntime): BateOTempoTimeEntry[] {
    return Array.from(runtime.timersByPlayerId.values()).map((timer) => ({
      playerId: timer.playerId,
      playerName: timer.playerName,
      teamId: timer.teamId,
      teamName: timer.teamName,
      elapsedMs: timer.status === 'stopped' ? timer.elapsedMs : null,
    }));
  }

  private didEveryoneStop(room: GameRoom): boolean {
    const runtime = this.requireRuntime(room);
    const expected = this.getExpectedPlayers(room);
    return expected.length > 0 && expected.every((player) => runtime.timersByPlayerId.get(player.id)?.status === 'stopped');
  }

  private getExpectedPlayers(room: GameRoom): Player[] {
    return Array.from(room.players.values()).filter((player) => {
      if (!player.isConnected) return false;
      if (room.settings.gameMode === 'teams' && !player.teamId) return false;
      return true;
    });
  }

  private applyScore(room: GameRoom, result: ReturnType<typeof calculateBateOTempoRoundScore>): void {
    if (!result.hasValidStops) return;

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

  private requireRuntime(room: GameRoom): BateOTempoRuntime {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) throw new Error(`BateOTempo runtime missing for room ${room.code}`);
    return runtime;
  }
}

export const bateOTempoGameManager = new BateOTempoGameManager();
