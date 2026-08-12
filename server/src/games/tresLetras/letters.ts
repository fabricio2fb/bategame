export interface WeightedLetter {
  letter: string;
  weight: number;
  kind: 'vowel' | 'common-consonant' | 'rare-consonant';
}

export interface TresLetrasAnswerInput {
  id: string;
  playerId?: string;
  text: string;
}

export interface TresLetrasRepeatCheckResult extends TresLetrasAnswerInput {
  normalizedText: string;
  repeated: boolean;
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const RARE_CONSONANTS = new Set(['K', 'W', 'Y', 'X', 'Z', 'J']);

export const PORTUGUESE_WEIGHTED_LETTERS: WeightedLetter[] = [
  { letter: 'A', weight: 14.63, kind: 'vowel' },
  { letter: 'E', weight: 12.57, kind: 'vowel' },
  { letter: 'O', weight: 10.73, kind: 'vowel' },
  { letter: 'S', weight: 7.81, kind: 'common-consonant' },
  { letter: 'R', weight: 6.53, kind: 'common-consonant' },
  { letter: 'I', weight: 6.18, kind: 'vowel' },
  { letter: 'N', weight: 5.05, kind: 'common-consonant' },
  { letter: 'D', weight: 4.99, kind: 'common-consonant' },
  { letter: 'M', weight: 4.74, kind: 'common-consonant' },
  { letter: 'U', weight: 4.63, kind: 'vowel' },
  { letter: 'T', weight: 4.34, kind: 'common-consonant' },
  { letter: 'C', weight: 3.88, kind: 'common-consonant' },
  { letter: 'L', weight: 2.78, kind: 'common-consonant' },
  { letter: 'P', weight: 2.52, kind: 'common-consonant' },
  { letter: 'V', weight: 1.67, kind: 'common-consonant' },
  { letter: 'G', weight: 1.30, kind: 'common-consonant' },
  { letter: 'H', weight: 1.28, kind: 'common-consonant' },
  { letter: 'B', weight: 1.04, kind: 'common-consonant' },
  { letter: 'F', weight: 1.02, kind: 'common-consonant' },
  { letter: 'Q', weight: 1.20, kind: 'common-consonant' },
  { letter: 'Z', weight: 0.47, kind: 'rare-consonant' },
  { letter: 'J', weight: 0.40, kind: 'rare-consonant' },
  { letter: 'X', weight: 0.21, kind: 'rare-consonant' },
  { letter: 'K', weight: 0.02, kind: 'rare-consonant' },
  { letter: 'W', weight: 0.01, kind: 'rare-consonant' },
  { letter: 'Y', weight: 0.01, kind: 'rare-consonant' },
];

export function drawTresLetras(random: () => number = Math.random): string[] {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const letters = drawUniqueWeightedLetters(3, random);
    if (isPlayableLetterSet(letters)) return letters;
  }

  return ['A', 'S', 'R'];
}

export function normalizeTresLetrasAnswer(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeTresLetrasCombination(value: string): string[] {
  const letters = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^\p{L}]/gu, '')
    .split('');

  return letters;
}

export function isValidTresLetrasCombination(letters: string[]): boolean {
  return letters.length === 3 && new Set(letters).size === 3 && isPlayableLetterSet(letters);
}

export function markRepeatedTresLetrasAnswers(
  answers: TresLetrasAnswerInput[]
): TresLetrasRepeatCheckResult[] {
  const normalizedCounts = new Map<string, number>();
  const normalizedById = new Map<string, string>();

  for (const answer of answers) {
    const normalizedText = normalizeTresLetrasAnswer(answer.text);
    normalizedById.set(answer.id, normalizedText);
    if (!normalizedText) continue;
    normalizedCounts.set(normalizedText, (normalizedCounts.get(normalizedText) || 0) + 1);
  }

  return answers.map((answer) => {
    const normalizedText = normalizedById.get(answer.id) || '';
    return {
      ...answer,
      normalizedText,
      repeated: !!normalizedText && (normalizedCounts.get(normalizedText) || 0) > 1,
    };
  });
}

function drawUniqueWeightedLetters(count: number, random: () => number): string[] {
  const pool = [...PORTUGUESE_WEIGHTED_LETTERS];
  const selected: string[] = [];

  while (selected.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let target = random() * totalWeight;
    const index = pool.findIndex((entry) => {
      target -= entry.weight;
      return target <= 0;
    });
    const pickedIndex = index >= 0 ? index : pool.length - 1;
    const [picked] = pool.splice(pickedIndex, 1);
    selected.push(picked.letter);
  }

  return selected;
}

function isPlayableLetterSet(letters: string[]): boolean {
  const vowelCount = letters.filter((letter) => VOWELS.has(letter)).length;
  const rareCount = letters.filter((letter) => RARE_CONSONANTS.has(letter)).length;

  if (letters.length !== 3) return false;
  if (vowelCount < 1) return false;
  if (rareCount > 1) return false;

  return true;
}
