"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !email.includes("@") || password.length < 8) {
    throw new Error("Use a valid email address and a password with at least 8 characters.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Unable to create the account.");
  }

  const { error: profileInsertError } = await admin.from("profiles").insert({
    id: data.user.id
  });

  if (profileInsertError) {
    throw new Error(profileInsertError.message);
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
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
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
