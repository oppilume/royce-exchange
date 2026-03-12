import {
  BalanceAdjustmentPanel,
  DepositRequestsPanel,
  PendingMarketsPanel
} from "@/components/admin-panels";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/data";
import { formatGems } from "@/lib/utils";

export default async function AdminPage() {
  await requireAdmin();
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Admin dashboard</p>
        <h1 className="mt-1 text-4xl font-semibold">Moderation, funding, and settlement</h1>
      </div>

      <section className="data-grid">
        <AdminMetric label="Pending proposals" value={String(data.pending.length)} />
        <AdminMetric label="Open deposit requests" value={String(data.deposits.filter((row) => row.status === "pending").length)} />
        <AdminMetric label="Total platform volume" value={formatGems(data.stats?.total_volume ?? 0)} />
        <AdminMetric label="Resolved markets" value={String(data.stats?.resolved_markets ?? 0)} />
      </section>

      <PendingMarketsPanel markets={data.pending} />
      <DepositRequestsPanel requests={data.deposits} />
      <BalanceAdjustmentPanel users={data.users} />
    </div>
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
