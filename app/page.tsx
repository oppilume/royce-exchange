import Link from "next/link";
import { ArrowRight, Gem, ShieldCheck, Sparkles, Vote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { MarketCard } from "@/components/market-card";
import { getFeaturedMarkets, getHomepageStats, getLeaderboard } from "@/lib/data";
import { formatGems } from "@/lib/utils";

export default async function HomePage() {
  const [featuredMarkets, stats, leaderboard] = await Promise.all([
    getFeaturedMarkets(),
    getHomepageStats(),
    getLeaderboard("all")
  ]);

  return (
    <div className="space-y-10 pb-10">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-hero p-8 shadow-glow sm:p-12">
        <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Badge tone="gold">Jayhawk Gems</Badge>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold tracking-tight text-cream sm:text-6xl">
              Trade the moments your teachers are definitely about to say out loud.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-cream/72">
              Jayhawk Gems is a school-specific prediction market where students use artificial
              currency to buy YES or NO on class phrases, announcements, catchphrases, and study
              topics. No real money. No order books. Just clean, credible market gameplay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button>
                  Start trading
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/markets">
                <Button variant="secondary">Browse live markets</Button>
              </Link>
            </div>
          </div>

          <div className="glass-panel space-y-5 p-6">
            <div className="data-grid">
              <StatCard label="Markets" value={String(stats.marketCount)} />
              <StatCard label="Traders" value={String(stats.traderCount)} />
              <StatCard label="Volume" value={formatGems(stats.totalVolume)} />
              <StatCard label="Conversion" value="100 Gems = $1" />
            </div>
            <div className="grid gap-3">
              <ValueRow
                icon={<Sparkles className="h-4 w-4" />}
                title="Simple pricing"
                text="YES and NO run from 0 to 100, with each trade nudging the odds."
              />
              <ValueRow
                icon={<Vote className="h-4 w-4" />}
                title="Honor-system resolution"
                text="Only market participants can vote after class, with admin override for disputes."
              />
              <ValueRow
                icon={<ShieldCheck className="h-4 w-4" />}
                title="School-safe wallet model"
                text="Admins credit balances manually after external deposits. No Stripe in v1."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Featured markets</p>
            <h2 className="mt-1 text-3xl font-semibold">Live class action</h2>
          </div>
          <Link href="/markets" className="text-sm text-cream/70 hover:text-cream">
            See all markets
          </Link>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {featuredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">How it works</p>
          <div className="mt-5 space-y-4">
            <HowCard
              icon={<Gem className="h-5 w-5" />}
              title="Get credited Gems"
              text="Admins manually credit your artificial Jayhawk Gems balance after external deposits."
            />
            <HowCard
              icon={<Vote className="h-5 w-5" />}
              title="Trade teacher markets"
              text="Buy YES or NO on class-specific markets before trading closes."
            />
            <HowCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Resolve after class"
              text="Participants vote on the outcome, and admins can settle edge cases."
            />
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Leaderboard preview</p>
              <h2 className="mt-1 text-3xl font-semibold">Top traders</h2>
            </div>
            <Link href="/leaderboard" className="text-sm text-cream/70 hover:text-cream">
              Full board
            </Link>
          </div>
          <LeaderboardTable rows={leaderboard.slice(0, 6)} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-cream/50">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function ValueRow({
  icon,
  title,
  text
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-gold">
        {icon}
        <span className="font-semibold text-cream">{title}</span>
      </div>
      <p className="text-sm text-cream/68">{text}</p>
    </div>
  );
}

function HowCard({
  icon,
  title,
  text
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gold/15 p-3 text-gold">{icon}</div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm text-cream/68">{text}</p>
        </div>
      </div>
    </div>
  );
}
