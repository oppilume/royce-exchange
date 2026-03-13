import Link from "next/link";

import {
  adjustBalanceAction,
  approveMarketAction,
  deleteMarketAction,
  rejectMarketAction,
  resolveMarketAction,
  reviewDepositRequestAction,
  updateUserRoleAction
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatGems } from "@/lib/utils";

export function AdminTabs({ currentTab }: { currentTab: string }) {
  const tabs = [
    ["overview", "Overview"],
    ["requests", "Deposit Requests"],
    ["markets", "Markets"],
    ["users", "Users"],
    ["adjustments", "Balance Adjustments"],
    ["audit", "Audit Log"]
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(([value, label]) => (
        <Link
          key={value}
          href={`/admin?tab=${value}`}
          className={`rounded-2xl px-4 py-2 text-sm ${
            currentTab === value
              ? "bg-gold font-semibold text-ink"
              : "border border-white/10 bg-white/5 text-cream/70"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function OverviewPanel({
  stats,
  pendingCount,
  requestCount,
  userCount
}: {
  stats: Record<string, unknown> | null | undefined;
  pendingCount: number;
  requestCount: number;
  userCount: number;
}) {
  return (
    <section className="data-grid">
      <AdminMetric label="Pending proposals" value={String(pendingCount)} />
      <AdminMetric label="Pending deposits" value={String(requestCount)} />
      <AdminMetric label="Total users" value={String(userCount)} />
      <AdminMetric label="Platform volume" value={formatGems(Number(stats?.total_volume ?? 0))} />
      <AdminMetric label="Active markets" value={String(stats?.active_markets ?? 0)} />
      <AdminMetric label="Resolved markets" value={String(stats?.resolved_markets ?? 0)} />
    </section>
  );
}

export function DepositRequestsPanel({ requests }: { requests: Record<string, unknown>[] }) {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Funding queue</p>
        <h2 className="mt-1 text-2xl font-semibold">Deposit requests</h2>
      </div>
      <div className="divide-y divide-white/6">
        {requests.length ? (
          requests.map((request) => (
            <div key={String(request.id)} className="grid gap-4 px-6 py-5 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">@{String(request.username ?? "user")}</p>
                  <Badge tone={request.status === "pending" ? "gold" : request.status === "approved" ? "mint" : "danger"}>
                    {String(request.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-lg font-semibold">{formatGems(Number(request.amount_gems))}</p>
                <p className="mt-2 text-sm text-cream/60">{String(request.note ?? "No request note.")}</p>
                {request.admin_note ? (
                  <p className="mt-2 text-sm text-cream/50">Admin note: {String(request.admin_note)}</p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <form action={reviewDepositRequestAction} className="space-y-3">
                  <input type="hidden" name="request_id" value={String(request.id)} />
                  <Textarea name="admin_note" placeholder="Optional review note" />
                  <div className="flex gap-3">
                    <button type="submit" name="decision" value="approved" className="flex-1 rounded-2xl bg-gold px-4 py-2.5 text-sm font-semibold text-ink">
                      Approve
                    </button>
                    <button type="submit" name="decision" value="rejected" className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-cream">
                      Reject
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-10 text-sm text-cream/60">No deposit requests yet.</div>
        )}
      </div>
    </div>
  );
}

export function MarketsAdminPanel({
  pending,
  markets
}: {
  pending: Record<string, unknown>[];
  markets: Record<string, unknown>[];
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Pending review</p>
            <h2 className="mt-1 text-2xl font-semibold">Proposal queue</h2>
          </div>
          <Badge tone="gold">{pending.length} waiting</Badge>
        </div>
        <div className="space-y-4">
          {pending.length ? (
            pending.map((market) => (
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
            ))
          ) : (
            <p className="text-sm text-cream/60">No pending proposals.</p>
          )}
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Market operations</p>
          <h2 className="mt-1 text-2xl font-semibold">Recent markets</h2>
        </div>
        <div className="divide-y divide-white/6">
          {markets.map((market) => (
            <div key={String(market.id)} className="grid gap-4 px-6 py-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="font-semibold">{String(market.question)}</p>
                <p className="mt-2 text-sm text-cream/60">
                  {String(market.teacher_name)} · {String(market.course_name)} · Status {String(market.phase ?? market.status)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <form action={resolveMarketAction}>
                  <input type="hidden" name="market_id" value={String(market.id)} />
                  <div className="mb-3 flex gap-3">
                    <label className="flex-1 rounded-2xl border border-mint/25 bg-mint/10 p-3 text-sm">
                      <input className="mr-2" type="radio" name="outcome" value="yes" defaultChecked />
                      YES
                    </label>
                    <label className="flex-1 rounded-2xl border border-danger/25 bg-danger/10 p-3 text-sm">
                      <input className="mr-2" type="radio" name="outcome" value="no" />
                      NO
                    </label>
                  </div>
                  <Textarea name="admin_note" placeholder="Optional resolution note" />
                  <div className="mt-3">
                    <Button type="submit">Resolve</Button>
                  </div>
                </form>
                <form action={deleteMarketAction} className="mt-3">
                    <input type="hidden" name="market_id" value={String(market.id)} />
                  <Button type="submit" variant="danger">
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UsersAdminPanel({ users }: { users: Record<string, unknown>[] }) {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Users</p>
        <h2 className="mt-1 text-2xl font-semibold">Accounts and roles</h2>
      </div>
      <div className="divide-y divide-white/6">
        {users.map((user) => (
          <div key={String(user.id)} className="grid gap-4 px-6 py-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">@{String(user.username ?? "pending-profile")}</p>
                <Badge tone={String(user.role) === "admin" ? "gold" : "neutral"}>{String(user.role)}</Badge>
              </div>
              <p className="mt-2 text-sm text-cream/60">{String(user.email ?? "No email found")}</p>
              <p className="mt-1 text-sm text-cream/50">Balance {formatGems(Number(user.gem_balance ?? 0))}</p>
            </div>
            <form action={updateUserRoleAction} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <input type="hidden" name="user_id" value={String(user.id)} />
              <div className="mb-3">
                <label className="mb-2 block text-sm text-cream/70">Role</label>
                <select
                  name="role"
                  defaultValue={String(user.role)}
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button type="submit">Update role</Button>
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
              <p className="font-semibold">@{String(user.username ?? "pending-profile")}</p>
              <p className="text-sm text-cream/60">{formatGems(Number(user.gem_balance ?? 0))}</p>
            </div>
            <Input name="amount_gems" type="number" placeholder="2500" required />
            <Input name="reason" placeholder="External deposit or correction" required />
            <Button type="submit">Apply</Button>
          </form>
        ))}
      </div>
    </div>
  );
}

export function AuditLogPanel({ auditLog, balanceTransactions }: { auditLog: Record<string, unknown>[]; balanceTransactions: Record<string, unknown>[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-semibold">Admin audit log</h2>
        </div>
        <div className="divide-y divide-white/6">
          {auditLog.length ? (
            auditLog.map((item) => (
              <div key={String(item.id)} className="px-6 py-4 text-sm">
                <p className="font-medium">{String(item.action_type)}</p>
                <p className="mt-1 text-cream/60">
                  {String(item.target_type)} · {String(item.target_id)}
                </p>
                <p className="mt-1 text-cream/45">{new Date(String(item.created_at)).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-sm text-cream/60">No audit entries yet.</div>
          )}
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-semibold">Balance transactions</h2>
        </div>
        <div className="divide-y divide-white/6">
          {balanceTransactions.length ? (
            balanceTransactions.map((item) => (
              <div key={String(item.id)} className="px-6 py-4 text-sm">
                <p className="font-medium">{String(item.type)}</p>
                <p className="mt-1 text-cream/60">
                  {Number(item.amount_gems) >= 0 ? "+" : ""}
                  {formatGems(Number(item.amount_gems))}
                </p>
                <p className="mt-1 text-cream/45">{String(item.note ?? "No note")}</p>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-sm text-cream/60">No balance transactions yet.</div>
          )}
        </div>
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

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-cream/45">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
