import { submitMarketProposalAction } from "@/app/actions/market";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function MarketProposalForm() {
  const action = async (formData: FormData) => {
    "use server";
    return submitMarketProposalAction(formData);
  };

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
      <div className="glass-panel grid gap-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="market_type" value="exact_phrase" />
          <Field label="Teacher">
            <Input name="teacher_name" placeholder="Mr. Thompson" required />
          </Field>
          <Field label="Class">
            <Input name="course_name" placeholder="AP U.S. History" required />
          </Field>
          <Field label="Phrase">
            <Input name="prediction_text" placeholder='"pop quiz" or "midterm"' required />
          </Field>
          <Field label="Block">
            <Input name="class_period" placeholder="B" required />
          </Field>
          <Field label="Day">
            <Input name="market_date" type="date" required />
          </Field>
          <Field label="Trading closes">
            <Input name="trading_close_at" type="datetime-local" required />
          </Field>
          <Field label="Vote starts">
            <Input name="vote_start_at" type="datetime-local" required />
          </Field>
        </div>

        <Field label="Clarification notes">
          <Textarea
            name="notes"
            placeholder="Optional context about what counts, timing, or any class-specific details."
          />
        </Field>

        <Button type="submit" className="mt-2">
          Submit for review
        </Button>
      </div>

      <div className="glass-panel space-y-5 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Proposal preview</p>
          <h3 className="mt-2 text-2xl font-semibold">Will [Teacher] say or mention [Phrase] during [Block] block [Class]?</h3>
          <p className="mt-3 text-sm text-cream/65">
            Approved markets become immutable except for admin deletion or resolution.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-cream/75">
          <p className="mb-2 font-semibold text-cream">Proposal checklist</p>
          <ul className="space-y-2">
            <li>Trading must close before class starts.</li>
            <li>Voting should open after class ends.</li>
            <li>All date and time inputs are interpreted in Pacific Time.</li>
            <li>Use specific wording so honor-system voting is easier.</li>
            <li>Only approved markets go live publicly.</li>
          </ul>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-cream/70">{label}</span>
      {children}
    </label>
  );
}
