import { describe, expect, it } from "vitest";
import {
  calculatePredictionElo,
  getPredictionAccuracy,
  getPredictionDifficulty,
  getPredictionTarget,
  isRankedPredictionSignal,
} from "./prediction";

describe("prediction helpers", () => {
  it("uses only the community vote majority as the prediction target", () => {
    expect(getPredictionTarget({
      ideaAId: "a",
      ideaBId: "b",
      ideaAVotes: 5,
      ideaBVotes: 3,
    })).toBe("a");

    expect(getPredictionTarget({
      ideaAId: "a",
      ideaBId: "b",
      ideaAVotes: 0,
      ideaBVotes: 0,
    })).toBeNull();

    expect(getPredictionTarget({
      ideaAId: "a",
      ideaBId: "b",
      ideaAVotes: 4,
      ideaBVotes: 4,
    })).toBeNull();
  });

  it("rates close matchups as harder than obvious ones", () => {
    const close = getPredictionDifficulty({ ideaAVotes: 51, ideaBVotes: 49 });
    const obvious = getPredictionDifficulty({ ideaAVotes: 90, ideaBVotes: 10 });

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
      ideaAVotes: 0,
      ideaBVotes: 0,
    })).toBe(false);

    expect(isRankedPredictionSignal({
      ideaAVotes: 3,
      ideaBVotes: 3,
    })).toBe(false);

    expect(isRankedPredictionSignal({
      ideaAVotes: 3,
      ideaBVotes: 2,
    })).toBe(true);
  });
});
