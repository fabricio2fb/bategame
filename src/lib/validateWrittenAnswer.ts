function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeText(str: string): string {
  return removeAccents(str.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, ''));
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}

export function validateWrittenAnswer(
  submittedAnswer: string,
  correctAnswer: string,
  acceptedAnswers: string[] = [],
  strictness: 'exact' | 'normalized' | 'tolerant' = 'normalized',
): { isCorrect: boolean; matchedAnswer?: string } {
  if (strictness === 'exact') {
    const allAccepted = [correctAnswer, ...acceptedAnswers];
    const match = allAccepted.find(a => a.trim() === submittedAnswer.trim());
    return match ? { isCorrect: true, matchedAnswer: match } : { isCorrect: false };
  }

  const normalizedSubmitted = normalizeText(submittedAnswer);
  const normalizedCorrect = normalizeText(correctAnswer);
  const normalizedAccepted = acceptedAnswers.map(normalizeText);

  if (normalizedSubmitted === normalizedCorrect) {
    return { isCorrect: true, matchedAnswer: correctAnswer };
  }

  for (const acc of normalizedAccepted) {
    if (normalizedSubmitted === acc) {
      return { isCorrect: true, matchedAnswer: acc };
    }
  }

  if (strictness === 'tolerant') {
    const allNormalized = [normalizedCorrect, ...normalizedAccepted];
    for (const norm of allNormalized) {
      const distance = levenshtein(normalizedSubmitted, norm);
      const maxDistance = norm.length <= 4 ? 1 : norm.length <= 8 ? 1 : 2;
      if (distance <= maxDistance) {
        return { isCorrect: true, matchedAnswer: norm };
      }
    }
  }

  return { isCorrect: false };
}
