import Link from "next/link";

import { signUpAction } from "@/app/actions/auth";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="mx-auto max-w-md">
      <form action={signUpAction} className="glass-panel space-y-5 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Create account</p>
          <h1 className="mt-1 text-3xl font-semibold">Join Royce Exchange</h1>
          <p className="mt-2 text-sm text-cream/65">
            Create your account with an email and password. You can add a display username later.
          </p>
        </div>
        <StatusBanner error={error} />
        <Input name="username" placeholder="Public username" required />
        <Input name="email" type="email" placeholder="Email" required />
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
