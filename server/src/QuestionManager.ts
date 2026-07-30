import * as fs from 'fs';
import * as path from 'path';
import { Question, Difficulty, AnswerType } from './types';

const RELEASE_QUESTIONS_TOTAL = 11290;
const VALID_DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);
const OFFICIAL_QUESTIONS_PATH = path.resolve(__dirname, '..', '..', 'data', 'release', 'questions-release.json');

interface RawQuestion {
  id: string;
  text?: string;
  question?: string;
  category: string;
  subcategory?: string;
  difficulty?: string;
  type?: string;
  answerType?: string;
  correctAnswer?: string;
  correctAlternativeIndex?: number;
  acceptedAnswers?: string[];
  alternatives?: string[];
  explanation?: string;
  timeLimitSeconds?: number;
  tags?: string[];
  factKey?: string;
}

function failQuestionValidation(id: string, message: string): never {
  throw new Error(`[QuestionManager] Invalid release question ${id || '(missing id)'}: ${message}`);
}

function migrateQuestion(raw: RawQuestion): Question {
  const answerType: AnswerType = (raw.answerType as AnswerType) ||
    (raw.type === 'multiple-choice' ? 'multiple-choice' : 'multiple-choice');

  const text = raw.text || raw.question || '';

  let correctAlternativeIndex = raw.correctAlternativeIndex;
  let correctAnswer = raw.correctAnswer;

  if (raw.alternatives && raw.alternatives.length === 4) {
    if (correctAlternativeIndex === undefined && correctAnswer) {
      correctAlternativeIndex = raw.alternatives.indexOf(correctAnswer);
    }
    if (!correctAnswer && correctAlternativeIndex !== undefined) {
      correctAnswer = raw.alternatives[correctAlternativeIndex];
    }
  }

  return {
    id: raw.id,
    text,
    answerType,
    category: raw.category,
    subcategory: raw.subcategory,
    difficulty: (raw.difficulty || 'medium') as Difficulty,
    factKey: raw.factKey,
    alternatives: raw.alternatives,
    correctAlternativeIndex: correctAlternativeIndex !== undefined && correctAlternativeIndex >= 0 ? correctAlternativeIndex : undefined,
    correctAnswer: correctAnswer,
    acceptedAnswers: raw.acceptedAnswers || raw.alternatives,
    strictness: 'normalized',
    timeLimitSeconds: raw.timeLimitSeconds || 15,
    explanation: raw.explanation,
  };
}

interface CategoryIndex {
  byCategory: Map<string, Question[]>;
  bySubcategory: Map<string, Question[]>;
  byDifficulty: Map<string, Question[]>;
  byCategoryDifficulty: Map<string, Question[]>;
  allQuestions: Question[];
  byId: Map<string, Question>;
  byFactKey: Map<string, Question>;
}

export class QuestionManager {
  private questions: Question[] = [];
  private loaded = false;
  private index: CategoryIndex | null = null;
  private categories: string[] = [];
  private subcategories: string[] = [];
  private difficulties: string[] = [];

  loadAll(): void {
    if (this.loaded) return;
    const startTime = Date.now();

    if (!fs.existsSync(OFFICIAL_QUESTIONS_PATH)) {
      throw new Error(`[QuestionManager] Official release question bank not found: ${OFFICIAL_QUESTIONS_PATH}`);
    }

    try {
      const content = fs.readFileSync(OFFICIAL_QUESTIONS_PATH, 'utf-8');
      const rawList: RawQuestion[] = JSON.parse(content);

      this.validateRawQuestions(rawList);
      this.questions = rawList.map(migrateQuestion);
    } catch (err) {
      console.error(`[QuestionManager] Failed to load release question bank:`, err);
      throw err;
    }

    this.buildIndex();
    this.loaded = true;

    const duration = Date.now() - startTime;
    const memUsage = process.memoryUsage().heapUsed;

    console.log(`[QuestionManager] Loaded ${this.questions.length} release questions in ${duration}ms`);
    console.log(`[QuestionManager] Source: ${OFFICIAL_QUESTIONS_PATH}`);
    console.log(`[QuestionManager] Categories: ${this.categories.length} (${this.categories.join(', ')})`);
    console.log(`[QuestionManager] Difficulties: ${this.difficulties.join(', ')}`);
    console.log(`[QuestionManager] Memory: ~${(memUsage / 1024 / 1024).toFixed(1)} MB`);
  }

  private validateRawQuestions(rawList: RawQuestion[]): void {
    if (!Array.isArray(rawList)) {
      throw new Error('[QuestionManager] Release question bank must be a JSON array.');
    }
    if (rawList.length !== RELEASE_QUESTIONS_TOTAL) {
      throw new Error(`[QuestionManager] Expected ${RELEASE_QUESTIONS_TOTAL} release questions, found ${rawList.length}.`);
    }

    const ids = new Set<string>();
    for (const raw of rawList) {
      if (!raw || typeof raw !== 'object') failQuestionValidation('', 'question must be an object');
      if (!raw.id || typeof raw.id !== 'string' || raw.id.trim().length === 0) {
        failQuestionValidation('', 'id is required');
      }
      const id = raw.id;
      if (ids.has(id)) failQuestionValidation(id, 'duplicate id');
      ids.add(id);

      const text = raw.text || raw.question;
      if (!text || typeof text !== 'string' || text.trim().length === 0) failQuestionValidation(id, 'question text is required');
      if (!raw.category || typeof raw.category !== 'string' || raw.category.trim().length === 0) failQuestionValidation(id, 'category is required');
      if (!raw.difficulty || !VALID_DIFFICULTIES.has(raw.difficulty as Difficulty)) failQuestionValidation(id, `invalid difficulty: ${raw.difficulty}`);
      if (!Array.isArray(raw.alternatives) || raw.alternatives.length !== 4) failQuestionValidation(id, 'exactly 4 alternatives are required');
      if (raw.alternatives.some(a => typeof a !== 'string' || a.trim().length === 0)) failQuestionValidation(id, 'alternatives cannot be empty');
      if (!Number.isInteger(raw.correctAlternativeIndex) || raw.correctAlternativeIndex! < 0 || raw.correctAlternativeIndex! > 3) {
        failQuestionValidation(id, `correctAlternativeIndex out of range: ${raw.correctAlternativeIndex}`);
      }
      if (!raw.correctAnswer || typeof raw.correctAnswer !== 'string' || raw.correctAnswer.trim().length === 0) failQuestionValidation(id, 'correctAnswer is required');
      if (raw.alternatives[raw.correctAlternativeIndex!] !== raw.correctAnswer) {
        failQuestionValidation(id, 'correctAnswer does not match correctAlternativeIndex');
      }
    }
  }

  private buildIndex(): void {
    const byCategory = new Map<string, Question[]>();
    const bySubcategory = new Map<string, Question[]>();
    const byDifficulty = new Map<string, Question[]>();
    const byCategoryDifficulty = new Map<string, Question[]>();
    const byId = new Map<string, Question>();
    const byFactKey = new Map<string, Question>();
    const catSet = new Set<string>();
    const subcatSet = new Set<string>();
    const diffSet = new Set<string>();

    for (const q of this.questions) {
      byId.set(q.id, q);

      if (q.category) {
        catSet.add(q.category);
        const arr = byCategory.get(q.category) || [];
        arr.push(q);
        byCategory.set(q.category, arr);
      }

      if (q.subcategory) {
        subcatSet.add(q.subcategory);
        const arr = bySubcategory.get(q.subcategory) || [];
        arr.push(q);
        bySubcategory.set(q.subcategory, arr);
      }

      if (q.difficulty) {
        diffSet.add(q.difficulty);
        const arr = byDifficulty.get(q.difficulty) || [];
        arr.push(q);
        byDifficulty.set(q.difficulty, arr);

        if (q.category) {
          const key = `${q.category}:${q.difficulty}`;
          const arr2 = byCategoryDifficulty.get(key) || [];
          arr2.push(q);
          byCategoryDifficulty.set(key, arr2);
        }
      }

      if (q.factKey) {
        byFactKey.set(q.factKey, q);
      }
    }

    this.index = {
      byCategory,
      bySubcategory,
      byDifficulty,
      byCategoryDifficulty,
      allQuestions: this.questions,
      byId,
      byFactKey,
    };

    this.categories = Array.from(catSet).sort();
    this.subcategories = Array.from(subcatSet).sort();
    this.difficulties = Array.from(diffSet).sort();
  }

  private ensureLoaded(): void {
    if (!this.loaded) this.loadAll();
  }

  getCategories(): string[] {
    this.ensureLoaded();
    return [...this.categories];
  }

  getSubcategories(): string[] {
    this.ensureLoaded();
    return [...this.subcategories];
  }

  getDifficulties(): string[] {
    this.ensureLoaded();
    return [...this.difficulties];
  }

  getAvailableCount(categories: string[], difficulty: Difficulty): number {
    this.ensureLoaded();
    if (!this.index) return 0;
    return this.getQuestionsByCategories(categories).filter(q =>
      difficulty === 'mixed' || q.difficulty === difficulty
    ).length;
  }

  getQuestionsByCategories(categories: string[]): Question[] {
    this.ensureLoaded();
    if (!this.index) return [];
    const useAll = categories.includes('Tudo misturado');
    if (useAll) return [...this.index.allQuestions];
    const result: Question[] = [];
    for (const cat of categories) {
      const qs = this.index.byCategory.get(cat);
      if (qs) result.push(...qs);
    }
    return result;
  }

  selectQuestions(
    categories: string[],
    difficulty: Difficulty,
    count: number,
    usedIds?: Set<string>,
  ): Question[] {
    this.ensureLoaded();
    let pool = this.getQuestionsByCategories(categories);

    if (difficulty !== 'mixed') {
      pool = pool.filter(q => q.difficulty === difficulty);
    }

    if (usedIds && usedIds.size > 0) {
      pool = pool.filter(q => !usedIds.has(q.id));
    }

    return this.balancedSelect(pool, count, categories, difficulty);
  }

  private balancedSelect(
    pool: Question[],
    count: number,
    categories: string[],
    difficulty: Difficulty,
  ): Question[] {
    if (pool.length <= count) {
      return this.shuffle([...pool]);
    }

    const useAll = categories.includes('Tudo misturado');
    if (useAll) {
      return this.balancedByCategory(pool, count);
    }

    return this.shuffle([...pool]).slice(0, count);
  }

  private balancedByCategory(pool: Question[], count: number): Question[] {
    const byCategory = new Map<string, Question[]>();
    for (const q of pool) {
      const cat = q.category || 'Outros';
      const arr = byCategory.get(cat) || [];
      arr.push(q);
      byCategory.set(cat, arr);
    }

    const categories = Array.from(byCategory.entries());
    categories.sort((a, b) => b[1].length - a[1].length);

    const result: Question[] = [];
    let round = 0;

    while (result.length < count) {
      let added = false;
      for (const [cat, questions] of categories) {
        if (result.length >= count) break;
        const available = questions.filter(q => !result.includes(q));
        if (available.length > 0) {
          const pick = available[Math.min(round, available.length - 1)];
          result.push(pick);
          added = true;
        }
      }
      if (!added) break;
      round++;
    }

    return result.slice(0, count);
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  shuffleAlternatives(question: Question): { alternatives: string[]; correctIndex: number } {
    if (!question.alternatives || question.alternatives.length === 0) {
      return { alternatives: [], correctIndex: -1 };
    }

    const indexed = question.alternatives.map((alt, i) => ({ alt, originalIndex: i }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }

    const alternatives = indexed.map(x => x.alt);
    const originalCorrect = question.correctAlternativeIndex ?? 0;
    const correctIndex = indexed.findIndex(x => x.originalIndex === originalCorrect);

    return { alternatives, correctIndex };
  }

  getTotalLoaded(): number {
    this.ensureLoaded();
    return this.questions.length;
  }

  getQuestionById(id: string): Question | null {
    this.ensureLoaded();
    return this.index?.byId.get(id) ?? null;
  }

  getSourcePath(): string {
    return OFFICIAL_QUESTIONS_PATH;
  }
}

export const questionManager = new QuestionManager();
