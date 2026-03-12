import Link from "next/link";

import { signUpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-md">
      <form action={signUpAction} className="glass-panel space-y-5 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Create account</p>
          <h1 className="mt-1 text-3xl font-semibold">Join Jayhawk Gems</h1>
          <p className="mt-2 text-sm text-cream/65">
            Accounts are username-first, while Supabase auth stores a hidden internal email.
          </p>
        </div>
        <Input name="username" placeholder="Username" required />
        <Input name="password" type="password" placeholder="Password (8+ chars)" required />
        <Button type="submit" fullWidth>
          Create account
        </Button>
        <p className="text-center text-sm text-cream/65">
          Already have one?{" "}
          <Link href="/login" className="text-gold">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
