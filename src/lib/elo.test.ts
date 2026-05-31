import { describe, expect, it } from "vitest";
import { calculateElo, getSurvivalRating, getWinRate } from "./elo";

describe("elo helpers", () => {
  it("keeps equal-rating matches symmetric", () => {
    expect(calculateElo(1000, 1000)).toEqual({
      newWinnerRating: 1016,
      newLoserRating: 984,
    });
  });

  it("rewards upsets more than expected wins", () => {
    const upset = calculateElo(900, 1200);
    const expected = calculateElo(1200, 900);

    expect(upset.newWinnerRating - 900).toBeGreaterThan(expected.newWinnerRating - 1200);
    expect(1200 - upset.newLoserRating).toBeGreaterThan(900 - expected.newLoserRating);
  });

  it("handles empty win rates and survival rating bounds", () => {
    expect(getWinRate(0, 0)).toBe(0);
    expect(getWinRate(3, 1)).toBe(75);
    expect(getSurvivalRating(100)).toBe(0);
    expect(getSurvivalRating(2000)).toBe(100);
  });
});
