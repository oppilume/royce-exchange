import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <div className="glass-panel p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/70">404</p>
        <h1 className="mt-2 text-4xl font-semibold">That market isn’t on the board</h1>
        <p className="mt-3 text-cream/68">
          The link may be stale, deleted, or still waiting on admin approval.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/markets">
            <Button>Browse markets</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
