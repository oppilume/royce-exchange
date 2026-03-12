import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getUserProfileData } from "@/lib/data";
import { formatGems, formatPct } from "@/lib/utils";

export default async function PublicProfilePage({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getUserProfileData(username);
  if (!data) notFound();

  return (
    <div className="space-y-8">
      <section className="glass-panel p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="gold">Public profile</Badge>
            <h1 className="mt-4 text-4xl font-semibold">@{data.profile.username}</h1>
            <p className="mt-3 max-w-2xl text-cream/68">{data.profile.bio ?? "No bio added yet."}</p>
          </div>
          <div className="data-grid">
            <ProfileMetric label="Profit" value={formatGems(data.profile.total_profit)} />
            <ProfileMetric label="ROI" value={formatPct(data.profile.roi_percent)} />
            <ProfileMetric label="Win rate" value={formatPct(data.profile.win_rate)} />
            <ProfileMetric label="Trades" value={String(data.profile.total_trades)} />
          </div>
        </div>
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-semibold">Recent activity</h2>
        </div>
        <div className="divide-y divide-white/6">
          {data.activity.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-6 py-4 text-sm">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-cream/55">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <p className={Number(item.amount_gems) >= 0 ? "text-mint" : "text-danger"}>
                {Number(item.amount_gems) >= 0 ? "+" : ""}
                {formatGems(item.amount_gems)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-cream/50">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
