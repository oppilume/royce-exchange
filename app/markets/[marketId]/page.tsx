import { notFound } from "next/navigation";

import { ResolveMarketPanel } from "@/components/admin-panels";
import { StatusBanner } from "@/components/status-banner";
import { Badge } from "@/components/ui/badge";
import { TradeForm } from "@/components/trade-form";
import { VoteForm } from "@/components/vote-form";
import { getSessionProfile } from "@/lib/auth";
import { getMarket } from "@/lib/data";
import { formatDateTimePst, formatGems, formatMarketPhase, yesNoPrice } from "@/lib/utils";

export default async function MarketDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ marketId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { marketId } = await params;
  const query = await searchParams;
  const [{ market, positions, votes }, session] = await Promise.all([
    getMarket(marketId),
    getSessionProfile()
  ]);

  if (!market) notFound();

  const phase = formatMarketPhase(market);
  const price = yesNoPrice(market.yes_price);
  const myPosition = positions.find((entry) => entry.user_id === session.user?.id);
  const canVote = phase === "Voting" && myPosition;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-panel p-7">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone="gold">{phase}</Badge>
            <Badge>{market.teacher_name}</Badge>
            <Badge tone="sky">{market.course_name}</Badge>
            <Badge tone="mint">Period {market.class_period}</Badge>
            {market.category_name ? <Badge>{market.category_name}</Badge> : null}
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight">{market.question}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-cream/72">
            {market.notes ?? "No extra clarification was provided for this market."}
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <InfoCard label="YES price" value={`${price.yes}c`} accent="mint" />
            <InfoCard label="NO price" value={`${price.no}c`} accent="danger" />
            <InfoCard label="Volume" value={formatGems(market.total_volume)} accent="sky" />
          </div>

          <details className="mt-6 max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-cream/70">
            <summary className="cursor-pointer list-none font-medium text-cream">
              How this works
            </summary>
            <p className="mt-3 leading-6">
              Every YES and NO buy adds Gems to that side of the pool. When the market resolves, the winning
              side gets back its own stake plus a proportional share of the losing side's pool.
            </p>
          </details>

          <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-cream/70 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cream/45">Trading closes</p>
              <p className="mt-2 text-cream">{formatDateTimePst(market.trading_close_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cream/45">Voting opens</p>
              <p className="mt-2 text-cream">{formatDateTimePst(market.vote_start_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cream/45">Resolution</p>
              <p className="mt-2 text-cream">
                {market.resolved_outcome
                  ? `${market.resolved_outcome.toUpperCase()} at ${formatDateTimePst(market.resolved_at!)}`
                  : "Awaiting votes or admin action"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <StatusBanner error={query.error} status={query.status} />
          {phase === "Live" ? (
            <TradeForm marketId={market.id} yesPrice={market.yes_price} />
          ) : (
            <div className="glass-panel p-6">
              <p className="text-lg font-semibold">Trading is unavailable</p>
              <p className="mt-2 text-sm text-cream/65">
                This market is currently {phase.toLowerCase()}. Trading only works before the class
                begins.
              </p>
            </div>
          )}

          <div className="glass-panel p-6">
            <p className="text-lg font-semibold">Your position</p>
            {myPosition ? (
              <div className="mt-4 space-y-2 text-sm text-cream/75">
                <p>YES shares: {myPosition.yes_shares}</p>
                <p>NO shares: {myPosition.no_shares}</p>
                <p>Total cost basis: {formatGems(myPosition.total_cost_basis)}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-cream/65">You have not traded this market yet.</p>
            )}
          </div>

          <div className="glass-panel p-6">
            <p className="text-lg font-semibold">Market status</p>
            <div className="mt-4 space-y-2 text-sm text-cream/75">
              <p>{formatGems(positions.reduce((sum, position) => sum + Number(position.yes_cost_basis ?? 0), 0))} staked on YES</p>
              <p>{formatGems(positions.reduce((sum, position) => sum + Number(position.no_cost_basis ?? 0), 0))} staked on NO</p>
              <p className="text-cream/55">Price updates with the balance of the YES and NO pools.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          {canVote ? (
            <VoteForm marketId={market.id} />
          ) : (
            <div className="glass-panel p-6">
              <p className="text-lg font-semibold">Participant voting</p>
              <p className="mt-2 text-sm text-cream/65">
                Voting opens after class ends and only for users with a position in this market.
              </p>
            </div>
          )}

          <div className="glass-panel p-6">
            <p className="text-lg font-semibold">Vote feed</p>
            <div className="mt-4 space-y-3">
              {votes.length ? (
                votes.map((vote) => (
                  <div key={`${vote.created_at}-${vote.comment}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium">
                      {(vote.profiles as { username?: string } | null)?.username ?? "Trader"} voted{" "}
                      {String(vote.vote).toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm text-cream/65">{String(vote.comment ?? "No comment")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-cream/65">No votes yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {session.profile?.role === "admin" ? <ResolveMarketPanel marketId={market.id} /> : null}
          <div className="glass-panel p-6">
            <p className="text-lg font-semibold">Market activity snapshot</p>
            <div className="mt-4 space-y-3">
              {positions.length ? (
                positions.map((position) => (
                  <div
                    key={position.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    <span>{position.username}</span>
                    <span className="text-cream/65">
                      YES {position.yes_shares} / NO {position.no_shares}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-cream/65">No positions have been opened yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent: "mint" | "danger" | "sky";
}) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        accent === "mint"
          ? "border-mint/20 bg-mint/10 text-mint"
          : accent === "danger"
            ? "border-danger/20 bg-danger/10 text-danger"
            : "border-sky/20 bg-sky/10 text-sky"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
