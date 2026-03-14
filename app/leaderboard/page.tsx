import Link from "next/link";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { getLeaderboard, searchPublicProfiles } from "@/lib/data";
import { Input } from "@/components/ui/input";

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const tab = params.tab === "weekly" ? "weekly" : "all";
  const query = params.q?.trim() ?? "";
  const [rows, matches] = await Promise.all([getLeaderboard(tab), searchPublicProfiles(query)]);

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

      <section className="glass-panel p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Account search</p>
        <h2 className="mt-1 text-2xl font-semibold">Find a public profile</h2>
        <form className="mt-4 flex gap-3">
          <Input name="q" placeholder="Search username" defaultValue={query} />
          <input type="hidden" name="tab" value={tab} />
          <button className="rounded-2xl bg-gold px-4 py-3 text-sm font-semibold text-ink" type="submit">
            Search
          </button>
        </form>

        {query ? (
          <div className="mt-5 space-y-3">
            {matches.length ? (
              matches.map((match) => (
                <Link
                  key={String(match.id)}
                  href={`/u/${String(match.username)}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <span>@{String(match.username)}</span>
                  <span className="text-cream/60">{String(match.total_trades)} trades</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-cream/60">No users matched that search.</p>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
