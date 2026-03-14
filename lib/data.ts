import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSchemaCacheMissingError } from "@/lib/supabase/errors";

export const getFeaturedMarkets = cache(async () => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("market_cards")
    .select("*")
    .in("phase", ["Live", "Voting"])
    .order("total_volume", { ascending: false })
    .limit(4);
  if (isSchemaCacheMissingError(error)) return [];
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

  const { data, error } = await query.limit(50);
  if (isSchemaCacheMissingError(error)) return [];
  return data ?? [];
});

export const getMarket = cache(async (marketId: string) => {
  const supabase = createAdminClient();
  const { data: market, error: marketError } = await supabase
    .from("market_cards")
    .select("*")
    .eq("id", marketId)
    .maybeSingle();

  if (isSchemaCacheMissingError(marketError)) {
    return {
      market: null,
      positions: [],
      votes: [],
      openOrders: []
    };
  }

  const [
    { data: positions, error: positionsError },
    { data: votes, error: votesError },
    { data: openOrders, error: ordersError }
  ] = await Promise.all([
    supabase.from("market_positions").select("*").eq("market_id", marketId),
    supabase.from("market_votes").select("vote, comment, created_at, profiles(username)").eq("market_id", marketId),
    supabase
      .from("market_orders")
      .select("id, user_id, side, price, remaining_quantity, locked_gems, created_at")
      .eq("market_id", marketId)
      .eq("status", "open")
      .gt("remaining_quantity", 0)
      .order("created_at", { ascending: true })
  ]);

  if (
    isSchemaCacheMissingError(positionsError) ||
    isSchemaCacheMissingError(votesError) ||
    isSchemaCacheMissingError(ordersError)
  ) {
    return {
      market,
      positions: [],
      votes: [],
      openOrders: []
    };
  }

  return {
    market,
    positions: positions ?? [],
    votes: votes ?? [],
    openOrders: openOrders ?? []
  };
});

export const getHomepageStats = cache(async () => {
  const supabase = createAdminClient();
  const [
    { count: marketCount, error: marketCountError },
    { count: traderCount, error: traderCountError },
    { data: volumeRow, error: volumeError }
  ] = await Promise.all([
    supabase.from("markets").select("*", { count: "exact", head: true }).neq("status", "deleted"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("platform_stats").select("*").maybeSingle()
  ]);

  if (
    isSchemaCacheMissingError(marketCountError) ||
    isSchemaCacheMissingError(traderCountError) ||
    isSchemaCacheMissingError(volumeError)
  ) {
    return {
      marketCount: 0,
      traderCount: 0,
      totalVolume: 0
    };
  }

  return {
    marketCount: marketCount ?? 0,
    traderCount: traderCount ?? 0,
    totalVolume: volumeRow?.total_volume ?? 0
  };
});

export const getLeaderboard = cache(async (window: "all" | "weekly" = "all") => {
  const supabase = createAdminClient();
  const table = window === "weekly" ? "leaderboard_weekly" : "leaderboard_all_time";
  const { data, error } = await supabase.from(table).select("*").limit(50);
  if (isSchemaCacheMissingError(error)) return [];
  return data ?? [];
});

export const getUserProfileData = cache(async (username: string) => {
  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("public_profile_stats")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (isSchemaCacheMissingError(error)) return null;
  if (!profile) return null;

  const { data: activity, error: activityError } = await supabase
    .from("transactions")
    .select("id, type, amount_gems, description, created_at, market_id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (isSchemaCacheMissingError(activityError)) {
    return { profile, activity: [] };
  }

  return { profile, activity: activity ?? [] };
});

export const getPortfolioData = cache(async (userId: string) => {
  const supabase = createAdminClient();
  const [
    { data: positions, error: positionsError },
    { data: transactions, error: transactionsError },
    { data: stats, error: statsError },
    { data: depositRequests, error: depositError },
    { data: openOrders, error: openOrdersError }
  ] = await Promise.all([
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
    supabase.from("public_profile_stats").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("deposit_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("portfolio_open_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  ]);

  if (
    isSchemaCacheMissingError(positionsError) ||
    isSchemaCacheMissingError(transactionsError) ||
    isSchemaCacheMissingError(statsError) ||
    isSchemaCacheMissingError(depositError) ||
    isSchemaCacheMissingError(openOrdersError)
  ) {
    return {
      positions: [],
      transactions: [],
      stats: null,
      depositRequests: [],
      openOrders: []
    };
  }

  return {
    positions: positions ?? [],
    transactions: transactions ?? [],
    stats,
    depositRequests: depositRequests ?? [],
    openOrders: openOrders ?? []
  };
});

export const getAdminDashboardData = cache(async () => {
  const supabase = createAdminClient();
  const authUsersResponse = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200
  });

  const [
    { data: pending, error: pendingError },
    { data: deposits, error: depositsError },
    { data: stats, error: statsError },
    { data: users, error: usersError },
    { data: marketList, error: marketListError },
    { data: auditLog, error: auditError },
    { data: balanceTransactions, error: balanceTxError }
  ] = await Promise.all([
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
      .limit(50),
    supabase
      .from("market_cards")
      .select("*")
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("balance_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40)
  ]);

  if (
    isSchemaCacheMissingError(pendingError) ||
    isSchemaCacheMissingError(depositsError) ||
    isSchemaCacheMissingError(statsError) ||
    isSchemaCacheMissingError(usersError) ||
    isSchemaCacheMissingError(marketListError) ||
    isSchemaCacheMissingError(auditError) ||
    isSchemaCacheMissingError(balanceTxError)
  ) {
    return {
      pending: [],
      deposits: [],
      stats: null,
      users: [],
      marketList: [],
      auditLog: [],
      balanceTransactions: []
    };
  }

  const authUsers = authUsersResponse.data?.users ?? [];
  const usersWithEmail = (users ?? []).map((profile) => {
    const authUser = authUsers.find((entry) => entry.id === profile.id);
    return {
      ...profile,
      email: authUser?.email ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null
    };
  });

  return {
    pending: pending ?? [],
    deposits: deposits ?? [],
    stats,
    users: usersWithEmail,
    marketList: marketList ?? [],
    auditLog: auditLog ?? [],
    balanceTransactions: balanceTransactions ?? []
  };
});
