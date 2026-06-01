const PREDICTION_K_FACTOR = 32;
const MIN_RANKED_SIGNAL_VOTES = 3;
const MIN_RANKED_ELO_GAP = 150;

export const DEFAULT_PREDICTION_ELO = 1000;

export interface PredictionTargetInput {
  ideaAId: string;
  ideaBId: string;
  ideaAVotes: number;
  ideaBVotes: number;
  ideaAElo: number;
  ideaBElo: number;
}

export function getPredictionTarget({
  ideaAId,
  ideaBId,
  ideaAVotes,
  ideaBVotes,
  ideaAElo,
  ideaBElo,
}: PredictionTargetInput): string | null {
  if (ideaAVotes > ideaBVotes) return ideaAId;
  if (ideaBVotes > ideaAVotes) return ideaBId;
  if (ideaAElo === ideaBElo) return null;
  return ideaAElo >= ideaBElo ? ideaAId : ideaBId;
}

export function getPredictionDifficulty({
  ideaAVotes,
  ideaBVotes,
  ideaAElo,
  ideaBElo,
}: Omit<PredictionTargetInput, "ideaAId" | "ideaBId">): number {
  const totalVotes = ideaAVotes + ideaBVotes;
  if (totalVotes > 0 && ideaAVotes !== ideaBVotes) {
    const margin = Math.abs(ideaAVotes - ideaBVotes) / totalVotes;
    return Math.round(1200 - margin * 300);
  }

  const eloGap = Math.abs(ideaAElo - ideaBElo);
  return Math.round(Math.min(1200, Math.max(900, 1200 - eloGap * 0.75)));
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
  ideaAElo,
  ideaBElo,
}: Omit<PredictionTargetInput, "ideaAId" | "ideaBId">): boolean {
  const totalVotes = ideaAVotes + ideaBVotes;
  return totalVotes >= MIN_RANKED_SIGNAL_VOTES || Math.abs(ideaAElo - ideaBElo) >= MIN_RANKED_ELO_GAP;
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
