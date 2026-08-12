import { Difficulty, GameRoom, Question } from '../../types';
import { roomManager } from '../../RoomManager';
import { OFFICIAL_WORD_QUESTIONS, WordQuestion } from './words';

type SelectResult =
  | { success: true; words: WordQuestion[]; source: 'official' | 'custom' }
  | { success: false; error: string; available: number; source: 'official' | 'custom' };

export class WordQuestionManager {
  getOfficialWords(): WordQuestion[] {
    return [...OFFICIAL_WORD_QUESTIONS];
  }

  getCategories(): string[] {
    return Array.from(new Set(OFFICIAL_WORD_QUESTIONS.map((word) => word.category))).sort();
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
    let pool = this.getWordsByCategories(categories);

    if (difficulty !== 'mixed') {
      pool = pool.filter((word) => word.difficulty === difficulty);
    }

    if (usedIds && usedIds.size > 0) {
      pool = pool.filter((word) => !usedIds.has(word.id));
    }

    if (pool.length < count) {
      return { success: false, error: 'NOT_ENOUGH_WORDS', available: pool.length, source: 'official' };
    }

    return {
      success: true,
      words: this.balancedSelect(pool, count, categories),
      source: 'official',
    };
  }

  selectCustom(room: GameRoom, count: number, usedIds?: Set<string>): SelectResult {
    if (!room.settings.customContentId) {
      return { success: false, error: 'MISSING_CUSTOM_CONTENT', available: 0, source: 'custom' };
    }

    const content = roomManager.getCustomQuiz(room.settings.customContentId);
    if (!content || content.gameType !== 'qual-e-a-palavra' || content.contentType !== 'word-list') {
      return { success: false, error: 'CUSTOM_WORD_CONTENT_NOT_FOUND', available: 0, source: 'custom' };
    }

    let pool = content.questions.map((question, index) => this.fromCustomWord(question, index)).filter(Boolean) as WordQuestion[];
    if (usedIds && usedIds.size > 0) {
      pool = pool.filter((word) => !usedIds.has(word.id));
    }

    if (pool.length < count) {
      return { success: false, error: 'NOT_ENOUGH_CUSTOM_WORDS', available: pool.length, source: 'custom' };
    }

    return {
      success: true,
      words: this.shuffle(pool).slice(0, count),
      source: 'custom',
    };
  }

  private getWordsByCategories(categories: string[]): WordQuestion[] {
    if (categories.includes('Tudo misturado')) {
      return [...OFFICIAL_WORD_QUESTIONS];
    }

    const selected = new Set(categories);
    return OFFICIAL_WORD_QUESTIONS.filter((word) => selected.has(word.category));
  }

  private fromCustomWord(question: Question, index: number): WordQuestion | null {
    const word = normalizeWord(question.correctAnswer || question.text);
    if (word.length < 2) return null;

    return {
      id: question.id || `custom-word-${index}`,
      word,
      category: question.category || 'Personalizado',
      difficulty: question.difficulty || 'medium',
      hint: question.explanation,
    };
  }

  private balancedSelect(pool: WordQuestion[], count: number, categories: string[]): WordQuestion[] {
    if (!categories.includes('Tudo misturado')) {
      return this.shuffle([...pool]).slice(0, count);
    }

    const byCategory = new Map<string, WordQuestion[]>();
    for (const word of this.shuffle([...pool])) {
      const list = byCategory.get(word.category) || [];
      list.push(word);
      byCategory.set(word.category, list);
    }

    const buckets = Array.from(byCategory.values()).sort((a, b) => b.length - a.length);
    const selected: WordQuestion[] = [];
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

export function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

export function shuffleWordLetters(word: string): string {
  const normalized = normalizeWord(word);
  if (normalized.length <= 1) return normalized;

  const letters = normalized.split('');
  const canChangeOrder = new Set(letters).size > 1;
  if (!canChangeOrder) return normalized;

  for (let attempt = 0; attempt < 20; attempt++) {
    const shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const result = shuffled.join('');
    if (result !== normalized) return result;
  }

  return `${normalized.slice(1)}${normalized[0]}`;
}

export const wordQuestionManager = new WordQuestionManager();
