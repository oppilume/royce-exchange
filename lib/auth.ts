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

  return { user, profile };
}

export async function requireUser() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) {
    redirect("/login");
  }

  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/markets");
  }

  return { user, profile };
}
