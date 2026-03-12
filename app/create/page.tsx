import { MarketProposalForm } from "@/components/market-proposal-form";
import { requireUser } from "@/lib/auth";

export default async function CreateMarketPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Create a market</p>
        <h1 className="mt-1 text-4xl font-semibold">Propose a class prediction</h1>
        <p className="mt-3 max-w-2xl text-cream/68">
          Every proposal enters a review queue before it becomes publicly tradable.
        </p>
      </div>
      <MarketProposalForm />
    </div>
  );
}
