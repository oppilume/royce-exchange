import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSchemaCacheMissingError } from "@/lib/supabase/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getSessionProfile() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (isSchemaCacheMissingError(error)) {
    return { user, profile: null };
  }

  if (error) {
    throw new Error(error.message);
  }

  if (profile) {
    return { user, profile };
  }

  const fallbackUsername =
    typeof user.user_metadata?.username === "string" && user.user_metadata.username.trim().length >= 3
      ? user.user_metadata.username.trim().toLowerCase()
      : null;

  const { data: insertedProfile, error: insertError } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      username: fallbackUsername
    })
    .select("*")
    .maybeSingle();

  if (isSchemaCacheMissingError(insertError)) {
    return { user, profile: null };
  }

  if (insertError) {
    return { user, profile: null };
  }

  return { user, profile: insertedProfile ?? null };
}

export async function requireUser() {
  const { user, profile } = await getSessionProfile();
  if (!user) {
    redirect("/login");
  }

  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await getSessionProfile();
  if (!user) {
    redirect("/login");
  }

  if (!profile || profile.role !== "admin") {
    redirect("/markets");
  }

  return { user, profile };
}
