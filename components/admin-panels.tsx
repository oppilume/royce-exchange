import {
  adjustBalanceAction,
  approveMarketAction,
  deleteMarketAction,
  rejectMarketAction,
  resolveMarketAction,
  reviewDepositRequestAction
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatGems } from "@/lib/utils";

export function PendingMarketsPanel({ markets }: { markets: Record<string, unknown>[] }) {
  return (
    <div className="glass-panel p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Pending markets</p>
          <h2 className="mt-1 text-2xl font-semibold">Review queue</h2>
        </div>
        <Badge tone="gold">{markets.length} waiting</Badge>
      </div>
      <div className="space-y-4">
        {markets.map((market) => (
          <div key={String(market.id)} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-lg font-semibold">{String(market.question)}</p>
            <p className="mt-2 text-sm text-cream/65">
              {String(market.teacher_name)} · {String(market.course_name)} · Period {String(market.class_period)}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <form action={approveMarketAction}>
                <input type="hidden" name="market_id" value={String(market.id)} />
                <Button type="submit">Approve</Button>
              </form>
              <form action={deleteMarketAction}>
                <input type="hidden" name="market_id" value={String(market.id)} />
                <Button type="submit" variant="danger">
                  Delete
                </Button>
              </form>
            </div>
            <form action={rejectMarketAction} className="mt-4 space-y-3">
              <input type="hidden" name="market_id" value={String(market.id)} />
              <Textarea name="reason" placeholder="Reason for rejection" />
              <Button type="submit" variant="secondary">
                Reject with note
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BalanceAdjustmentPanel({ users }: { users: Record<string, unknown>[] }) {
  return (
    <div className="glass-panel p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Manual credits</p>
      <h2 className="mt-1 text-2xl font-semibold">Adjust balances</h2>
      <div className="mt-5 grid gap-4">
        {users.map((user) => (
          <form
            key={String(user.id)}
            action={adjustBalanceAction}
            className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 lg:grid-cols-[1.3fr_0.8fr_1.2fr_auto]"
          >
            <input type="hidden" name="user_id" value={String(user.id)} />
            <div>
              <p className="font-semibold">@{String(user.username)}</p>
              <p className="text-sm text-cream/60">{formatGems(Number(user.gem_balance))}</p>
            </div>
            <Input name="amount_gems" type="number" placeholder="2500" required />
            <Input name="reason" placeholder="External deposit" required />
            <Button type="submit">Apply</Button>
          </form>
        ))}
      </div>
    </div>
  );
}

export function DepositRequestsPanel({ requests }: { requests: Record<string, unknown>[] }) {
  return (
    <div className="glass-panel p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Funding queue</p>
      <h2 className="mt-1 text-2xl font-semibold">Deposit requests</h2>
      <div className="mt-5 space-y-4">
        {requests.map((request) => (
          <div key={String(request.id)} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold">
              @{String(request.username ?? "user")} requested{" "}
              {formatGems(Number(request.amount_gems))}
            </p>
            <p className="mt-2 text-sm text-cream/60">{String(request.note ?? "No note")}</p>
            <div className="mt-4 flex gap-3">
              <form action={reviewDepositRequestAction}>
                <input type="hidden" name="request_id" value={String(request.id)} />
                <input type="hidden" name="decision" value="approved" />
                <Button type="submit">Approve</Button>
              </form>
              <form action={reviewDepositRequestAction}>
                <input type="hidden" name="request_id" value={String(request.id)} />
                <input type="hidden" name="decision" value="rejected" />
                <Button type="submit" variant="secondary">
                  Reject
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResolveMarketPanel({ marketId }: { marketId: string }) {
  return (
    <form action={resolveMarketAction} className="glass-panel space-y-4 p-5">
      <input type="hidden" name="market_id" value={marketId} />
      <p className="text-lg font-semibold">Admin resolution</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-2xl border border-mint/25 bg-mint/10 p-4">
          <input className="mr-2" type="radio" name="outcome" value="yes" defaultChecked />
          Resolve YES
        </label>
        <label className="rounded-2xl border border-danger/25 bg-danger/10 p-4">
          <input className="mr-2" type="radio" name="outcome" value="no" />
          Resolve NO
        </label>
      </div>
      <Textarea name="admin_note" placeholder="Optional override note" />
      <Button type="submit">Resolve market</Button>
    </form>
  );
}
