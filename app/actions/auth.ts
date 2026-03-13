"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SCHEMA_NOT_READY_MESSAGE, isSchemaCacheMissingError } from "@/lib/supabase/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const bootstrapAdminEmail = process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase();

  if (!email || !email.includes("@") || password.length < 8 || username.length < 3) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Use a valid email address, a username with at least 3 characters, and a password with at least 8 characters."
      )}`
    );
  }

  const admin = createAdminClient();
  const { data: existingUsername, error: usernameError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (!isSchemaCacheMissingError(usernameError) && existingUsername) {
    redirect(`/signup?error=${encodeURIComponent("That username is already taken.")}`);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error || !data.user) {
    redirect(`/signup?error=${encodeURIComponent(error?.message ?? "Unable to create the account.")}`);
  }

  const { error: profileInsertError } = await admin.from("profiles").insert({
    id: data.user.id,
    username
  });

  if (profileInsertError) {
    await admin.auth.admin.deleteUser(data.user.id);
    const message = isSchemaCacheMissingError(profileInsertError)
      ? SCHEMA_NOT_READY_MESSAGE
      : profileInsertError.message;
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }

  if (bootstrapAdminEmail && bootstrapAdminEmail === email) {
    const { count: adminCount, error: adminCountError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (!adminCountError && (adminCount ?? 0) === 0) {
      await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
      await admin.from("admin_audit_log").insert({
        admin_user_id: data.user.id,
        action_type: "bootstrap_admin_granted",
        target_type: "profile",
        target_id: data.user.id,
        metadata: { email, username }
      });
      revalidatePath("/admin");
    }
  }

  const supabase = await createServerSupabaseClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    redirect(`/signup?error=${encodeURIComponent(signInError.message)}`);
  }

  revalidatePath("/");
  redirect("/markets");
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Incorrect email or password.")}`);
  }

  revalidatePath("/");
  redirect("/markets");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function closeAccountAction(formData: FormData): Promise<void> {
  const confirmation = String(formData.get("confirmation") || "").trim();
  const { user, profile } = await requireUser();

  if (confirmation !== "CLOSE MY ACCOUNT") {
    redirect(
      `/portfolio?error=${encodeURIComponent(
        'Type "CLOSE MY ACCOUNT" exactly to close your account.'
      )}`
    );
  }

  const admin = createAdminClient();

  if (profile?.role === "admin") {
    const { count: adminCount, error: adminCountError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (!adminCountError && (adminCount ?? 0) <= 1) {
      redirect(
        `/portfolio?error=${encodeURIComponent(
          "You are the last admin. Promote another account before closing this one."
        )}`
      );
    }
  }

  const anonymizedEmail = `closed-${user.id}-${randomUUID()}@example.invalid`;
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
    email: anonymizedEmail,
    password: randomUUID(),
    ban_duration: "876000h",
    user_metadata: {
      closed_account: true,
      closed_at: new Date().toISOString()
    }
  });

  if (authUpdateError) {
    redirect(`/portfolio?error=${encodeURIComponent(authUpdateError.message)}`);
  }

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({
      username: null,
      role: "user",
      bio: "Closed account",
      avatar_color: "#6b7280"
    })
    .eq("id", user.id);

  if (profileUpdateError && !isSchemaCacheMissingError(profileUpdateError)) {
    redirect(`/portfolio?error=${encodeURIComponent(profileUpdateError.message)}`);
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/portfolio");
  redirect(
    `/login?status=${encodeURIComponent(
      "Your account has been closed. Public identity was removed and future sign-in was disabled."
    )}`
  );
}
