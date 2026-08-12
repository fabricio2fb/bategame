export interface TresLetrasAnswerEntry {
  answerId: string;
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  text: string;
  normalizedText: string;
  repeated: boolean;
  votes: Array<{
    voterPlayerId: string;
    value: 'correct' | 'wrong';
  }>;
}

export interface TresLetrasAnswerResult extends TresLetrasAnswerEntry {
  correctVotes: number;
  wrongVotes: number;
  outcome: 'accepted-unique' | 'accepted-repeated' | 'rejected' | 'tie';
  points: number;
}

export interface TresLetrasRoundScoreResult {
  answers: TresLetrasAnswerResult[];
  playerPoints: Record<string, number>;
  teamPoints: Record<string, number>;
  scoreTarget: 'player' | 'team';
}

interface CalculateTresLetrasRoundScoreOptions {
  answers: TresLetrasAnswerEntry[];
  scoreTarget?: 'player' | 'team';
  earlyEnderPlayerId?: string | null;
}

/**
 * 3 Letras scoring:
 * - majority wrong: 0
 * - majority correct and unique: 1
 * - majority correct and repeated: 0.5
 * - exact voting tie: 0.5
 * - when earlyEnderPlayerId is provided, a rejected answer from that player scores -1
 */
export function calculateTresLetrasRoundScore({
  answers,
  scoreTarget = 'player',
  earlyEnderPlayerId = null,
}: CalculateTresLetrasRoundScoreOptions): TresLetrasRoundScoreResult {
  const playerPoints: Record<string, number> = {};
  const teamPoints: Record<string, number> = {};

  const results = answers.map((answer) => {
    const correctVotes = answer.votes.filter((vote) => vote.value === 'correct').length;
    const wrongVotes = answer.votes.filter((vote) => vote.value === 'wrong').length;
    let outcome: TresLetrasAnswerResult['outcome'];
    let points = 0;

    if (correctVotes === wrongVotes) {
      outcome = 'tie';
      points = 0.5;
    } else if (wrongVotes > correctVotes) {
      outcome = 'rejected';
      points = answer.playerId === earlyEnderPlayerId ? -1 : 0;
    } else if (answer.repeated) {
      outcome = 'accepted-repeated';
      points = 0.5;
    } else {
      outcome = 'accepted-unique';
      points = 1;
    }

    if (points !== 0) {
      if (scoreTarget === 'team' && answer.teamId) {
        teamPoints[answer.teamId] = (teamPoints[answer.teamId] || 0) + points;
      } else {
        playerPoints[answer.playerId] = (playerPoints[answer.playerId] || 0) + points;
      }
    }

    return {
      ...answer,
      correctVotes,
      wrongVotes,
      outcome,
      points,
    };
  });

  return {
    answers: results,
    playerPoints,
    teamPoints,
    scoreTarget,
  };
}
