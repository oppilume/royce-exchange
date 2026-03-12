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

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Browse markets</p>
          <h1 className="mt-1 text-4xl font-semibold">School predictions with actual structure</h1>
          <p className="mt-3 max-w-2xl text-cream/68">
            Filter by teacher, course, period, date, category, or status. Trade closes before class
            starts and voting opens afterward.
          </p>
        </div>
      </section>

      <form className="glass-panel grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-7">
        <Input name="search" placeholder="Search markets" defaultValue={params.search} />
        <Input name="teacher" placeholder="Teacher" defaultValue={params.teacher} />
        <Input name="course" placeholder="Course" defaultValue={params.course} />
        <Input name="period" placeholder="Period" defaultValue={params.period} />
        <Input name="category" placeholder="Category" defaultValue={params.category} />
        <Input name="date" type="date" defaultValue={params.date} />
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
      </form>

      {markets.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
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
