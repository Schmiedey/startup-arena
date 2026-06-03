export const CATEGORIES = [
  "AI", "SaaS", "Local Business", "Consumer App", "Marketplace",
  "Chrome Extension", "Education", "Creator Tools", "E-commerce", "Wild Ideas",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STAGES = ["Idea", "MVP", "Launched", "Revenue"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_COLORS: Record<Stage, string> = {
  Idea: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  MVP: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Launched: "bg-green-500/20 text-green-400 border-green-500/30",
  Revenue: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export const CATEGORY_COLORS: Record<string, string> = {
  AI: "bg-purple-500/20 text-purple-400",
  SaaS: "bg-cyan-500/20 text-cyan-400",
  "Local Business": "bg-orange-500/20 text-orange-400",
  "Consumer App": "bg-pink-500/20 text-pink-400",
  Marketplace: "bg-indigo-500/20 text-indigo-400",
  "Chrome Extension": "bg-yellow-500/20 text-yellow-400",
  Education: "bg-violet-500/20 text-violet-400",
  "Creator Tools": "bg-rose-500/20 text-rose-400",
  "E-commerce": "bg-teal-500/20 text-teal-400",
  "Wild Ideas": "bg-red-500/20 text-red-400",
};

export interface Idea {
  id: string;
  user_id: string | null;
  name: string;
  pitch: string;
  target_customer: string;
  problem: string;
  revenue_model: string;
  category: Category;
  stage: Stage;
  elo_score: number;
  wins: number;
  losses: number;
  created_at: string;
  user_name?: string | null;
  user_image?: string | null;
  user_plan?: "free" | "launch" | "pro" | null;
  profile_headline?: string | null;
  profile_cta_label?: string | null;
  profile_cta_url?: string | null;
  profile_show_contact?: boolean | null;
  profile_featured_category?: Category | null;
  comment_count?: number;
  reason_count?: number;
  controversy_score?: number;
}

export interface Battle {
  id: string;
  idea_a_id: string;
  idea_b_id: string;
  idea_a_votes: number;
  idea_b_votes: number;
  winner_id: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  idea_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
  user_name?: string | null;
  user_image?: string | null;
  flag_count?: number;
}

export interface Predictor {
  id: string;
  name: string | null;
  image: string | null;
  is_bot?: boolean;
  prediction_elo: number;
  prediction_wins: number;
  prediction_losses: number;
  prediction_streak: number;
  best_prediction_streak: number;
  guesses: number;
  accuracy: number;
}
