"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function submitMarketProposalAction(formData: FormData): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createServerSupabaseClient();

  const payload = {
    p_teacher_name: String(formData.get("teacher_name") || ""),
    p_prediction_text: String(formData.get("prediction_text") || ""),
    p_course_name: String(formData.get("course_name") || ""),
    p_class_period: String(formData.get("class_period") || ""),
    p_market_date: String(formData.get("market_date") || ""),
    p_market_type: String(formData.get("market_type") || ""),
    p_notes: String(formData.get("notes") || ""),
    p_trading_close_at: String(formData.get("trading_close_at") || ""),
    p_vote_start_at: String(formData.get("vote_start_at") || ""),
    p_category_name: String(formData.get("category_name") || ""),
    p_creator_id: user.id
  };

  const { error } = await supabase.rpc("submit_market_proposal", payload);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/create");
  revalidatePath("/admin");
  revalidatePath("/markets");
}

export async function placeTradeAction(formData: FormData): Promise<void> {
  await requireUser();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc("place_trade", {
    p_market_id: String(formData.get("market_id") || ""),
    p_side: String(formData.get("side") || ""),
    p_quantity: Number(formData.get("quantity") || 0)
  });

  if (error) {
    throw new Error(error.message);
  }

  const marketId = String(formData.get("market_id"));
  revalidatePath(`/markets/${marketId}`);
  revalidatePath("/portfolio");
  revalidatePath("/markets");
}

export async function submitVoteAction(formData: FormData): Promise<void> {
  await requireUser();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc("submit_market_vote", {
    p_market_id: String(formData.get("market_id") || ""),
    p_vote: String(formData.get("vote") || ""),
    p_comment: String(formData.get("comment") || "")
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/markets/${String(formData.get("market_id"))}`);
}

export async function submitDepositRequestAction(formData: FormData): Promise<void> {
  await requireUser();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc("submit_deposit_request", {
    p_amount_gems: Number(formData.get("amount_gems") || 0),
    p_note: String(formData.get("note") || "")
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/portfolio");
  revalidatePath("/admin");
}
