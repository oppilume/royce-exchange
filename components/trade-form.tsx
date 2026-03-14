import { placeTradeAction } from "@/app/actions/market";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPriceGems } from "@/lib/utils";

export function TradeForm({
  marketId,
  yesPrice
}: {
  marketId: string;
  yesPrice: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-cream/70">
        Buy YES or NO like a normal prediction market. Your stake goes into the market pool, and the
        winning side shares the losing side's pool when the market resolves.
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TradeSideForm marketId={marketId} side="yes" price={yesPrice} />
        <TradeSideForm marketId={marketId} side="no" price={100 - yesPrice} />
      </div>
    </div>
  );
}

function TradeSideForm({
  marketId,
  side,
  price
}: {
  marketId: string;
  side: "yes" | "no";
  price: number;
}) {
  const action = async (formData: FormData) => {
    "use server";
    return placeTradeAction(formData);
  };

  return (
    <form action={action} className="glass-panel space-y-4 p-5">
      <input type="hidden" name="market_id" value={marketId} />
      <input type="hidden" name="side" value={side} />
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-cream/45">Buy {side.toUpperCase()}</p>
        <p className={`mt-1 text-3xl font-semibold ${side === "yes" ? "text-mint" : "text-danger"}`}>
          {formatPriceGems(price)}
        </p>
        <p className="mt-2 text-sm text-cream/60">
          {formatPriceGems(price)} per share at the current market price.
        </p>
      </div>
      <label className="block">
        <span className="mb-2 block text-sm text-cream/70">Contracts</span>
        <Input min={1} max={500} step={1} type="number" name="quantity" defaultValue={10} />
      </label>
      <Button fullWidth type="submit" variant={side === "yes" ? "primary" : "secondary"}>
        Buy {side.toUpperCase()}
      </Button>
    </form>
  );
}
