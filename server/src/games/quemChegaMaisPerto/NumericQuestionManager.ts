import { Difficulty, GameRoom, Question } from '../../types';
import { roomManager } from '../../RoomManager';
import { NumericQuestion, OFFICIAL_NUMERIC_QUESTIONS } from './questions';

type SelectResult =
  | { success: true; questions: NumericQuestion[]; source: 'official' | 'custom' }
  | { success: false; error: string; available: number; source: 'official' | 'custom' };

export class NumericQuestionManager {
  getOfficialQuestions(): NumericQuestion[] {
    return [...OFFICIAL_NUMERIC_QUESTIONS];
  }

  getCategories(): string[] {
    return Array.from(new Set(OFFICIAL_NUMERIC_QUESTIONS.map((question) => question.category))).sort();
  }

  selectForRoom(room: GameRoom, usedIds?: Set<string>): SelectResult {
    const count = room.settings.roundCount || 8;

    if (room.settings.questionSource === 'custom') {
      return this.selectCustom(room, count, usedIds);
    }

    return this.selectOfficial(
      room.settings.categories?.length ? room.settings.categories : [room.settings.category || 'Tudo misturado'],
      room.settings.difficulty || 'mixed',
      count,
      usedIds,
    );
  }

  selectOfficial(
    categories: string[],
    difficulty: Difficulty,
    count: number,
    usedIds?: Set<string>,
  ): SelectResult {
    let pool = this.getQuestionsByCategories(categories);

    if (difficulty !== 'mixed') {
      pool = pool.filter((question) => question.difficulty === difficulty);
    }

    if (usedIds && usedIds.size > 0) {
      pool = pool.filter((question) => !usedIds.has(question.id));
    }

    if (pool.length < count) {
      return { success: false, error: 'NOT_ENOUGH_NUMERIC_QUESTIONS', available: pool.length, source: 'official' };
    }

    return {
      success: true,
      questions: this.balancedSelect(pool, count, categories),
      source: 'official',
    };
  }

  selectCustom(room: GameRoom, count: number, usedIds?: Set<string>): SelectResult {
    if (!room.settings.customContentId) {
      return { success: false, error: 'MISSING_CUSTOM_CONTENT', available: 0, source: 'custom' };
    }

    const content = roomManager.getCustomQuiz(room.settings.customContentId);
    if (!content || content.gameType !== 'quem-chega-mais-perto' || content.contentType !== 'numeric-questions') {
      return { success: false, error: 'CUSTOM_NUMERIC_CONTENT_NOT_FOUND', available: 0, source: 'custom' };
    }

    let pool = content.questions.map((question, index) => this.fromCustomQuestion(question, index)).filter(Boolean) as NumericQuestion[];
    if (usedIds && usedIds.size > 0) {
      pool = pool.filter((question) => !usedIds.has(question.id));
    }

    if (pool.length < count) {
      return { success: false, error: 'NOT_ENOUGH_CUSTOM_NUMERIC_QUESTIONS', available: pool.length, source: 'custom' };
    }

    return {
      success: true,
      questions: this.shuffle(pool).slice(0, count),
      source: 'custom',
    };
  }

  private getQuestionsByCategories(categories: string[]): NumericQuestion[] {
    if (categories.includes('Tudo misturado')) {
      return [...OFFICIAL_NUMERIC_QUESTIONS];
    }

    const selected = new Set(categories);
    return OFFICIAL_NUMERIC_QUESTIONS.filter((question) => selected.has(question.category));
  }

  private fromCustomQuestion(question: Question, index: number): NumericQuestion | null {
    const correctValue = Number(question.correctAnswer);
    if (!Number.isFinite(correctValue)) return null;

    return {
      id: question.id || `custom-numeric-${index}`,
      text: question.text,
      correctValue,
      category: question.category || 'Personalizado',
      difficulty: question.difficulty || 'medium',
      explanation: question.explanation,
    };
  }

  private balancedSelect(pool: NumericQuestion[], count: number, categories: string[]): NumericQuestion[] {
    if (!categories.includes('Tudo misturado')) {
      return this.shuffle([...pool]).slice(0, count);
    }

    const byCategory = new Map<string, NumericQuestion[]>();
    for (const question of this.shuffle([...pool])) {
      const list = byCategory.get(question.category) || [];
      list.push(question);
      byCategory.set(question.category, list);
    }

    const buckets = Array.from(byCategory.values()).sort((a, b) => b.length - a.length);
    const selected: NumericQuestion[] = [];
    let round = 0;

    while (selected.length < count) {
      let added = false;
      for (const bucket of buckets) {
        const next = bucket[round];
        if (!next) continue;
        selected.push(next);
        added = true;
        if (selected.length >= count) break;
      }
      if (!added) break;
      round++;
    }

    return selected.slice(0, count);
  }

  private shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
}

export const numericQuestionManager = new NumericQuestionManager();
