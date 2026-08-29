import { questionManager } from '../src/QuestionManager';
import { gameManager } from '../src/GameManager';
import { roomManager } from '../src/RoomManager';
import { GameRoom, Question } from '../src/types';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

const PROJECT_ROOT = resolve(__dirname, '..', '..');

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string): void {
  if (condition) {
    console.log(`  ok - ${name}`);
    passed++;
  } else {
    console.error(`  fail - ${name}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

function describe(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  fn();
}

function createTestRoom(overrides?: Partial<any>): GameRoom {
  const code = `T${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return roomManager.createRoom(code, 'Test Room', 'host-1', {
    gameMode: 'classic',
    questionSource: 'official',
    answerMode: 'multiple-choice',
    questionCount: 15,
    difficulty: 'mixed',
    categories: ['Tudo misturado'],
    maxPlayers: 8,
    answerTimeSeconds: 15,
    privacy: 'public',
    wrongAnswerPenalty: 0,
    allowRebound: true,
    ...overrides,
  });
}

describe('SECURITY 1. Public JSON with answers does not exist', () => {
  const publicPath = join(PROJECT_ROOT, 'public', 'data', 'questions', 'questions-release.json');
  assert(!existsSync(publicPath), 'Release bank is not under public/');
});

describe('SECURITY 2. Official release JSON exists in the project', () => {
  const releasePath = join(PROJECT_ROOT, 'data', 'release', 'questions-release.json');
  assert(existsSync(releasePath), 'data/release/questions-release.json exists');
});

describe('SECURITY 3. Sanitized question does not expose answers or alternatives', () => {
  const { sanitizeQuestion } = require('../src/types');
  const question: Question = {
    id: 'test-1',
    text: 'What is 2+2?',
    answerType: 'multiple-choice',
    category: 'Math',
    difficulty: 'easy',
    alternatives: ['3', '4', '5', '6'],
    correctAlternativeIndex: 1,
    correctAnswer: '4',
    explanation: 'Basic arithmetic',
    acceptedAnswers: ['4', 'four'],
    strictness: 'normalized',
    timeLimitSeconds: 15,
  };
  const sanitized = sanitizeQuestion(question);
  assert(!('correctAnswer' in sanitized), 'correctAnswer hidden');
  assert(!('correctAlternativeIndex' in sanitized), 'correctAlternativeIndex hidden');
  assert(!('explanation' in sanitized), 'explanation hidden');
  assert(!('validation' in sanitized), 'validation hidden');
  assert(!('review' in sanitized), 'review hidden');
  assert(!('productionRevision' in sanitized), 'productionRevision hidden');
  assert(!('repairActions' in sanitized), 'repairActions hidden');
  assert(!('futureImprovementIssues' in sanitized), 'futureImprovementIssues hidden');
  assert(!('alternatives' in sanitized), 'alternatives not embedded in public state');
  assert(sanitized.id === 'test-1', 'id preserved');
  assert(sanitized.question === 'What is 2+2?', 'question text preserved');
});

describe('LOADING 1. Release JSON loads the prepared mixed bank', () => {
  questionManager.loadAll();
  const total = questionManager.getTotalLoaded();
  assert(total === 6530, `Loaded ${total} questions`);
});

describe('LOADING 2. IDs are unique', () => {
  const questions = questionManager.selectQuestions(['Tudo misturado'], 'mixed', 6530);
  const ids = questions.map(q => q.id);
  assert(new Set(ids).size === ids.length, `Unique ${new Set(ids).size}/${ids.length}`);
});

describe('LOADING 3. Categories are available and difficulty is not used for selection', () => {
  const cats = questionManager.getCategories();
  const diffs = questionManager.getDifficulties();
  assert(cats.includes('Literatura'), 'Has Literatura');
  assert(cats.includes('Música'), 'Has Música');
  assert(diffs.length === 1 && diffs.includes('medium'), `Internal difficulty metadata: ${diffs.join(', ')}`);
});

describe('VALIDATION 1. Exactly four alternatives', () => {
  const questions = questionManager.selectQuestions(['Tudo misturado'], 'mixed', 250);
  assert(questions.every(q => q.alternatives?.length === 4), `All ${questions.length} sampled questions have 4 alternatives`);
});

describe('VALIDATION 2. correctAnswer matches correctAlternativeIndex', () => {
  const questions = questionManager.selectQuestions(['Tudo misturado'], 'mixed', 6530);
  const mismatches = questions.filter(q => q.alternatives?.[q.correctAlternativeIndex ?? -1] !== q.correctAnswer);
  assert(mismatches.length === 0, `Mismatches: ${mismatches.slice(0, 3).map(q => q.id).join(', ')}`);
});

describe('VALIDATION 3. Portuguese UTF-8 text is preserved', () => {
  const questions = questionManager.selectQuestions(['Tudo misturado'], 'mixed', 6530);
  const hasAccented = questions.some(q => /[áàâãéêíóôõúç]/i.test(q.text));
  const hasReplacement = questions.some(q => q.text.includes('\uFFFD'));
  assert(hasAccented, 'At least one question contains accented characters');
  assert(!hasReplacement, 'No replacement character found');
});

describe('SHUFFLE 1. Alternatives and correct index remain consistent', () => {
  const q = questionManager.selectQuestions(['Tudo misturado'], 'mixed', 1)[0];
  const { alternatives, correctIndex } = questionManager.shuffleAlternatives(q);
  assert(alternatives.length === 4, 'Shuffled alternatives length is 4');
  assert(correctIndex >= 0 && correctIndex < 4, `Correct index ${correctIndex} in range`);
  assert(alternatives[correctIndex] === q.correctAnswer, 'Correct answer preserved after shuffle');
});

describe('SELECTION 1. Room does not repeat questions', () => {
  const room = createTestRoom({ questionCount: 10 });
  const result = gameManager.selectQuestions(room);
  assert(result.success === true, 'Selection succeeded');
  const ids = room.selectedQuestions.map(q => q.id);
  assert(new Set(ids).size === ids.length, `No duplicates: ${new Set(ids).size}/${ids.length}`);
});

describe('SELECTION 2. Category filter works', () => {
  const questions = questionManager.selectQuestions(['Literatura'], 'mixed', 10);
  assert(questions.length > 0, 'Questions returned');
  assert(questions.every(q => q.category === 'Literatura'), `All ${questions.length} questions are Literatura`);
});

describe('SELECTION 3. All difficulty labels are mixed', () => {
  const questions = questionManager.selectQuestions(['Tudo misturado'], 'easy', 10);
  assert(questions.length === 10, 'Questions returned from mixed pool');
  assert(questions.every(q => q.difficulty === 'medium'), `Mixed pool returned ${questions.length} questions`);
});

describe('SELECTION 4. Missing category returns empty safely', () => {
  const questions = questionManager.selectQuestions(['Categoria Inexistente'], 'mixed', 10);
  assert(questions.length === 0, 'Unknown category returns empty list');
});

describe('SELECTION 5. Small remaining pool works', () => {
  const first = questionManager.selectQuestions(['Literatura'], 'hard', 3);
  const used = new Set(first.slice(0, Math.max(0, first.length - 1)).map(q => q.id));
  const remaining = questionManager.selectQuestions(['Literatura'], 'hard', 3, used);
  assert(remaining.every(q => !used.has(q.id)), 'Used ids are excluded from reduced pool');
});

describe('ISOLATION 1. Two rooms have separate histories', () => {
  const room1 = createTestRoom({ questionCount: 10 });
  const room2 = createTestRoom({ questionCount: 10 });
  gameManager.selectQuestions(room1);
  gameManager.selectQuestions(room2);
  assert(room1.usedQuestionIds.size === 10, 'Room 1 history has 10 ids');
  assert(room2.usedQuestionIds.size === 10, 'Room 2 history has 10 ids');
  gameManager.resetHistory(room1);
  assert(room1.usedQuestionIds.size === 0, 'Room 1 history cleared');
  assert(room2.usedQuestionIds.size === 10, 'Room 2 history preserved');
});

describe('PUBLIC PAYLOAD 1. Answering player gets private alternatives only', () => {
  const room = createTestRoom({ questionCount: 1 });
  const host = { id: 'host-1', token: 't', socketId: 's', name: 'Host', score: 0, isHost: true, isReady: false, isConnected: true, joinedAt: Date.now() };
  roomManager.addPlayer(room, host);
  const result = gameManager.selectQuestions(room);
  assert(result.success === true, 'Selection succeeded');
  room.status = 'answering';
  room.currentBuzzerWinnerId = host.id;
  const payload = gameManager.getQuestionForPlayer(room, host.id);
  assert(payload.question !== null, 'Safe question exists');
  assert(!('correctAnswer' in payload.question!), 'correctAnswer hidden before end');
  assert(!('correctAlternativeIndex' in payload.question!), 'correctAlternativeIndex hidden before end');
  assert(!('explanation' in payload.question!), 'explanation hidden before end');
  assert(!('alternatives' in payload.question!), 'Bank alternatives are not embedded in safe question');
  assert(payload.alternatives?.length === 4, 'Private alternatives are sent to current player');
});

describe('PUBLIC PAYLOAD 2. Full state never sends correct answer', () => {
  const room = createTestRoom({ questionCount: 1 });
  gameManager.selectQuestions(room);
  room.status = 'buzzer-open';
  const state = gameManager.getFullGameState(room);
  const json = JSON.stringify(state);
  assert(!json.includes('correctAnswer'), 'correctAnswer absent from game state');
  assert(!json.includes('correctAlternativeIndex'), 'correctAlternativeIndex absent from game state');
  assert(!json.includes('futureImprovementIssues'), 'futureImprovementIssues absent from game state');
});

console.log(`\n========================================`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

process.exit(failed > 0 ? 1 : 0);
