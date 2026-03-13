import { closeAccountAction } from "@/app/actions/auth";
import { submitDepositRequestAction } from "@/app/actions/market";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { getPortfolioData } from "@/lib/data";
import { formatGems, formatPct, formatUsdHint } from "@/lib/utils";

export default async function PortfolioPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { user, profile } = await requireUser();
  const portfolio = await getPortfolioData(user.id);
  const headingLabel = profile?.username ? `@${profile.username}` : user.email ?? "Your account";

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Portfolio</p>
          <h1 className="mt-1 text-4xl font-semibold">{headingLabel}</h1>
          <div className="mt-6 data-grid">
            <Metric
              label="Balance"
              value={formatGems(profile?.gem_balance ?? 0)}
              hint={formatUsdHint(profile?.gem_balance ?? 0)}
            />
            <Metric label="Profit" value={formatGems(portfolio.stats?.total_profit ?? 0)} hint="All time" />
            <Metric label="ROI" value={formatPct(portfolio.stats?.roi_percent ?? 0)} hint="Across resolved markets" />
            <Metric label="Win rate" value={formatPct(portfolio.stats?.win_rate ?? 0)} hint="Resolved picks" />
          </div>
        </div>

        <form action={submitDepositRequestAction} className="glass-panel space-y-4 p-6">
          <p className="text-lg font-semibold">Request a deposit credit</p>
          <p className="text-sm text-cream/65">
            v1 uses manual admin credits after external payment. No Stripe is integrated yet.
          </p>
          <StatusBanner error={params.error} status={params.status} />
          <Input type="number" name="amount_gems" placeholder="2500" required />
          <Input name="note" placeholder="Venmo sent to club treasurer" />
          <Button type="submit">Send request</Button>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="glass-panel overflow-hidden">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-2xl font-semibold">Positions</h2>
          </div>
          <div className="divide-y divide-white/6">
            {portfolio.positions.length ? (
              portfolio.positions.map((position) => (
                <div key={position.id} className="px-6 py-5">
                  <p className="font-semibold">{position.question}</p>
                  <p className="mt-2 text-sm text-cream/60">
                    YES {position.yes_shares} / NO {position.no_shares} · Cost basis{" "}
                    {formatGems(position.total_cost_basis)}
                  </p>
                  <p className="mt-1 text-sm text-cream/60">Latest trade {new Date(position.latest_trade_at).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-sm text-cream/65">No positions yet.</div>
            )}
          </div>
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-2xl font-semibold">Transaction history</h2>
          </div>
          <div className="divide-y divide-white/6">
            {portfolio.transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between px-6 py-4 text-sm">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-cream/55">{new Date(transaction.created_at).toLocaleString()}</p>
                </div>
                <p className={Number(transaction.amount_gems) >= 0 ? "text-mint" : "text-danger"}>
                  {Number(transaction.amount_gems) >= 0 ? "+" : ""}
                  {formatGems(transaction.amount_gems)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-semibold">Deposit requests</h2>
        </div>
        <div className="divide-y divide-white/6">
          {portfolio.depositRequests.length ? (
            portfolio.depositRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between px-6 py-4 text-sm">
                <div>
                  <p className="font-medium">{formatGems(request.amount_gems)}</p>
                  <p className="text-cream/55">{request.note ?? "No note"}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium capitalize">{request.status}</p>
                  <p className="text-cream/45">{new Date(request.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-sm text-cream/65">No deposit requests yet.</div>
          )}
        </div>
      </section>

      <section className="glass-panel grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Account safety</p>
          <h2 className="mt-1 text-2xl font-semibold">Close account</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-cream/65">
            This closes your login access and removes your public username/profile identity.
            Historical trades, market participation, and accounting records stay in place so
            market history remains consistent.
          </p>
          <p className="mt-3 text-sm text-cream/50">
            This action is intended to be permanent for this MVP.
          </p>
        </div>

        <form action={closeAccountAction} className="rounded-3xl border border-danger/25 bg-danger/10 p-5">
          <p className="text-sm font-semibold text-danger">Confirm closure</p>
          <p className="mt-2 text-sm text-cream/65">
            Type <span className="font-semibold text-cream">CLOSE MY ACCOUNT</span> to continue.
          </p>
          <Input
            className="mt-4"
            name="confirmation"
            placeholder="CLOSE MY ACCOUNT"
            required
          />
          <Button className="mt-4" type="submit" variant="danger">
            Close account
          </Button>
        </form>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-cream/50">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-cream/55">{hint}</p>
    </div>
  );
}
