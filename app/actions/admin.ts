"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SCHEMA_NOT_READY_MESSAGE, isSchemaCacheMissingError } from "@/lib/supabase/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function adminRedirect(tab: string, message: string, type: "status" | "error" = "status") {
  redirect(`/admin?tab=${encodeURIComponent(tab)}&${type}=${encodeURIComponent(message)}`);
}

export async function approveMarketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const marketId = String(formData.get("market_id") || "");
  const { error } = await supabase.rpc("approve_market", { p_market_id: marketId });
  if (error) adminRedirect("markets", error.message, "error");
  revalidatePath("/admin");
  revalidatePath("/markets");
  adminRedirect("markets", "Market approved.");
}

export async function rejectMarketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const marketId = String(formData.get("market_id") || "");
  const { error } = await supabase.rpc("reject_market", {
    p_market_id: marketId,
    p_reason: String(formData.get("reason") || "")
  });
  if (error) adminRedirect("markets", error.message, "error");
  revalidatePath("/admin");
  adminRedirect("markets", "Market rejected.");
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
  if (error) adminRedirect("markets", error.message, "error");
  revalidatePath("/admin");
  revalidatePath(`/markets/${marketId}`);
  revalidatePath("/portfolio");
  revalidatePath("/leaderboard");
  adminRedirect("markets", "Market resolved.");
}

export async function deleteMarketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const marketId = String(formData.get("market_id") || "");
  const { error } = await supabase.rpc("delete_market", { p_market_id: marketId });
  if (error) adminRedirect("markets", error.message, "error");
  revalidatePath("/admin");
  revalidatePath("/markets");
  adminRedirect("markets", "Market deleted.");
}

export async function adjustBalanceAction(formData: FormData): Promise<void> {
  const { user: adminUser } = await requireAdmin();
  const admin = createAdminClient();
  const userId = String(formData.get("user_id") || "");
  const amountGems = Number(formData.get("amount_gems") || 0);
  const reason = String(formData.get("reason") || "").trim();

  if (!userId || !Number.isFinite(amountGems) || amountGems === 0 || !reason) {
    adminRedirect("adjustments", "Provide a user, non-zero amount, and reason.", "error");
  }

  const { data: targetUser, error: targetError } = await admin
    .from("profiles")
    .select("id, gem_balance")
    .eq("id", userId)
    .maybeSingle();

  if (isSchemaCacheMissingError(targetError)) {
    adminRedirect("adjustments", SCHEMA_NOT_READY_MESSAGE, "error");
  }

  if (!targetUser) {
    adminRedirect("adjustments", "That user could not be found.", "error");
  }

  const currentTargetUser = targetUser!;
  const nextBalance = Number(currentTargetUser.gem_balance) + amountGems;
  if (nextBalance < 0) {
    adminRedirect("adjustments", "This adjustment would make the balance negative.", "error");
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ gem_balance: nextBalance })
    .eq("id", userId);

  if (updateError) {
    adminRedirect("adjustments", updateError.message, "error");
  }

  await admin.from("balance_transactions").insert({
    user_id: userId,
    amount_gems: amountGems,
    type: "admin_adjustment",
    note: reason,
    created_by: adminUser.id
  });

  await admin.from("transactions").insert({
    user_id: userId,
    amount_gems: amountGems,
    type: "adjustment",
    description: reason
  });

  await admin.from("balance_adjustments").insert({
    admin_id: adminUser.id,
    user_id: userId,
    amount_gems: amountGems,
    reason
  });

  await admin.from("admin_audit_log").insert({
    admin_user_id: adminUser.id,
    action_type: "balance_adjusted",
    target_type: "profile",
    target_id: userId,
    metadata: { amount_gems: amountGems, reason }
  });

  revalidatePath("/admin");
  revalidatePath("/portfolio");
  adminRedirect("adjustments", "Balance updated.");
}

export async function reviewDepositRequestAction(formData: FormData): Promise<void> {
  const { user: adminUser } = await requireAdmin();
  const admin = createAdminClient();
  const requestId = String(formData.get("request_id") || "");
  const decision = String(formData.get("decision") || "");
  const adminNote = String(formData.get("admin_note") || "").trim();

  const { data: requestRow, error: requestError } = await admin
    .from("deposit_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (isSchemaCacheMissingError(requestError)) {
    adminRedirect("requests", SCHEMA_NOT_READY_MESSAGE, "error");
  }

  if (!requestRow) {
    adminRedirect("requests", "Deposit request not found.", "error");
  }

  if (requestRow.status !== "pending") {
    adminRedirect("requests", "That deposit request has already been reviewed.", "error");
  }

  const { error: updateError } = await admin
    .from("deposit_requests")
    .update({
      status: decision,
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", requestId);

  if (updateError) {
    adminRedirect("requests", updateError.message, "error");
  }

  if (decision === "approved") {
    const { data: targetUser, error: targetError } = await admin
      .from("profiles")
      .select("id, gem_balance")
      .eq("id", requestRow.user_id)
      .maybeSingle();

    if (!targetUser || targetError) {
      adminRedirect("requests", targetError?.message ?? "User profile not found for approval.", "error");
    }

    const currentTargetUser = targetUser!;
    const nextBalance = Number(currentTargetUser.gem_balance) + Number(requestRow.amount_gems);
    const { error: balanceError } = await admin
      .from("profiles")
      .update({ gem_balance: nextBalance })
      .eq("id", requestRow.user_id);

    if (balanceError) {
      adminRedirect("requests", balanceError.message, "error");
    }

    await admin.from("balance_transactions").insert({
      user_id: requestRow.user_id,
      amount_gems: requestRow.amount_gems,
      type: "deposit_approved",
      note: adminNote || requestRow.note || "Deposit request approved",
      related_request_id: requestId,
      created_by: adminUser.id
    });

    await admin.from("transactions").insert({
      user_id: requestRow.user_id,
      amount_gems: requestRow.amount_gems,
      type: "deposit",
      description: adminNote || "Deposit request approved"
    });
  }

  await admin.from("admin_audit_log").insert({
    admin_user_id: adminUser.id,
    action_type: decision === "approved" ? "deposit_request_approved" : "deposit_request_rejected",
    target_type: "deposit_request",
    target_id: requestId,
    metadata: {
      amount_gems: requestRow.amount_gems,
      user_id: requestRow.user_id,
      admin_note: adminNote || null
    }
  });

  revalidatePath("/admin");
  revalidatePath("/portfolio");
  adminRedirect("requests", `Deposit request ${decision}.`);
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const { user: adminUser } = await requireAdmin();
  const admin = createAdminClient();
  const userId = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "");

  if (!userId || !["user", "admin"].includes(role)) {
    adminRedirect("users", "Choose a valid role update.", "error");
  }

  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) {
    adminRedirect("users", error.message, "error");
  }

  await admin.from("admin_audit_log").insert({
    admin_user_id: adminUser.id,
    action_type: "role_updated",
    target_type: "profile",
    target_id: userId,
    metadata: { role }
  });

  revalidatePath("/admin");
  adminRedirect("users", `Role updated to ${role}.`);
}
