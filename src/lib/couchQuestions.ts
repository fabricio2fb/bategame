import { AnswerType, Difficulty } from './types';

export interface CouchQuestion {
  id: string;
  text: string;
  answerType: AnswerType;
  category?: string;
  subcategory?: string;
  difficulty?: Difficulty;
  alternatives?: string[];
  correctAnswer?: string;
  acceptedAnswers?: string[];
  strictness?: 'exact' | 'normalized' | 'tolerant';
  timeLimitSeconds: number;
  isOfficial?: boolean;
}

function migrateQuestion(raw: any): CouchQuestion {
  const answerType: AnswerType =
    raw.answerType || (raw.type === 'spoken' ? 'spoken' : 'multiple-choice');

  const text = raw.text || raw.question || '';
  let correctAnswer = raw.correctAnswer;
  if (!correctAnswer && raw.alternatives && raw.correctAlternativeIndex !== undefined) {
    correctAnswer = raw.alternatives[raw.correctAlternativeIndex];
  }

  return {
    id: raw.id || Math.random().toString(36).slice(2),
    text,
    answerType,
    category: raw.category,
    subcategory: raw.subcategory,
    difficulty: raw.difficulty,
    alternatives: raw.alternatives || [],
    correctAnswer,
    acceptedAnswers: raw.acceptedAnswers || raw.alternatives || [],
    strictness: raw.strictness || 'normalized',
    timeLimitSeconds: raw.timeLimitSeconds || 30,
    isOfficial: !correctAnswer,
  };
}

let categoriesCache: string[] | null = null;

export async function getAvailableCategories(): Promise<string[]> {
  if (categoriesCache) return categoriesCache;

  categoriesCache = [
    'Animais', 'Animes e Mangás', 'Carros e Motos', 'Celebridades e Famosos',
    'Ciências', 'Conhecimentos Gerais', 'Curiosidades', 'Direito',
    'Economia e Negócios', 'Engenharia', 'Filmes', 'Futebol', 'Gastronomia',
    'Geografia', 'História', 'Internet e Redes Sociais', 'Jogos', 'Literatura',
    'Marcas e Empresas', 'Matemática', 'Medicina e Saúde',
    'Memes e Cultura da Internet', 'Música', 'Natureza', 'Outros Esportes',
    'Política e Atualidades', 'Religiões e Mitologia', 'Séries', 'Tecnologia',
    'Viagens e Turismo',
  ];
  return categoriesCache;
}

export async function loadQuestionsByCategories(
  categories: string[],
  difficulty: Difficulty = 'mixed',
  count: number = 15,
  usedIds?: Set<string>,
): Promise<CouchQuestion[]> {
  const params = new URLSearchParams({
    categories: categories.join(','),
    difficulty,
    count: String(count),
  });
  if (usedIds && usedIds.size > 0) {
    params.set('exclude', Array.from(usedIds).join(','));
  }

  try {
    const res = await fetch(`/api/questions?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.questions && Array.isArray(data.questions)) {
      return data.questions.map((q: any) => ({ ...migrateQuestion(q), isOfficial: true }));
    }
    throw new Error('Invalid response format');
  } catch {
    console.warn('[couchQuestions] Failed to load from API, falling back to empty');
    return [];
  }
}

function balancedByCategory(pool: CouchQuestion[], count: number): CouchQuestion[] {
  const byCategory = new Map<string, CouchQuestion[]>();
  for (const q of pool) {
    const cat = q.category || 'Outros';
    const arr = byCategory.get(cat) || [];
    arr.push(q);
    byCategory.set(cat, arr);
  }

  const categories = Array.from(byCategory.entries());
  categories.sort((a, b) => b[1].length - a[1].length);

  const result: CouchQuestion[] = [];
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

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleAlternatives(question: CouchQuestion): { alternatives: string[]; correctIndex: number } {
  if (!question.alternatives || question.alternatives.length === 0) {
    return { alternatives: [], correctIndex: -1 };
  }

  const indexed = question.alternatives.map((alt, i) => ({ alt, originalIndex: i }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  const alternatives = indexed.map(x => x.alt);
  const originalCorrect = question.correctAnswer ? question.alternatives.indexOf(question.correctAnswer) : -1;
  const correctIndex = indexed.findIndex(x => x.originalIndex === originalCorrect);

  return { alternatives, correctIndex: correctIndex >= 0 ? correctIndex : 0 };
}

export async function validateOfficialQuestionAnswer(questionId: string, selectedAnswer: string): Promise<{
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}> {
  const res = await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, selectedAnswer }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return {
    isCorrect: !!data.isCorrect,
    correctAnswer: data.correctAnswer || '',
    explanation: data.explanation || '',
  };
}

export async function reportOfficialQuestionProblem(data: {
  questionId: string;
  reason: string;
  mode: string;
  category?: string;
  difficulty?: string;
}): Promise<void> {
  await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'report', ...data }),
  });
}

export function loadCustomQuizFromStorage(): CouchQuestion[] | null {
  try {
    const raw = localStorage.getItem('bateu_quiz_draft');
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft.questions || !Array.isArray(draft.questions)) return null;
    return draft.questions.map((q: any) => ({
      id: q.id || Math.random().toString(36).slice(2),
      text: q.text || '',
      answerType: (q.answerType || 'multiple-choice') as AnswerType,
      category: q.category || 'Personalizado',
      alternatives: (q.alternatives || []).filter(Boolean),
      correctAnswer: q.correctAnswer || '',
      acceptedAnswers: q.acceptedAnswers || [],
      strictness: (q.strictness || 'normalized') as 'exact' | 'normalized' | 'tolerant',
      timeLimitSeconds: q.timeLimitSeconds || 30,
    }));
  } catch {
    return null;
  }
}
