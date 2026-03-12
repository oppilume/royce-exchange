import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatGems, formatPct } from "@/lib/utils";

export function LeaderboardTable({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <div className="glass-panel overflow-hidden">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-white/10 bg-white/5 text-cream/60">
          <tr>
            <th className="px-5 py-4">Trader</th>
            <th className="px-5 py-4">Profit</th>
            <th className="px-5 py-4">ROI</th>
            <th className="px-5 py-4">Win rate</th>
            <th className="px-5 py-4">Markets traded</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id)} className="border-b border-white/6 last:border-b-0">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Badge tone={index < 3 ? "gold" : "neutral"}>#{index + 1}</Badge>
                  <Link href={`/u/${row.username}`} className="font-semibold hover:text-gold">
                    @{String(row.username)}
                  </Link>
                </div>
              </td>
              <td className="px-5 py-4">{formatGems(Number(row.total_profit))}</td>
              <td className="px-5 py-4">{formatPct(row.roi_percent as string | number)}</td>
              <td className="px-5 py-4">{formatPct(row.win_rate as string | number)}</td>
              <td className="px-5 py-4">{String(row.markets_traded)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
