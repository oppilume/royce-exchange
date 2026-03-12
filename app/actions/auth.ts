"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export async function signUpAction(formData: FormData): Promise<void> {
  const username = normalizeUsername(String(formData.get("username") || ""));
  const password = String(formData.get("password") || "");

  if (username.length < 3 || password.length < 8) {
    throw new Error("Use a username with at least 3 characters and a password with at least 8.");
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    throw new Error("That username is already taken.");
  }

  const email = `${username}@jayhawkgems.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username
    }
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create the account.");
  }

  const supabase = await createServerSupabaseClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    throw new Error(signInError.message);
  }

  revalidatePath("/");
  redirect("/markets");
}

export async function loginAction(formData: FormData): Promise<void> {
  const username = normalizeUsername(String(formData.get("username") || ""));
  const password = String(formData.get("password") || "");
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("auth_email")
    .eq("username", username)
    .maybeSingle();

  if (!profile?.auth_email) {
    throw new Error("No account was found for that username.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.auth_email,
    password
  });

  if (error) {
    throw new Error("Incorrect username or password.");
  }

  revalidatePath("/");
  redirect("/markets");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
