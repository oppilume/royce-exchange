import { MarketCard } from "@/components/market-card";
import { Input } from "@/components/ui/input";
import { getMarkets } from "@/lib/data";

export default async function MarketsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const markets = await getMarkets(params);
  const liveMarkets = markets.filter((market) => market.phase === "Live");
  const previousMarkets = markets.filter((market) => market.phase !== "Live");

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Browse markets</p>
          <h1 className="mt-1 text-4xl font-semibold">School predictions with actual structure</h1>
          <p className="mt-3 max-w-2xl text-cream/68">
            Filter by teacher, class, block, date, or status. Live markets stay separate from previous markets.
          </p>
        </div>
      </section>

      <form className="glass-panel grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-8">
        <Input name="search" placeholder="Search markets" defaultValue={params.search} />
        <Input name="teacher" placeholder="Teacher" defaultValue={params.teacher} />
        <Input name="course" placeholder="Class" defaultValue={params.course} />
        <Input name="period" placeholder="Block" defaultValue={params.period} />
        <Input name="date" type="date" defaultValue={params.date} />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="Live">Live</option>
          <option value="Voting">Voting</option>
          <option value="Awaiting resolution">Awaiting resolution</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select
          name="sort"
          defaultValue={params.sort ?? "activity"}
          className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm"
        >
          <option value="activity">Highest activity</option>
          <option value="newest">Newest</option>
          <option value="volume">Volume</option>
          <option value="closing">Closing soon</option>
        </select>
        <div className="flex gap-3">
          <button className="rounded-2xl bg-gold px-4 py-3 text-sm font-semibold text-ink" type="submit">
            Apply
          </button>
          <a href="/markets" className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-cream/70">
            Reset
          </a>
        </div>
      </form>

      {markets.length ? (
        <div className="space-y-10">
          <section className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Live markets</p>
              <h2 className="mt-1 text-3xl font-semibold">Open now</h2>
            </div>
            {liveMarkets.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {liveMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-sm text-cream/65">No live markets match those filters.</div>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Previous Markets</p>
              <h2 className="mt-1 text-3xl font-semibold">Closed or resolved</h2>
            </div>
            {previousMarkets.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {previousMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-sm text-cream/65">No previous markets match those filters.</div>
            )}
          </section>
        </div>
      ) : (
        <div className="glass-panel p-10 text-center">
          <h2 className="text-2xl font-semibold">No markets match those filters</h2>
          <p className="mt-2 text-cream/65">
            Try a wider search, or propose a new market for your class.
          </p>
        </div>
      )}
    </div>
  );
}
