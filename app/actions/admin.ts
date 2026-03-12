"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function approveMarketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const marketId = String(formData.get("market_id") || "");
  const { error } = await supabase.rpc("approve_market", { p_market_id: marketId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/markets");
}

export async function rejectMarketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const marketId = String(formData.get("market_id") || "");
  const { error } = await supabase.rpc("reject_market", {
    p_market_id: marketId,
    p_reason: String(formData.get("reason") || "")
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function resolveMarketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const marketId = String(formData.get("market_id") || "");
  const { error } = await supabase.rpc("resolve_market", {
    p_market_id: marketId,
    p_outcome: String(formData.get("outcome") || ""),
    p_admin_note: String(formData.get("admin_note") || "")
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath(`/markets/${marketId}`);
  revalidatePath("/portfolio");
  revalidatePath("/leaderboard");
}

export async function deleteMarketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const marketId = String(formData.get("market_id") || "");
  const { error } = await supabase.rpc("delete_market", { p_market_id: marketId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/markets");
}

export async function adjustBalanceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("admin_adjust_balance", {
    p_user_id: String(formData.get("user_id") || ""),
    p_amount_gems: Number(formData.get("amount_gems") || 0),
    p_reason: String(formData.get("reason") || "")
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/portfolio");
}

export async function reviewDepositRequestAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("review_deposit_request", {
    p_request_id: String(formData.get("request_id") || ""),
    p_decision: String(formData.get("decision") || "")
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/portfolio");
}
