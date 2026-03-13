import { Badge } from "@/components/ui/badge";

export function StatusBanner({
  error,
  status
}: {
  error?: string;
  status?: string;
}) {
  if (!error && !status) return null;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        error
          ? "border-danger/35 bg-danger/10 text-danger"
          : "border-mint/35 bg-mint/10 text-mint"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Badge tone={error ? "danger" : "mint"}>{error ? "Issue" : "Updated"}</Badge>
      </div>
      <p>{error ?? status}</p>
    </div>
  );
}
