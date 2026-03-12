import { submitVoteAction } from "@/app/actions/market";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function VoteForm({ marketId }: { marketId: string }) {
  const action = async (formData: FormData) => {
    "use server";
    return submitVoteAction(formData);
  };

  return (
    <form action={action} className="glass-panel space-y-4 p-5">
      <input type="hidden" name="market_id" value={marketId} />
      <div className="flex gap-3">
        <label className="flex-1 rounded-2xl border border-mint/25 bg-mint/10 p-4">
          <input className="mr-2" type="radio" name="vote" value="yes" defaultChecked />
          YES happened
        </label>
        <label className="flex-1 rounded-2xl border border-danger/25 bg-danger/10 p-4">
          <input className="mr-2" type="radio" name="vote" value="no" />
          NO did not happen
        </label>
      </div>
      <label className="block">
        <span className="mb-2 block text-sm text-cream/70">Optional comment</span>
        <Textarea name="comment" placeholder="What did you hear in class?" />
      </label>
      <Button type="submit">Submit vote</Button>
    </form>
  );
}
