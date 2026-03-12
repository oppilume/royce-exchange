import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";

export const getFeaturedMarkets = cache(async () => {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("market_cards")
    .select("*")
    .in("phase", ["Live", "Voting"])
    .order("total_volume", { ascending: false })
    .limit(4);
  return data ?? [];
});

export const getMarkets = cache(async (filters?: Record<string, string | undefined>) => {
  const supabase = createAdminClient();
  let query = supabase.from("market_cards").select("*").neq("status", "deleted");

  if (filters?.teacher) query = query.ilike("teacher_name", `%${filters.teacher}%`);
  if (filters?.course) query = query.ilike("course_name", `%${filters.course}%`);
  if (filters?.period) query = query.eq("class_period", filters.period);
  if (filters?.status) query = query.eq("phase", filters.status);
  if (filters?.category) query = query.ilike("category_name", `%${filters.category}%`);
  if (filters?.date) query = query.eq("market_date", filters.date);
  if (filters?.search) query = query.or(
    `question.ilike.%${filters.search}%,teacher_name.ilike.%${filters.search}%,course_name.ilike.%${filters.search}%`
  );

  const sort = filters?.sort ?? "activity";
  if (sort === "newest") query = query.order("created_at", { ascending: false });
  if (sort === "volume") query = query.order("total_volume", { ascending: false });
  if (sort === "closing") query = query.order("trading_close_at", { ascending: true });
  if (sort === "activity") query = query.order("updated_at", { ascending: false });

  const { data } = await query.limit(50);
  return data ?? [];
});

export const getMarket = cache(async (marketId: string) => {
  const supabase = createAdminClient();
  const { data: market } = await supabase
    .from("market_cards")
    .select("*")
    .eq("id", marketId)
    .maybeSingle();

  const [{ data: positions }, { data: votes }] = await Promise.all([
    supabase.from("market_positions").select("*").eq("market_id", marketId),
    supabase.from("market_votes").select("vote, comment, created_at, profiles(username)").eq("market_id", marketId)
  ]);

  return {
    market,
    positions: positions ?? [],
    votes: votes ?? []
  };
});

export const getHomepageStats = cache(async () => {
  const supabase = createAdminClient();
  const [{ count: marketCount }, { count: traderCount }, { data: volumeRow }] = await Promise.all([
    supabase.from("markets").select("*", { count: "exact", head: true }).neq("status", "deleted"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("platform_stats").select("*").maybeSingle()
  ]);

  return {
    marketCount: marketCount ?? 0,
    traderCount: traderCount ?? 0,
    totalVolume: volumeRow?.total_volume ?? 0
  };
});

export const getLeaderboard = cache(async (window: "all" | "weekly" = "all") => {
  const supabase = createAdminClient();
  const table = window === "weekly" ? "leaderboard_weekly" : "leaderboard_all_time";
  const { data } = await supabase.from(table).select("*").limit(50);
  return data ?? [];
});

export const getUserProfileData = cache(async (username: string) => {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("public_profile_stats")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return null;

  const { data: activity } = await supabase
    .from("transactions")
    .select("id, type, amount_gems, description, created_at, market_id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return { profile, activity: activity ?? [] };
});

export const getPortfolioData = cache(async (userId: string) => {
  const supabase = createAdminClient();
  const [{ data: positions }, { data: transactions }, { data: stats }] = await Promise.all([
    supabase
      .from("portfolio_positions")
      .select("*")
      .eq("user_id", userId)
      .order("latest_trade_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("public_profile_stats").select("*").eq("id", userId).maybeSingle()
  ]);

  return {
    positions: positions ?? [],
    transactions: transactions ?? [],
    stats
  };
});

export const getAdminDashboardData = cache(async () => {
  const supabase = createAdminClient();
  const [{ data: pending }, { data: deposits }, { data: stats }, { data: users }] = await Promise.all([
    supabase
      .from("market_cards")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("deposit_request_cards")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("platform_stats").select("*").maybeSingle(),
    supabase
      .from("profiles")
      .select("id, username, gem_balance, role")
      .order("gem_balance", { ascending: false })
      .limit(20)
  ]);

  return {
    pending: pending ?? [],
    deposits: deposits ?? [],
    stats,
    users: users ?? []
  };
});
