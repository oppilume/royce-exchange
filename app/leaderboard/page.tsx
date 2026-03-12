import Link from "next/link";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { getLeaderboard } from "@/lib/data";

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const tab = params.tab === "weekly" ? "weekly" : "all";
  const rows = await getLeaderboard(tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Leaderboard</p>
          <h1 className="mt-1 text-4xl font-semibold">Public performance board</h1>
          <p className="mt-3 max-w-2xl text-cream/68">
            Ranked by total profit, ROI, and consistency across resolved markets.
          </p>
        </div>
        <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          <Link
            href="/leaderboard?tab=all"
            className={`rounded-xl px-4 py-2 text-sm ${tab === "all" ? "bg-gold text-ink" : "text-cream/70"}`}
          >
            All-time
          </Link>
          <Link
            href="/leaderboard?tab=weekly"
            className={`rounded-xl px-4 py-2 text-sm ${tab === "weekly" ? "bg-gold text-ink" : "text-cream/70"}`}
          >
            Weekly
          </Link>
        </div>
      </div>
      <LeaderboardTable rows={rows} />
    </div>
  );
}
