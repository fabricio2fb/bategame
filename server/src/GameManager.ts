import { GameRoom, Question, Team, RoundEvent, Difficulty } from './types';
import { questionManager } from './QuestionManager';
import { roomManager } from './RoomManager';
import { sanitizeQuestion } from './types';

const BUZZER_WAIT_TIME = 8000;
const ANSWER_TIME = 10000;

const roomTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

function clearRoomTimers(roomCode: string): void {
  const timers = roomTimers.get(roomCode);
  if (timers) {
    for (const t of timers) clearTimeout(t);
    roomTimers.delete(roomCode);
  }
}

function addTimer(roomCode: string, timer: ReturnType<typeof setTimeout>): void {
  const timers = roomTimers.get(roomCode) || [];
  timers.push(timer);
  roomTimers.set(roomCode, timers);
}

const MAX_RECENT_QUESTIONS = 50;

export class GameManager {
  selectQuestions(room: GameRoom): { success: true } | { success: false; error: string; available: number } {
    const available = questionManager.getAvailableCount(
      room.settings.categories,
      room.settings.difficulty,
    );

    const needed = room.settings.questionCount;
    let availableAfterHistory = available;

    if (room.usedQuestionIds.size > 0) {
      availableAfterHistory = questionManager.selectQuestions(
        room.settings.categories,
        room.settings.difficulty,
        available,
        room.usedQuestionIds,
      ).length;
    }

    if (availableAfterHistory < needed) {
      if (available >= needed) {
        console.log(`[GameManager] Room ${room.code}: Pool exhausted, resetting history (had ${room.usedQuestionIds.size} used)`);
        room.usedQuestionIds.clear();
        room.usedFactKeys.clear();
        room.recentQuestionIds = [];
        room.categoryUsageCount.clear();
        room.difficultySequence = [];
      } else {
        return { success: false, error: 'NOT_ENOUGH_QUESTIONS', available: availableAfterHistory };
      }
    }

    room.selectedQuestions = questionManager.selectQuestions(
      room.settings.categories,
      room.settings.difficulty,
      needed,
      room.usedQuestionIds.size > 0 ? room.usedQuestionIds : undefined,
    );

    room.currentQuestionIndex = 0;
    room.currentBuzzerWinnerId = null;
    room.blockedPlayerIds = new Set();

    for (const q of room.selectedQuestions) {
      room.usedQuestionIds.add(q.id);
      if (q.factKey) {
        room.usedFactKeys.add(q.factKey);
      }
      if (q.category) {
        const count = room.categoryUsageCount.get(q.category) || 0;
        room.categoryUsageCount.set(q.category, count + 1);
      }
      if (q.difficulty) {
        room.difficultySequence.push(q.difficulty);
      }
      room.recentQuestionIds.push(q.id);
      if (room.recentQuestionIds.length > MAX_RECENT_QUESTIONS) {
        room.recentQuestionIds.shift();
      }
    }

    return { success: true };
  }

  selectCustomQuiz(room: GameRoom, quizId: string): boolean {
    const quiz = roomManager.getCustomQuiz(quizId);
    if (!quiz || quiz.questions.length === 0) return false;
    room.customQuiz = quiz;
    room.selectedQuestions = quiz.questions.slice(0, room.settings.questionCount);
    room.currentQuestionIndex = 0;
    room.currentBuzzerWinnerId = null;
    room.blockedPlayerIds = new Set();
    return true;
  }

  resetScores(room: GameRoom): void {
    for (const player of room.players.values()) {
      player.score = 0;
    }
    for (const team of room.teams) {
      team.score = 0;
    }
  }

  resetHistory(room: GameRoom): void {
    room.usedQuestionIds.clear();
    room.usedFactKeys.clear();
    room.recentQuestionIds = [];
    room.categoryUsageCount.clear();
    room.difficultySequence = [];
  }

  resetForRematch(room: GameRoom): void {
    room.currentQuestionIndex = 0;
    room.currentBuzzerWinnerId = null;
    room.blockedPlayerIds = new Set();
    room.answeredPlayerIds = new Set();
    room.roundHistory = [];
    room.roundStartedAt = null;
    room.buzzerPressedAt = null;
    room.roundAttemptId = (room.roundAttemptId || 0) + 1;
    if (room.buzzerTimer) clearTimeout(room.buzzerTimer);
    room.buzzerTimer = null;
    room.answerAttemptId = 0;
    room.answerDeadlineAt = null;
    if (room.answerTimer) clearTimeout(room.answerTimer);
    room.answerTimer = null;
    room.sofaSelectedPlayerId = null;
  }

  getCurrentQuestion(room: GameRoom): Question | null {
    if (room.currentQuestionIndex >= room.selectedQuestions.length) return null;
    return room.selectedQuestions[room.currentQuestionIndex];
  }

  getScores(room: GameRoom): Array<{ playerId: string; name: string; score: number }> {
    return Array.from(room.players.values())
      .map(p => ({ playerId: p.id, name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  getTeamScores(room: GameRoom): Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }> {
    return room.teams
      .map(t => ({
        teamId: t.id,
        name: t.name,
        color: t.color,
        score: t.score,
        activePlayerId: t.activePlayerId,
      }))
      .sort((a, b) => b.score - a.score);
  }

  addRoundEvent(room: GameRoom, event: Omit<RoundEvent, 'timestamp'>): void {
    room.roundHistory.push({ ...event, timestamp: Date.now() });
  }

  assignTeams(room: GameRoom, teamCount: number): void {
    const players = Array.from(room.players.values());
    room.teams = [];
    const teamNames = ['Azul', 'Vermelha', 'Verde', 'Amarela', 'Roxa', 'Rosa', 'Ciano', 'Laranja'];
    const teamColors = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
    for (let i = 0; i < teamCount; i++) {
      room.teams.push({
        id: `team-${i}`,
        name: teamNames[i] || `Time ${i + 1}`,
        score: 0,
        color: teamColors[i] || '#94A3B8',
        playerIds: [],
      });
    }
    for (let i = 0; i < players.length; i++) {
      const teamIdx = i % teamCount;
      players[i].teamId = room.teams[teamIdx].id;
      room.teams[teamIdx].playerIds.push(players[i].id);
    }
    room.teamRotationIndex = 0;
    this.rotateTeamActivePlayers(room);
  }

  rotateTeamActivePlayers(room: GameRoom): void {
    for (const team of room.teams) {
      const connectedPlayers = team.playerIds
        .map(id => room.players.get(id))
        .filter(p => p && p.isConnected);
      if (connectedPlayers.length === 0) continue;
      const rotationIdx = (room.teamRotationIndex || 0) % connectedPlayers.length;
      team.activePlayerId = connectedPlayers[rotationIdx]!.id;
    }
    room.teamRotationIndex = ((room.teamRotationIndex || 0) + 1);
  }

  canPlayerBuzz(room: GameRoom, playerId: string): boolean {
    if (room.status !== 'buzzer-open') return false;
    if (room.currentBuzzerWinnerId !== null) return false;
    if (room.blockedPlayerIds.has(playerId)) return false;

    if (room.settings.gameMode === 'teams') {
      const player = room.players.get(playerId);
      if (!player || !player.teamId) return false;
      if (room.settings.teamTurnMode === 'rotation' || room.settings.teamTurnMode === undefined) {
        const team = room.teams.find(t => t.id === player.teamId);
        if (!team || team.activePlayerId !== playerId) return false;
      }
    }

    if (room.settings.gameMode === 'couch') {
      const player = room.players.get(playerId);
      if (!player || !player.couchControl) return false;
    }

    return true;
  }

  handleCorrectAnswer(room: GameRoom, playerId: string): void {
    const player = room.players.get(playerId);
    if (!player) return;
    player.score += 1;

    if (room.settings.gameMode === 'teams' && player.teamId) {
      const team = room.teams.find(t => t.id === player.teamId);
      if (team) team.score += 1;
    }

    room.blockedPlayerIds.add(playerId);
    room.currentBuzzerWinnerId = null;
    room.status = 'correct';

    this.addRoundEvent(room, {
      type: 'answer-correct',
      playerId,
      playerName: player.name,
    });
  }

  handleWrongAnswer(room: GameRoom, playerId: string): void {
    const player = room.players.get(playerId);
    if (!player) return;

    if (room.settings.wrongAnswerPenalty !== 0) {
      player.score = Math.max(0, player.score + room.settings.wrongAnswerPenalty);
    }

    room.blockedPlayerIds.add(playerId);
    room.currentBuzzerWinnerId = null;

    this.addRoundEvent(room, {
      type: 'answer-wrong',
      playerId,
      playerName: player.name,
    });

    if (room.settings.gameMode === 'teams') {
      this.rotateTeamActivePlayers(room);
    }
  }

  isRoundOver(room: GameRoom): boolean {
    const connectedPlayers = Array.from(room.players.values()).filter(p => p.isConnected);
    return connectedPlayers.length > 0 && connectedPlayers.every(p => room.blockedPlayerIds.has(p.id));
  }

  getShuffledAlternatives(room: GameRoom): string[] | null {
    const question = this.getCurrentQuestion(room);
    if (!question || question.answerType !== 'multiple-choice' || !question.alternatives) {
      return null;
    }
    const { alternatives } = questionManager.shuffleAlternatives(question);
    return alternatives;
  }

  getFullGameState(room: GameRoom) {
    const question = this.getCurrentQuestion(room);
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
      scores: this.getScores(room),
      teamScores: this.getTeamScores(room),
      roundStartedAt: room.roundStartedAt,
      answerDeadlineAt: room.answerDeadlineAt ?? null,
      roundHistory: room.roundHistory.slice(-20),
      teams: room.teams,
    };
  }

  getQuestionForPlayer(room: GameRoom, playerId: string) {
    const question = this.getCurrentQuestion(room);
    if (!question) return { question: null, alternatives: null };

    const safeQuestion = sanitizeQuestion(question);

    if (question.answerType !== 'multiple-choice') {
      return { question: safeQuestion, alternatives: null };
    }

    if (room.status === 'answering' && room.currentBuzzerWinnerId === playerId && question.alternatives) {
      const { alternatives } = questionManager.shuffleAlternatives(question);
      return { question: safeQuestion, alternatives };
    }

    return { question: safeQuestion, alternatives: null };
  }

  cancelTimers(roomCode: string): void {
    clearRoomTimers(roomCode);
  }
}

export const gameManager = new GameManager();
