import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
      plan?: "free" | "launch" | "pro";
      predictionElo?: number;
      predictionWins?: number;
      predictionLosses?: number;
      predictionStreak?: number;
      bestPredictionStreak?: number;
    };
  }
}
