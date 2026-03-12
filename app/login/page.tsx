import Link from "next/link";

import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <form action={loginAction} className="glass-panel space-y-5 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold/70">Log in</p>
          <h1 className="mt-1 text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-cream/65">
            Log in with your username and password.
          </p>
        </div>
        <Input name="username" placeholder="Username" required />
        <Input name="password" type="password" placeholder="Password" required />
        <Button type="submit" fullWidth>
          Log in
        </Button>
        <p className="text-center text-sm text-cream/65">
          Need an account?{" "}
          <Link href="/signup" className="text-gold">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
