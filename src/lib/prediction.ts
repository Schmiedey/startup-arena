const PREDICTION_K_FACTOR = 32;

export const DEFAULT_PREDICTION_ELO = 1000;

export interface PredictionTargetInput {
  ideaAId: string;
  ideaBId: string;
  ideaAVotes: number;
  ideaBVotes: number;
}

export function getPredictionTarget({
  ideaAId,
  ideaBId,
  ideaAVotes,
  ideaBVotes,
}: PredictionTargetInput): string | null {
  if (ideaAVotes > ideaBVotes) return ideaAId;
  if (ideaBVotes > ideaAVotes) return ideaBId;
  return null;
}

export function getPredictionDifficulty({
  ideaAVotes,
  ideaBVotes,
}: Omit<PredictionTargetInput, "ideaAId" | "ideaBId">): number {
  const totalVotes = ideaAVotes + ideaBVotes;
  if (totalVotes > 0 && ideaAVotes !== ideaBVotes) {
    const margin = Math.abs(ideaAVotes - ideaBVotes) / totalVotes;
    return Math.round(1200 - margin * 300);
  }

  return 1200;
}

export function calculatePredictionElo(
  currentElo: number,
  difficulty: number,
  correct: boolean
): number {
  const expected = 1 / (1 + Math.pow(10, (difficulty - currentElo) / 400));
  const score = correct ? 1 : 0;
  return Math.max(100, Math.round(currentElo + PREDICTION_K_FACTOR * (score - expected)));
}

export function isRankedPredictionSignal({
  ideaAVotes,
  ideaBVotes,
}: Omit<PredictionTargetInput, "ideaAId" | "ideaBId">): boolean {
  const totalVotes = ideaAVotes + ideaBVotes;
  return totalVotes > 0 && ideaAVotes !== ideaBVotes;
}

export function getPredictionAccuracy(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

export function formatPredictionTier(elo: number): string {
  if (elo >= 1400) return "Oracle";
  if (elo >= 1250) return "Sharp";
  if (elo >= 1100) return "Scout";
  if (elo >= 950) return "Calibrating";
  return "Contrarian";
}
