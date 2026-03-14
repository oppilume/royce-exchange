export type MarketType = "exact_phrase" | "broader_mention";
export type MarketSide = "yes" | "no";
export type UserRole = "user" | "admin";

export type MarketRow = {
  id: string;
  question: string;
  teacher_name: string;
  course_name: string;
  class_period: string;
  market_date: string;
  market_type: MarketType;
  notes: string | null;
  trading_close_at: string;
  vote_start_at: string;
  vote_end_at?: string | null;
  status: string;
  yes_price: number;
  total_volume: number;
  resolved_outcome: MarketSide | null;
  resolved_at: string | null;
  category_name: string | null;
  creator_username: string | null;
};

export type ProfileRow = {
  id: string;
  username: string | null;
  role: UserRole;
  gem_balance: number;
  bio: string | null;
  avatar_color: string | null;
};
