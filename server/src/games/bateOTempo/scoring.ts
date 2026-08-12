export type BateOTempoScoringMode = 'exact' | 'approximate';

export interface BateOTempoTimeEntry {
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  elapsedMs: number | null;
}

export interface BateOTempoStanding extends BateOTempoTimeEntry {
  distanceMs: number | null;
  points: number;
}

export interface BateOTempoScoreResult {
  standings: BateOTempoStanding[];
  winnerPlayerIds: string[];
  winnerTeamIds: string[];
  scoreTarget: 'player' | 'team';
  hasValidStops: boolean;
}

const EXACT_TOLERANCE_MS = 50;

export function calculateBateOTempoRoundScore(options: {
  targetMs: number;
  entries: BateOTempoTimeEntry[];
  scoringMode: BateOTempoScoringMode;
  scoreTarget: 'player' | 'team';
  exactToleranceMs?: number;
}): BateOTempoScoreResult {
  const exactToleranceMs = options.exactToleranceMs ?? EXACT_TOLERANCE_MS;
  const standings: BateOTempoStanding[] = options.entries
    .map((entry) => ({
      ...entry,
      distanceMs: typeof entry.elapsedMs === 'number' ? Math.abs(entry.elapsedMs - options.targetMs) : null,
      points: 0,
    }))
    .sort((left, right) => {
      const leftDistance = typeof left.distanceMs === 'number' ? left.distanceMs : Number.POSITIVE_INFINITY;
      const rightDistance = typeof right.distanceMs === 'number' ? right.distanceMs : Number.POSITIVE_INFINITY;
      return leftDistance - rightDistance;
    });

  const validStandings = standings.filter((entry) => typeof entry.distanceMs === 'number');
  if (validStandings.length === 0) {
    return { standings, winnerPlayerIds: [], winnerTeamIds: [], scoreTarget: options.scoreTarget, hasValidStops: false };
  }

  const winningEntries =
    options.scoringMode === 'exact'
      ? validStandings.filter((entry) => (entry.distanceMs ?? Number.POSITIVE_INFINITY) <= exactToleranceMs)
      : validStandings.filter((entry) => entry.distanceMs === validStandings[0].distanceMs);

  const winnerPlayerIds = new Set<string>();
  const winnerTeamIds = new Set<string>();

  for (const entry of winningEntries) {
    entry.points = 1;
    if (options.scoreTarget === 'team' && entry.teamId) {
      winnerTeamIds.add(entry.teamId);
    } else {
      winnerPlayerIds.add(entry.playerId);
    }
  }

  return {
    standings,
    winnerPlayerIds: Array.from(winnerPlayerIds),
    winnerTeamIds: Array.from(winnerTeamIds),
    scoreTarget: options.scoreTarget,
    hasValidStops: true,
  };
}

export function formatClockMs(ms: number): string {
  const safeMs = Math.max(0, Math.round(ms));
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const centiseconds = Math.floor((safeMs % 1000) / 10);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}
