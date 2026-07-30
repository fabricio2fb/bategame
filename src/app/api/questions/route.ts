import { NextResponse } from 'next/server';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

const RELEASE_QUESTIONS_TOTAL = 11290;
const RELEASE_QUESTIONS_PATH = join(process.cwd(), 'data', 'release', 'questions-release.json');
const REPORTS_PATH = join(process.cwd(), 'data', 'reports', 'question-problems.jsonl');
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const REPORT_REASONS = new Set([
  'resposta incorreta',
  'pergunta ambígua',
  'erro de português',
  'pergunta repetida',
  'outro',
]);

interface RawQuestion {
  id: string;
  category: string;
  subcategory?: string;
  difficulty: string;
  question?: string;
  text?: string;
  alternatives: string[];
  correctAlternativeIndex: number;
  correctAnswer: string;
  explanation?: string;
}

interface PublicQuestion {
  id: string;
  text: string;
  question: string;
  category: string;
  subcategory?: string;
  difficulty: string;
  answerType: 'multiple-choice';
  alternatives: string[];
  timeLimitSeconds: number;
}

let questionsCache: RawQuestion[] | null = null;
let byIdCache: Map<string, RawQuestion> | null = null;

function failQuestion(id: string, message: string): never {
  throw new Error(`[API /api/questions] Invalid release question ${id || '(missing id)'}: ${message}`);
}

function validateReleaseQuestions(raw: RawQuestion[]): void {
  if (!Array.isArray(raw)) throw new Error('[API /api/questions] Release file must be a JSON array.');
  if (raw.length !== RELEASE_QUESTIONS_TOTAL) {
    throw new Error(`[API /api/questions] Expected ${RELEASE_QUESTIONS_TOTAL} questions, found ${raw.length}.`);
  }

  const ids = new Set<string>();
  for (const q of raw) {
    if (!q.id || typeof q.id !== 'string') failQuestion('', 'id is required');
    if (ids.has(q.id)) failQuestion(q.id, 'duplicate id');
    ids.add(q.id);
    const text = q.question || q.text;
    if (!text || typeof text !== 'string' || text.trim().length === 0) failQuestion(q.id, 'question is required');
    if (!q.category || typeof q.category !== 'string' || q.category.trim().length === 0) failQuestion(q.id, 'category is required');
    if (!VALID_DIFFICULTIES.has(q.difficulty)) failQuestion(q.id, `invalid difficulty: ${q.difficulty}`);
    if (!Array.isArray(q.alternatives) || q.alternatives.length !== 4) failQuestion(q.id, 'exactly 4 alternatives are required');
    if (q.alternatives.some(a => typeof a !== 'string' || a.trim().length === 0)) failQuestion(q.id, 'alternatives cannot be empty');
    if (!Number.isInteger(q.correctAlternativeIndex) || q.correctAlternativeIndex < 0 || q.correctAlternativeIndex > 3) {
      failQuestion(q.id, `correctAlternativeIndex out of range: ${q.correctAlternativeIndex}`);
    }
    if (!q.correctAnswer || q.alternatives[q.correctAlternativeIndex] !== q.correctAnswer) {
      failQuestion(q.id, 'correctAnswer does not match correctAlternativeIndex');
    }
  }
}

function loadQuestions(): RawQuestion[] {
  if (questionsCache) return questionsCache;
  if (!existsSync(RELEASE_QUESTIONS_PATH)) {
    throw new Error(`[API /api/questions] Release question bank not found: ${RELEASE_QUESTIONS_PATH}`);
  }
  const raw = JSON.parse(readFileSync(RELEASE_QUESTIONS_PATH, 'utf-8')) as RawQuestion[];
  validateReleaseQuestions(raw);
  questionsCache = raw;
  byIdCache = new Map(raw.map(q => [q.id, q]));
  return questionsCache;
}

function toPublicQuestion(q: RawQuestion): PublicQuestion {
  const text = q.question || q.text || '';
  return {
    id: q.id,
    text,
    question: text,
    category: q.category,
    subcategory: q.subcategory,
    difficulty: q.difficulty,
    answerType: 'multiple-choice',
    alternatives: q.alternatives,
    timeLimitSeconds: 15,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getQuestion(id: string): RawQuestion | null {
  loadQuestions();
  return byIdCache?.get(id) ?? null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoriesParam = searchParams.get('categories') || 'Tudo misturado';
    const difficulty = searchParams.get('difficulty') || 'mixed';
    const countParam = parseInt(searchParams.get('count') || '15', 10);
    const count = Math.min(Math.max(countParam, 1), 50);
    const exclude = new Set((searchParams.get('exclude') || '').split(',').map(s => s.trim()).filter(Boolean));

    const categories = categoriesParam.split(',').map(s => s.trim()).filter(Boolean);
    const useAll = categories.includes('Tudo misturado');

    let filtered = useAll
      ? loadQuestions()
      : loadQuestions().filter(q => categories.includes(q.category));

    if (difficulty !== 'mixed') {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }

    if (exclude.size > 0) {
      filtered = filtered.filter(q => !exclude.has(q.id));
    }

    const selected = shuffle(filtered).slice(0, count).map(toPublicQuestion);
    return NextResponse.json({ questions: selected, total: selected.length, available: filtered.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Question bank error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body?.action === 'report') {
      const reason = String(body.reason || '').trim();
      if (!body.questionId || !REPORT_REASONS.has(reason)) {
        return NextResponse.json({ success: false, error: 'Dados do relatório inválidos.' }, { status: 400 });
      }
      const report = {
        questionId: String(body.questionId),
        reason,
        date: new Date().toISOString(),
        mode: String(body.mode || 'couch'),
        category: body.category ? String(body.category) : undefined,
        difficulty: body.difficulty ? String(body.difficulty) : undefined,
      };
      mkdirSync(dirname(REPORTS_PATH), { recursive: true });
      appendFileSync(REPORTS_PATH, `${JSON.stringify(report)}\n`, 'utf-8');
      return NextResponse.json({ success: true });
    }

    const question = getQuestion(String(body?.questionId || ''));
    if (!question) return NextResponse.json({ success: false, error: 'Pergunta não encontrada.' }, { status: 404 });

    const selectedAnswer = typeof body?.selectedAnswer === 'string' ? body.selectedAnswer : '';
    const isCorrect = selectedAnswer.length > 0 && selectedAnswer === question.correctAnswer;
    return NextResponse.json({
      success: true,
      isCorrect,
      correctAlternativeIndex: question.correctAlternativeIndex,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Erro interno.' }, { status: 500 });
  }
}
