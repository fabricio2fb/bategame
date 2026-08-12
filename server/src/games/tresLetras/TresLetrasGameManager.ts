import { GameRoom, Player, Team } from '../../types';
import { roomManager } from '../../RoomManager';
import { drawTresLetras, isValidTresLetrasCombination, markRepeatedTresLetrasAnswers, normalizeTresLetrasAnswer, normalizeTresLetrasCombination } from './letters';
import { OFFICIAL_TRES_LETRAS_COMBINATIONS } from './officialCombinations';
import { calculateTresLetrasRoundScore, TresLetrasAnswerEntry, TresLetrasRoundScoreResult } from './scoring';

type EmitRoom = (event: string, payload: unknown) => void;
type EmitRoomsUpdated = () => void;

interface RuntimeHooks {
  emitRoom: EmitRoom;
  emitRoomsUpdated?: EmitRoomsUpdated;
}

interface TresLetrasRoundAnswer {
  answerId: string;
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  text: string;
  normalizedText: string;
  repeated: boolean;
  submittedAt: number;
}

interface TresLetrasRoomRuntime {
  rounds: Array<{ id: string; letters: string[] }>;
  answersByPlayerId: Map<string, TresLetrasRoundAnswer>;
  votesByAnswerId: Map<string, Map<string, 'correct' | 'wrong'>>;
  earlyEnderPlayerId: string | null;
  revealTimer: ReturnType<typeof setTimeout> | null;
  hooks: RuntimeHooks;
}

const DEFAULT_ROUNDS = 8;
const FIXED_WRITING_SECONDS = 30;
const FIXED_VOTING_SECONDS = 7;

export class TresLetrasGameManager {
  private runtimes = new Map<string, TresLetrasRoomRuntime>();

  prepareRoom(room: GameRoom): { success: true } | { success: false; error: string; available: number } {
    const roundCount = Math.max(1, Math.min(20, room.settings.roundCount || DEFAULT_ROUNDS));
    const selectedCombinations = this.selectCombinationsForRoom(room, roundCount);
    if (selectedCombinations.length < roundCount) {
      return { success: false, error: 'NOT_ENOUGH_COMBINATIONS', available: selectedCombinations.length };
    }
    const rounds = selectedCombinations.map((letters, index) => ({
      id: `tres-letras-${room.code}-${index + 1}`,
      letters,
    }));

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
      rounds,
      answersByPlayerId: new Map(),
      votesByAnswerId: new Map(),
      earlyEnderPlayerId: null,
      revealTimer: null,
      hooks: { emitRoom: () => undefined },
    });

    return { success: true };
  }

  start(room: GameRoom, hooks: RuntimeHooks): void {
    const runtime = this.requireRuntime(room);
    runtime.hooks = hooks;
    this.startWritingRound(room);
  }

  submitAnswer(room: GameRoom, player: Player, data: { roundId?: string; answer?: unknown }): {
    success: true;
  } | {
    success: false;
    error: { code: string; message: string };
  } {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return { success: false, error: { code: 'GAME_NOT_STARTED', message: 'Partida nao iniciada.' } };
    if (room.settings.gameType !== 'tres-letras') return { success: false, error: { code: 'INVALID_GAME_TYPE', message: 'Evento invalido para este jogo.' } };
    if (room.status !== 'letters-visible' && room.status !== 'writing') {
      return { success: false, error: { code: 'ROUND_NOT_OPEN', message: 'A rodada nao esta recebendo respostas.' } };
    }
    if (!room.roundDeadlineAt || Date.now() > room.roundDeadlineAt) {
      this.startVoting(room, 'timeout');
      return { success: false, error: { code: 'TIME_EXPIRED', message: 'Tempo esgotado.' } };
    }

    const round = this.getCurrentRound(room);
    if (!round || data.roundId !== round.id) {
      return { success: false, error: { code: 'WRONG_ROUND', message: 'Rodada invalida.' } };
    }
    if (runtime.answersByPlayerId.has(player.id)) {
      return { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Voce ja enviou sua resposta nesta rodada.' } };
    }

    const text = String(data.answer || '').trim().slice(0, 80);
    const normalizedText = normalizeTresLetrasAnswer(text);
    if (!normalizedText) {
      return { success: false, error: { code: 'INVALID_ANSWER', message: 'Digite uma palavra ou expressao.' } };
    }

    const team = player.teamId ? room.teams.find((entry) => entry.id === player.teamId) : undefined;
    const answer: TresLetrasRoundAnswer = {
      answerId: `${room.code}-${room.currentQuestionIndex + 1}-${player.id}`,
      playerId: player.id,
      playerName: player.name,
      teamId: player.teamId,
      teamName: team?.name,
      text,
      normalizedText,
      repeated: false,
      submittedAt: Date.now(),
    };

    runtime.answersByPlayerId.set(player.id, answer);
    room.answeredPlayerIds.add(player.id);
    room.lastActivityAt = Date.now();
    room.roundHistory.push({
      type: 'tres-letras-answer-submitted',
      playerId: player.id,
      playerName: player.name,
      timestamp: Date.now(),
    });

    runtime.hooks.emitRoom('answer:submitted', {
      roomCode: room.code,
      roundId: round.id,
      playerId: player.id,
      playerName: player.name,
      submittedPlayerIds: Array.from(runtime.answersByPlayerId.keys()),
      submittedCount: runtime.answersByPlayerId.size,
      expectedCount: this.getExpectedPlayers(room).length,
    });

    if (room.settings.endRoundOnFirstSubmit) {
      runtime.earlyEnderPlayerId = player.id;
      this.startVoting(room, 'first-submitted');
    } else if (this.didEveryoneAnswer(room)) {
      this.startVoting(room, 'all-submitted');
    }

    return { success: true };
  }

  submitVote(room: GameRoom, player: Player, data: { roundId?: string; answerId?: string; vote?: unknown }): {
    success: true;
  } | {
    success: false;
    error: { code: string; message: string };
  } {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return { success: false, error: { code: 'GAME_NOT_STARTED', message: 'Partida nao iniciada.' } };
    if (room.settings.gameType !== 'tres-letras') return { success: false, error: { code: 'INVALID_GAME_TYPE', message: 'Evento invalido para este jogo.' } };
    if (room.status !== 'voting') {
      return { success: false, error: { code: 'VOTING_NOT_OPEN', message: 'A votacao nao esta aberta.' } };
    }
    if (!room.answerDeadlineAt || Date.now() > room.answerDeadlineAt) {
      this.revealRound(room, 'timeout');
      return { success: false, error: { code: 'TIME_EXPIRED', message: 'Tempo de votacao esgotado.' } };
    }

    const round = this.getCurrentRound(room);
    if (!round || data.roundId !== round.id) {
      return { success: false, error: { code: 'WRONG_ROUND', message: 'Rodada invalida.' } };
    }
    if (!runtime.answersByPlayerId.has(player.id)) {
      return { success: false, error: { code: 'NOT_PARTICIPATING', message: 'Quem nao respondeu nao vota nesta rodada.' } };
    }
    const answerId = String(data.answerId || '');
    const vote = data.vote === 'correct' || data.vote === 'wrong' ? data.vote : null;
    if (!vote) {
      return { success: false, error: { code: 'INVALID_VOTE', message: 'Vote certo ou errado.' } };
    }
    if (!Array.from(runtime.answersByPlayerId.values()).some((answer) => answer.answerId === answerId)) {
      return { success: false, error: { code: 'ANSWER_NOT_FOUND', message: 'Resposta nao encontrada.' } };
    }

    const votesForAnswer = runtime.votesByAnswerId.get(answerId) || new Map<string, 'correct' | 'wrong'>();
    votesForAnswer.set(player.id, vote);
    runtime.votesByAnswerId.set(answerId, votesForAnswer);
    room.lastActivityAt = Date.now();

    runtime.hooks.emitRoom('vote:submitted', {
      roomCode: room.code,
      roundId: round.id,
      answerId,
      playerId: player.id,
      voteCounts: this.buildVoteCounts(runtime),
      completedVoterIds: this.getCompletedVoterIds(room, runtime),
    });

    return { success: true };
  }

  getGameState(room: GameRoom): Record<string, unknown> | null {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return null;
    const round = this.getCurrentRound(room);
    return {
      status: room.status,
      gameType: 'tres-letras',
      currentQuestionIndex: room.currentQuestionIndex,
      totalRounds: runtime.rounds.length,
      currentRound: round ? { id: round.id, letters: round.letters } : null,
      roundStartedAt: room.roundStartedAt,
      roundDeadlineAt: room.roundDeadlineAt ?? null,
      votingDeadlineAt: room.answerDeadlineAt ?? null,
      submittedPlayerIds: Array.from(runtime.answersByPlayerId.keys()),
      voteCounts: this.buildVoteCounts(runtime),
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

  private startWritingRound(room: GameRoom): void {
    const runtime = this.requireRuntime(room);
    const round = this.getCurrentRound(room);
    if (!round) {
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

    runtime.answersByPlayerId = new Map();
    runtime.votesByAnswerId = new Map();
    runtime.earlyEnderPlayerId = null;
    room.answeredPlayerIds = new Set();
    room.blockedPlayerIds = new Set();
    room.status = 'letters-visible';
    room.roundStartedAt = Date.now();
    room.roundDeadlineAt = room.roundStartedAt + FIXED_WRITING_SECONDS * 1000;
    room.answerDeadlineAt = null;
    room.lastActivityAt = Date.now();
    room.roundHistory.push({
      type: 'tres-letras-letters-visible',
      timestamp: Date.now(),
      data: { roundId: round.id, letters: round.letters, roundIndex: room.currentQuestionIndex },
    });

    const payload = {
      roomCode: room.code,
      roundId: round.id,
      letters: round.letters,
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.rounds.length,
      writingDeadlineAt: room.roundDeadlineAt,
      submittedPlayerIds: [],
    };

    if (room.currentQuestionIndex === 0) {
      runtime.hooks.emitRoom('game:started', { gameState: this.getGameState(room) });
    } else {
      runtime.hooks.emitRoom('game:state', this.getGameState(room));
    }
    runtime.hooks.emitRoom('round:letters', payload);

    setTimeout(() => {
      if (room.status !== 'letters-visible') return;
      room.status = 'writing';
      runtime.hooks.emitRoom('game:state', this.getGameState(room));
    }, 250);

    room.answerTimer = setTimeout(() => {
      this.startVoting(room, 'timeout');
    }, Math.max(0, room.roundDeadlineAt - Date.now()));
  }

  private startVoting(room: GameRoom, reason: 'timeout' | 'all-submitted' | 'first-submitted'): void {
    const runtime = this.runtimes.get(room.code);
    if (!runtime || room.status === 'voting' || room.status === 'round-reveal' || room.status === 'game-finished') return;

    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }

    const round = this.getCurrentRound(room);
    if (!round) {
      this.finishGame(room);
      return;
    }

    const repeated = markRepeatedTresLetrasAnswers(
      Array.from(runtime.answersByPlayerId.values()).map((answer) => ({
        id: answer.answerId,
        text: answer.text,
      })),
    );
    const repeatedById = new Map(repeated.map((entry) => [entry.id, entry]));
    for (const answer of runtime.answersByPlayerId.values()) {
      const marked = repeatedById.get(answer.answerId);
      answer.normalizedText = marked?.normalizedText || answer.normalizedText;
      answer.repeated = marked?.repeated || false;
    }

    room.status = 'voting';
    room.roundDeadlineAt = null;
    room.answerDeadlineAt = Date.now() + this.getVotingSeconds(room) * 1000;
    room.lastActivityAt = Date.now();
    room.roundHistory.push({
      type: 'tres-letras-voting-started',
      timestamp: Date.now(),
      data: { roundId: round.id, reason, answerCount: runtime.answersByPlayerId.size },
    });

    runtime.hooks.emitRoom('game:state', this.getGameState(room));
    runtime.hooks.emitRoom('voting:start', {
      roomCode: room.code,
      roundId: round.id,
      letters: round.letters,
      reason,
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.rounds.length,
      votingDeadlineAt: room.answerDeadlineAt,
      answers: this.buildPublicAnswers(runtime),
      voteCounts: this.buildVoteCounts(runtime),
    });

    room.answerTimer = setTimeout(() => {
      this.revealRound(room, 'timeout');
    }, Math.max(0, room.answerDeadlineAt - Date.now()));
  }

  private revealRound(room: GameRoom, reason: 'timeout' | 'all-voted'): void {
    const runtime = this.runtimes.get(room.code);
    if (!runtime || room.status === 'round-reveal' || room.status === 'round-finished' || room.status === 'game-finished') return;

    if (room.answerTimer) {
      clearTimeout(room.answerTimer);
      room.answerTimer = null;
    }

    const round = this.getCurrentRound(room);
    if (!round) {
      this.finishGame(room);
      return;
    }

    room.status = 'round-reveal';
    room.roundDeadlineAt = null;
    room.answerDeadlineAt = null;
    room.lastActivityAt = Date.now();

    const scoreResult = calculateTresLetrasRoundScore({
      answers: this.buildScoreAnswers(room, runtime),
      scoreTarget: room.settings.gameMode === 'teams' ? 'team' : 'player',
      earlyEnderPlayerId: runtime.earlyEnderPlayerId,
    });
    this.applyScore(room, scoreResult);
    room.roundHistory.push({
      type: 'tres-letras-round-reveal',
      timestamp: Date.now(),
      data: { roundId: round.id, reason },
    });

    const payload = {
      roomCode: room.code,
      roundId: round.id,
      letters: round.letters,
      reason,
      roundIndex: room.currentQuestionIndex,
      roundNumber: room.currentQuestionIndex + 1,
      totalRounds: runtime.rounds.length,
      answers: scoreResult.answers,
      earlyEnderPlayerId: runtime.earlyEnderPlayerId,
      missingPlayerIds: this.getExpectedPlayers(room)
        .filter((player) => !runtime.answersByPlayerId.has(player.id))
        .map((player) => player.id),
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
    };

    runtime.hooks.emitRoom('round:reveal', payload);
    runtime.hooks.emitRoom('score:updated', { scores: this.getScores(room), teamScores: this.getTeamScores(room) });

    runtime.revealTimer = setTimeout(() => this.advanceAfterReveal(room), 6000);
  }

  private advanceAfterReveal(room: GameRoom): void {
    const runtime = this.runtimes.get(room.code);
    if (!runtime || room.status === 'game-finished') return;

    room.status = 'round-finished';
    room.lastActivityAt = Date.now();
    runtime.hooks.emitRoom('game:state', this.getGameState(room));

    if (room.currentQuestionIndex >= runtime.rounds.length - 1) {
      this.finishGame(room);
      return;
    }

    room.currentQuestionIndex += 1;
    room.status = 'scoreboard';
    room.lastActivityAt = Date.now();
    runtime.hooks.emitRoom('game:state', this.getGameState(room));
    runtime.revealTimer = setTimeout(() => this.startWritingRound(room), 2000);
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
    const payload = { gameType: 'tres-letras', scores: this.getScores(room), teamScores: this.getTeamScores(room) };
    runtime?.hooks.emitRoom('game:finished', payload);
    runtime?.hooks.emitRoom('game:state', this.getGameState(room));
    runtime?.hooks.emitRoomsUpdated?.();
  }

  private selectCombinationsForRoom(room: GameRoom, roundCount: number): string[][] {
    if (room.settings.questionSource === 'custom' && room.settings.customContentId) {
      const content = roomManager.getCustomQuiz(room.settings.customContentId);
      if (!content || content.gameType !== 'tres-letras') return [];

      return content.questions
        .map((question) => normalizeTresLetrasCombination(question.correctAnswer || question.text))
        .filter(isValidTresLetrasCombination)
        .slice(0, roundCount);
    }

    const official = shuffle(OFFICIAL_TRES_LETRAS_COMBINATIONS.map((combination) => [...combination]));
    const selected = official.slice(0, roundCount);

    while (selected.length < roundCount) {
      const fallback = drawTresLetras();
      const key = fallback.join('');
      if (!selected.some((combination) => combination.join('') === key)) {
        selected.push(fallback);
      }
    }

    return selected;
  }

  private getCurrentRound(room: GameRoom): { id: string; letters: string[] } | null {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) return null;
    return runtime.rounds[room.currentQuestionIndex] || null;
  }

  private getVotingSeconds(_room: GameRoom): number {
    return FIXED_VOTING_SECONDS;
  }

  private buildPublicAnswers(runtime: TresLetrasRoomRuntime): Array<Record<string, unknown>> {
    return Array.from(runtime.answersByPlayerId.values()).map((answer) => ({
      answerId: answer.answerId,
      playerId: answer.playerId,
      playerName: answer.playerName,
      teamId: answer.teamId,
      teamName: answer.teamName,
      text: answer.text,
      repeated: answer.repeated,
      submittedAt: answer.submittedAt,
    }));
  }

  private buildScoreAnswers(room: GameRoom, runtime: TresLetrasRoomRuntime): TresLetrasAnswerEntry[] {
    const voters = this.getExpectedVoters(room, runtime);
    return Array.from(runtime.answersByPlayerId.values()).map((answer) => {
      const votes = new Map(runtime.votesByAnswerId.get(answer.answerId) || new Map<string, 'correct' | 'wrong'>());
      for (const voter of voters) {
        if (!votes.has(voter.id)) votes.set(voter.id, 'correct');
      }
      return {
        answerId: answer.answerId,
        playerId: answer.playerId,
        playerName: answer.playerName,
        teamId: answer.teamId,
        teamName: answer.teamName,
        text: answer.text,
        normalizedText: answer.normalizedText,
        repeated: answer.repeated,
        votes: Array.from(votes.entries()).map(([voterPlayerId, value]) => ({ voterPlayerId, value })),
      };
    });
  }

  private buildVoteCounts(runtime: TresLetrasRoomRuntime): Array<Record<string, unknown>> {
    return Array.from(runtime.answersByPlayerId.values()).map((answer) => {
      const votes = Array.from((runtime.votesByAnswerId.get(answer.answerId) || new Map()).values());
      return {
        answerId: answer.answerId,
        correctVotes: votes.filter((vote) => vote === 'correct').length,
        wrongVotes: votes.filter((vote) => vote === 'wrong').length,
        totalVotes: votes.length,
      };
    });
  }

  private getCompletedVoterIds(room: GameRoom, runtime: TresLetrasRoomRuntime): string[] {
    const answerIds = Array.from(runtime.answersByPlayerId.values()).map((answer) => answer.answerId);
    return this.getExpectedVoters(room, runtime)
      .filter((player) => answerIds.every((answerId) => runtime.votesByAnswerId.get(answerId)?.has(player.id)))
      .map((player) => player.id);
  }

  private didEveryoneAnswer(room: GameRoom): boolean {
    const runtime = this.requireRuntime(room);
    const expected = this.getExpectedPlayers(room);
    return expected.length > 0 && expected.every((player) => runtime.answersByPlayerId.has(player.id));
  }

  private didEveryoneVote(room: GameRoom): boolean {
    const runtime = this.requireRuntime(room);
    const answerIds = Array.from(runtime.answersByPlayerId.values()).map((answer) => answer.answerId);
    const voters = this.getExpectedVoters(room, runtime);
    return answerIds.length > 0 && voters.length > 0 && voters.every((player) =>
      answerIds.every((answerId) => runtime.votesByAnswerId.get(answerId)?.has(player.id)),
    );
  }

  private getExpectedPlayers(room: GameRoom): Player[] {
    return Array.from(room.players.values()).filter((player) => {
      if (!player.isConnected) return false;
      if (room.settings.gameMode === 'teams' && !player.teamId) return false;
      return true;
    });
  }

  private getExpectedVoters(room: GameRoom, runtime: TresLetrasRoomRuntime): Player[] {
    return this.getExpectedPlayers(room).filter((player) => runtime.answersByPlayerId.has(player.id));
  }

  private applyScore(room: GameRoom, result: TresLetrasRoundScoreResult): void {
    if (result.scoreTarget === 'team') {
      for (const [teamId, points] of Object.entries(result.teamPoints)) {
        const team = room.teams.find((entry) => entry.id === teamId);
        if (team) team.score += points;
      }
      return;
    }

    for (const [playerId, points] of Object.entries(result.playerPoints)) {
      const player = room.players.get(playerId);
      if (player) player.score += points;
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

  private requireRuntime(room: GameRoom): TresLetrasRoomRuntime {
    const runtime = this.runtimes.get(room.code);
    if (!runtime) throw new Error(`TresLetras runtime missing for room ${room.code}`);
    return runtime;
  }
}

export const tresLetrasGameManager = new TresLetrasGameManager();

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
