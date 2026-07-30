#!/usr/bin/env node

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

const GENERATOR_DIR = process.env.BATEU_GENERATOR_DIR || resolve(ROOT, '..', 'bateu-question-generator');
const SERVER_QUESTIONS_DIR = join(ROOT, 'server', 'data', 'questions');
const PUBLIC_QUESTIONS_DIR = join(ROOT, 'public', 'data', 'questions');
const QUESTIONS_FILE = 'questions-approved.json';

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { file: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      result.file = args[++i];
    } else if (args[i].startsWith('--file=')) {
      result.file = args[i].split('=')[1];
    }
  }
  const envArgs = process.env.BATEU_ARGS || '';
  if (envArgs.includes('--file=')) {
    const match = envArgs.match(/--file="?([^"]+)"?/);
    if (match) result.file = match[1];
  }
  return result;
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[,;:!?.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateQuestion(q, index) {
  const errors = [];
  if (!q.id || typeof q.id !== 'string') errors.push('missing id');
  if (!q.category || typeof q.category !== 'string') errors.push('missing category');
  if (!q.subcategory || typeof q.subcategory !== 'string') errors.push('missing subcategory');
  if (!['easy', 'medium', 'hard'].includes(q.difficulty)) errors.push(`invalid difficulty: ${q.difficulty}`);
  const questionText = q.question || q.text;
  if (!questionText || typeof questionText !== 'string' || questionText.length < 10) errors.push('question too short');
  if (!Array.isArray(q.alternatives) || q.alternatives.length !== 4) errors.push(`expected 4 alternatives, got ${q.alternatives?.length}`);
  if (q.alternatives?.some(a => !a || typeof a !== 'string' || a.trim().length === 0)) errors.push('empty alternatives');
  if (typeof q.correctAlternativeIndex !== 'number' || q.correctAlternativeIndex < 0 || q.correctAlternativeIndex > 3) errors.push('invalid correctAlternativeIndex');
  const correctAnswer = q.correctAnswer || (q.alternatives && q.alternatives[q.correctAlternativeIndex]);
  if (!correctAnswer) errors.push('missing correctAnswer and cannot derive from index');
  if (correctAnswer && q.alternatives && q.correctAlternativeIndex !== undefined) {
    if (q.alternatives[q.correctAlternativeIndex] !== correctAnswer) {
      errors.push('correctAnswer does not match alternatives[correctAlternativeIndex]');
    }
  }
  const alts = q.alternatives || [];
  if (alts.length === 4) {
    const unique = new Set(alts.map(a => normalizeText(a)));
    if (unique.size < 4) errors.push('duplicate alternatives after normalization');
  }
  if (questionText && questionText.includes('\uFFFD')) errors.push('replacement character in question');
  return errors;
}

function removeDups(questions) {
  const seen = new Map();
  const factKeySeen = new Set();
  const textSeen = new Set();
  const duplicates = [];

  for (const q of questions) {
    if (seen.has(q.id)) { duplicates.push({ id: q.id, reason: 'duplicate id' }); continue; }
    if (q.factKey && factKeySeen.has(q.factKey)) { duplicates.push({ id: q.id, reason: 'duplicate factKey' }); continue; }
    const normText = normalizeText(q.question);
    if (textSeen.has(normText)) { duplicates.push({ id: q.id, reason: 'duplicate text' }); continue; }
    seen.set(q.id, q);
    if (q.factKey) factKeySeen.add(q.factKey);
    textSeen.add(normText);
  }
  return { unique: Array.from(seen.values()), duplicates };
}

function findLatestExport() {
  const allFile = join(GENERATOR_DIR, 'data', 'exports', 'questions-all.json');
  if (existsSync(allFile)) {
    console.log('  Found questions-all.json (full export)');
    return allFile;
  }

  const gameFile = join(GENERATOR_DIR, 'data', 'exports', 'bateu-game-questions.json');
  if (existsSync(gameFile)) {
    console.log('  Found bateu-game-questions.json (game export, will derive correctAnswer)');
    return gameFile;
  }

  const approvedFile = join(GENERATOR_DIR, 'data', 'approved', 'questions.json');
  if (existsSync(approvedFile)) {
    console.log('  Found approved questions directly (no export found)');
    return approvedFile;
  }

  return null;
}

function backupExisting(dir) {
  const file = join(dir, QUESTIONS_FILE);
  if (!existsSync(file)) return;
  const backup = join(dir, `questions-approved-backup-${Date.now()}.json`);
  copyFileSync(file, backup);
  console.log(`  Backup: ${backup}`);
}

function main() {
  const args = parseArgs();
  console.log('\n========================================');
  console.log('  BatePrimeiro - Question Sync');
  console.log('========================================\n');

  let sourceFile = args.file;
  if (!sourceFile) {
    sourceFile = findLatestExport();
  }

  if (!sourceFile) {
    console.error('ERROR: No question file found.');
    console.error('  Run export in generator: npm run questions:export');
    console.error('  Or specify: --file="CAMINHO_DO_JSON"');
    process.exit(1);
  }

  console.log(`Source: ${sourceFile}`);
  if (!existsSync(sourceFile)) {
    console.error(`ERROR: File not found: ${sourceFile}`);
    process.exit(1);
  }

  const raw = readFileSync(sourceFile, 'utf-8');
  console.log(`  File size: ${(Buffer.byteLength(raw) / 1024).toFixed(1)} KB`);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`ERROR: Invalid JSON: ${e.message}`);
    process.exit(1);
  }

  let questions;
  if (Array.isArray(parsed)) {
    questions = parsed;
  } else if (parsed.questions && Array.isArray(parsed.questions)) {
    questions = parsed.questions;
  } else {
    console.error('ERROR: Could not find questions array in JSON');
    process.exit(1);
  }

  console.log(`  Total in file: ${questions.length}`);

  const valid = [];
  const invalid = [];
  for (let i = 0; i < questions.length; i++) {
    const errors = validateQuestion(questions[i], i);
    if (errors.length === 0) {
      valid.push(questions[i]);
    } else {
      invalid.push({ index: i, id: questions[i].id, errors });
    }
  }

  console.log(`  Valid: ${valid.length}`);
  console.log(`  Invalid: ${invalid.length}`);

  if (invalid.length > 0 && invalid.length <= 20) {
    for (const inv of invalid) {
      console.log(`    [${inv.index}] ${inv.id}: ${inv.errors.join(', ')}`);
    }
  }

  const { unique, duplicates } = removeDups(valid);
  console.log(`  After dedup: ${unique.length}`);
  console.log(`  Duplicates removed: ${duplicates.length}`);

  const byCategory = {};
  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  for (const q of unique) {
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
  }

  console.log('\n  Categories:');
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats) {
    console.log(`    ${cat}: ${count}`);
  }

  console.log('\n  Difficulty:');
  console.log(`    easy: ${byDifficulty.easy}`);
  console.log(`    medium: ${byDifficulty.medium}`);
  console.log(`    hard: ${byDifficulty.hard}`);

  const normalizedQuestions = unique.map(q => ({
    id: q.id,
    text: q.question,
    category: q.category,
    subcategory: q.subcategory,
    difficulty: q.difficulty,
    answerType: 'multiple-choice',
    alternatives: q.alternatives,
    correctAlternativeIndex: q.correctAlternativeIndex,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    acceptedAnswers: q.alternatives || [],
    strictness: 'normalized',
    timeLimitSeconds: 15,
  }));

  const output = JSON.stringify(normalizedQuestions, null, 2);
  const outputSize = Buffer.byteLength(output, 'utf-8');

  backupExisting(SERVER_QUESTIONS_DIR);
  backupExisting(PUBLIC_QUESTIONS_DIR);

  if (!existsSync(SERVER_QUESTIONS_DIR)) mkdirSync(SERVER_QUESTIONS_DIR, { recursive: true });
  if (!existsSync(PUBLIC_QUESTIONS_DIR)) mkdirSync(PUBLIC_QUESTIONS_DIR, { recursive: true });

  const serverFile = join(SERVER_QUESTIONS_DIR, QUESTIONS_FILE);
  const publicFile = join(PUBLIC_QUESTIONS_DIR, QUESTIONS_FILE);

  writeFileSync(serverFile, output, 'utf-8');
  writeFileSync(publicFile, output, 'utf-8');

  console.log(`\n  Output: ${QUESTIONS_FILE}`);
  console.log(`  Server: ${serverFile}`);
  console.log(`  Public: ${publicFile}`);
  console.log(`  Output size: ${(outputSize / 1024).toFixed(1)} KB`);
  console.log(`  Questions exported: ${normalizedQuestions.length}`);

  console.log('\n========================================');
  console.log('  Sync complete!');
  console.log('========================================\n');
}

main();
