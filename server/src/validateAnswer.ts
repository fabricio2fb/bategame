function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeText(str: string): string {
  let s = str.trim().toLowerCase();
  s = removeAccents(s);
  s = s.replace(/[^\w\s\d]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  const matrix: number[][] = [];
  for (let i = 0; i <= la; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lb; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[la][lb];
}

export function validateWrittenAnswer(
  submittedAnswer: string,
  correctAnswer: string,
  acceptedAnswers: string[] = [],
  strictness: 'exact' | 'normalized' | 'tolerant' = 'normalized',
): { isCorrect: boolean; matchedAnswer?: string } {
  const normalizedSubmitted = normalizeText(submittedAnswer);
  if (!normalizedSubmitted) {
    return { isCorrect: false };
  }

  const normalizedCorrect = normalizeText(correctAnswer);
  const allAccepted = [normalizedCorrect, ...acceptedAnswers.map(a => normalizeText(a))];

  if (strictness === 'exact') {
    const match = allAccepted.find(a => a === normalizedSubmitted);
    return match ? { isCorrect: true, matchedAnswer: correctAnswer } : { isCorrect: false };
  }

  if (strictness === 'normalized') {
    const match = allAccepted.find(a => a === normalizedSubmitted);
    return match ? { isCorrect: true, matchedAnswer: correctAnswer } : { isCorrect: false };
  }

  // tolerant
  const match = allAccepted.find(a => a === normalizedSubmitted);
  if (match) return { isCorrect: true, matchedAnswer: correctAnswer };

  for (const accepted of allAccepted) {
    if (accepted.length <= 4) continue;
    const maxDist = accepted.length <= 8 ? 1 : 2;
    if (levenshtein(normalizedSubmitted, accepted) <= maxDist) {
      return { isCorrect: true, matchedAnswer: correctAnswer };
    }
  }

  return { isCorrect: false };
}
