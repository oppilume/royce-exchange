import Link from "next/link";
import { Clock3, GraduationCap, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDatePst, formatDateTimePst, formatGems, formatMarketPhase, yesNoPrice } from "@/lib/utils";
import type { MarketRow } from "@/lib/types";

export function MarketCard({ market }: { market: MarketRow & { phase?: string } }) {
  const prices = yesNoPrice(market.yes_price);
  const phase = market.phase ?? formatMarketPhase(market);

  return (
    <Link
      href={`/markets/${market.id}`}
      className="glass-panel block overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="gold">{phase}</Badge>
            <Badge>{market.market_type === "exact_phrase" ? "Exact phrase" : "Broader mention"}</Badge>
            {market.category_name ? <Badge tone="sky">{market.category_name}</Badge> : null}
          </div>
          <h3 className="max-w-xl text-lg font-semibold leading-tight text-cream">{market.question}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
          <p className="text-xs text-cream/55">Volume</p>
          <p className="text-sm font-semibold">{formatGems(market.total_volume)}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 text-xs text-cream/70">
        <MetaChip icon={<GraduationCap className="h-3.5 w-3.5" />} text={market.teacher_name} />
        <MetaChip icon={<Tag className="h-3.5 w-3.5" />} text={market.course_name} />
        <MetaChip text={`Period ${market.class_period}`} />
        <MetaChip text={formatDatePst(market.market_date)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="rounded-2xl border border-mint/20 bg-mint/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-mint/70">Yes</p>
          <p className="text-2xl font-semibold text-mint">{prices.yes}c</p>
        </div>
        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-danger/70">No</p>
          <p className="text-2xl font-semibold text-danger">{prices.no}c</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-cream/70">
          <Clock3 className="h-4 w-4" />
          Closes {formatDateTimePst(market.trading_close_at)}
        </div>
      </div>
    </Link>
  );
}

function MetaChip({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
      {icon}
      {text}
    </span>
  );
}
