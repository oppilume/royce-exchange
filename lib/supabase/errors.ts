type SupabaseLikeError = {
  code?: string;
  message?: string;
} | null | undefined;

export function isSchemaCacheMissingError(error: SupabaseLikeError) {
  return (
    error?.code === "PGRST205" ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("Could not find the table")
  );
}

export const SCHEMA_NOT_READY_MESSAGE =
  "The Supabase database is not initialized yet. Run supabase/schema.sql in your Supabase project, then try again.";
