const K_FACTOR = 32;

export function calculateElo(
  winnerRating: number,
  loserRating: number
): { newWinnerRating: number; newLoserRating: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  const newWinnerRating = Math.max(100, Math.round(winnerRating + K_FACTOR * (1 - expectedWinner)));
  const newLoserRating = Math.max(100, Math.round(loserRating + K_FACTOR * (0 - expectedLoser)));

  return { newWinnerRating, newLoserRating };
}

export function getWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

export function getSurvivalRating(eloScore: number): number {
  const base = Math.min(Math.max((eloScore - 600) / 10, 0), 100);
  return Math.round(base);
}

export function formatElo(elo: number): string {
  if (elo >= 1400) return "Dominant";
  if (elo >= 1200) return "Strong";
  if (elo >= 1050) return "Contender";
  if (elo >= 950) return "Rising";
  if (elo >= 800) return "Unproven";
  return "Fresh";
}