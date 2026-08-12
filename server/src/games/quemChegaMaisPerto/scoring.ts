export interface NumericGuessEntry {
  playerId: string;
  playerName?: string;
  teamId?: string;
  teamName?: string;
  guess: number | null;
}

export interface NumericRoundStanding {
  playerId?: string;
  playerName?: string;
  teamId?: string;
  teamName?: string;
  guess: number;
  distance: number;
  points: number;
  submittedByPlayerId?: string;
  submittedByPlayerName?: string;
}

export interface NumericRoundScoreResult {
  correctValue: number;
  scoreTarget: 'player' | 'team';
  hasValidGuesses: boolean;
  standings: NumericRoundStanding[];
  winnerPlayerIds: string[];
  winnerTeamIds: string[];
  playerPoints: Record<string, number>;
  teamPoints: Record<string, number>;
}

interface CalculateNumericRoundScoreOptions {
  correctValue: number;
  guesses: NumericGuessEntry[];
  scoreTarget?: 'player' | 'team';
  tieEpsilon?: number;
}

/**
 * Quem Chega Mais Perto scoring rule:
 * only the closest valid guess earns 1 point. Tied closest guesses also earn 1.
 * If nobody submits a valid guess, nobody scores.
 *
 * In team mode the team score uses the best guess submitted by any team member.
 */
export function calculateNumericRoundScore({
  correctValue,
  guesses,
  scoreTarget = 'player',
  tieEpsilon = 0.000000001,
}: CalculateNumericRoundScoreOptions): NumericRoundScoreResult {
  const validGuesses = guesses.filter((entry) => Number.isFinite(entry.guess)) as Array<
    NumericGuessEntry & { guess: number }
  >;

  if (!Number.isFinite(correctValue) || validGuesses.length === 0) {
    return {
      correctValue,
      scoreTarget,
      hasValidGuesses: false,
      standings: [],
      winnerPlayerIds: [],
      winnerTeamIds: [],
      playerPoints: {},
      teamPoints: {},
    };
  }

  const standings =
    scoreTarget === 'team'
      ? buildTeamStandings(validGuesses, correctValue)
      : buildPlayerStandings(validGuesses, correctValue);

  const bestDistance = standings[0]?.distance;
  const winners = standings.filter((entry) => Math.abs(entry.distance - bestDistance) <= tieEpsilon);
  const winnerPlayerIds = scoreTarget === 'player'
    ? winners.map((entry) => entry.playerId).filter(Boolean) as string[]
    : [];
  const winnerTeamIds = scoreTarget === 'team'
    ? winners.map((entry) => entry.teamId).filter(Boolean) as string[]
    : [];

  const playerPoints: Record<string, number> = {};
  const teamPoints: Record<string, number> = {};

  for (const winner of winners) {
    winner.points = 1;
    if (scoreTarget === 'team' && winner.teamId) {
      teamPoints[winner.teamId] = 1;
    }
    if (scoreTarget === 'player' && winner.playerId) {
      playerPoints[winner.playerId] = 1;
    }
  }

  return {
    correctValue,
    scoreTarget,
    hasValidGuesses: true,
    standings,
    winnerPlayerIds,
    winnerTeamIds,
    playerPoints,
    teamPoints,
  };
}

function buildPlayerStandings(
  guesses: Array<NumericGuessEntry & { guess: number }>,
  correctValue: number,
): NumericRoundStanding[] {
  return guesses
    .map((entry) => ({
      playerId: entry.playerId,
      playerName: entry.playerName,
      teamId: entry.teamId,
      teamName: entry.teamName,
      guess: entry.guess,
      distance: Math.abs(entry.guess - correctValue),
      points: 0,
    }))
    .sort((a, b) => a.distance - b.distance || a.guess - b.guess);
}

function buildTeamStandings(
  guesses: Array<NumericGuessEntry & { guess: number }>,
  correctValue: number,
): NumericRoundStanding[] {
  const bestByTeam = new Map<string, NumericRoundStanding>();

  for (const entry of guesses) {
    if (!entry.teamId) continue;

    const standing: NumericRoundStanding = {
      teamId: entry.teamId,
      teamName: entry.teamName,
      guess: entry.guess,
      distance: Math.abs(entry.guess - correctValue),
      points: 0,
      submittedByPlayerId: entry.playerId,
      submittedByPlayerName: entry.playerName,
    };
    const current = bestByTeam.get(entry.teamId);

    if (!current || standing.distance < current.distance) {
      bestByTeam.set(entry.teamId, standing);
    }
  }

  return Array.from(bestByTeam.values()).sort((a, b) => a.distance - b.distance || a.guess - b.guess);
}
