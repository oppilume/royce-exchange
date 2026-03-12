import { placeTradeAction } from "@/app/actions/market";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TradeForm({
  marketId,
  yesPrice
}: {
  marketId: string;
  yesPrice: number;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TradeSideForm marketId={marketId} side="yes" price={yesPrice} />
      <TradeSideForm marketId={marketId} side="no" price={100 - yesPrice} />
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
        <p className="text-xs uppercase tracking-[0.18em] text-cream/45">
          Buy {side.toUpperCase()}
        </p>
        <p className={`mt-1 text-3xl font-semibold ${side === "yes" ? "text-mint" : "text-danger"}`}>
          {price}c
        </p>
      </div>
      <label className="block">
        <span className="mb-2 block text-sm text-cream/70">Contracts</span>
        <Input min={1} max={500} step={1} type="number" name="quantity" defaultValue={10} />
      </label>
      <Button fullWidth type="submit" variant={side === "yes" ? "primary" : "secondary"}>
        Confirm {side.toUpperCase()}
      </Button>
    </form>
  );
}
