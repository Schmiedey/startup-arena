import { describe, expect, it } from "vitest";
import {
  calculatePredictionElo,
  getPredictionAccuracy,
  getPredictionDifficulty,
  getPredictionTarget,
  isRankedPredictionSignal,
} from "./prediction";

describe("prediction helpers", () => {
  it("uses current consensus before falling back to idea Elo", () => {
    expect(getPredictionTarget({
      ideaAId: "a",
      ideaBId: "b",
      ideaAVotes: 5,
      ideaBVotes: 3,
      ideaAElo: 900,
      ideaBElo: 1200,
    })).toBe("a");

    expect(getPredictionTarget({
      ideaAId: "a",
      ideaBId: "b",
      ideaAVotes: 0,
      ideaBVotes: 0,
      ideaAElo: 900,
      ideaBElo: 1200,
    })).toBe("b");

    expect(getPredictionTarget({
      ideaAId: "a",
      ideaBId: "b",
      ideaAVotes: 0,
      ideaBVotes: 0,
      ideaAElo: 1000,
      ideaBElo: 1000,
    })).toBeNull();
  });

  it("rates close matchups as harder than obvious ones", () => {
    const close = getPredictionDifficulty({ ideaAVotes: 0, ideaBVotes: 0, ideaAElo: 1000, ideaBElo: 1010 });
    const obvious = getPredictionDifficulty({ ideaAVotes: 0, ideaBVotes: 0, ideaAElo: 1000, ideaBElo: 1400 });

    expect(close).toBeGreaterThan(obvious);
  });

  it("moves predictor Elo up and down and formats accuracy", () => {
    const won = calculatePredictionElo(1000, 1000, true);
    const lost = calculatePredictionElo(1000, 1000, false);

    expect(won).toBe(1016);
    expect(lost).toBe(984);
    expect(getPredictionAccuracy(3, 1)).toBe(75);
    expect(getPredictionAccuracy(0, 0)).toBe(0);
  });

  it("keeps weak signals provisional", () => {
    expect(isRankedPredictionSignal({
      ideaAVotes: 1,
      ideaBVotes: 1,
      ideaAElo: 1000,
      ideaBElo: 1050,
    })).toBe(false);

    expect(isRankedPredictionSignal({
      ideaAVotes: 2,
      ideaBVotes: 1,
      ideaAElo: 1000,
      ideaBElo: 1050,
    })).toBe(true);

    expect(isRankedPredictionSignal({
      ideaAVotes: 0,
      ideaBVotes: 0,
      ideaAElo: 1000,
      ideaBElo: 1180,
    })).toBe(true);
  });
});
