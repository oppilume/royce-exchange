import { MarketProposalForm } from "@/components/market-proposal-form";
import { StatusBanner } from "@/components/status-banner";
import { requireUser } from "@/lib/auth";

export default async function CreateMarketPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Create a market</p>
        <h1 className="mt-1 text-4xl font-semibold">Propose a block prediction</h1>
        <p className="mt-3 max-w-2xl text-cream/68">
          Keep it focused on the day, block, class, teacher, and phrase you want the market to track.
        </p>
        <p className="mt-2 text-sm text-cream/55">
          Time fields on this page are treated as Pacific Time.
        </p>
      </div>
      <StatusBanner error={params.error} status={params.status} />
      <MarketProposalForm />
    </div>
  );
}
