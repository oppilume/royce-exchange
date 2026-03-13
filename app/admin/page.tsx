import {
  AdminTabs,
  AuditLogPanel,
  BalanceAdjustmentPanel,
  DepositRequestsPanel,
  MarketsAdminPanel,
  OverviewPanel,
  UsersAdminPanel
} from "@/components/admin-panels";
import { StatusBanner } from "@/components/status-banner";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const data = await getAdminDashboardData();
  const tab = params.tab ?? "overview";
  const error = params.error;
  const status = params.status;
  const pendingRequestCount = data.deposits.filter((row) => row.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Admin dashboard</p>
        <h1 className="mt-1 text-4xl font-semibold">Moderation, funding, and settlement</h1>
        <p className="mt-3 max-w-3xl text-cream/65">
          Review deposit requests, moderate markets, manage users, and audit every meaningful admin action.
        </p>
      </div>

      <AdminTabs currentTab={tab} />
      <StatusBanner error={error} status={status} />

      {tab === "overview" ? (
        <OverviewPanel
          stats={data.stats}
          pendingCount={data.pending.length}
          requestCount={pendingRequestCount}
          userCount={data.users.length}
        />
      ) : null}
      {tab === "requests" ? <DepositRequestsPanel requests={data.deposits} /> : null}
      {tab === "markets" ? <MarketsAdminPanel pending={data.pending} markets={data.marketList} /> : null}
      {tab === "users" ? <UsersAdminPanel users={data.users} /> : null}
      {tab === "adjustments" ? <BalanceAdjustmentPanel users={data.users} /> : null}
      {tab === "audit" ? (
        <AuditLogPanel auditLog={data.auditLog} balanceTransactions={data.balanceTransactions} />
      ) : null}
    </div>
  );
}
