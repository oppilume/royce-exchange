import Link from "next/link";
import { Gem, LayoutDashboard, LineChart, PlusSquare, Trophy } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatGems, formatUsdHint } from "@/lib/utils";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let profile:
    | {
        username: string;
        role: string;
        gem_balance: number;
      }
    | null = null;

  if (user) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("username, role, gem_balance")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
        <div className="app-shell flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold text-ink shadow-lg shadow-gold/20">
                <Gem className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">Jayhawk Gems</p>
                <p className="text-xs text-cream/55">School-market prototype</p>
              </div>
            </Link>
            <Badge tone="gold">100 Gems = $1</Badge>
          </div>

          <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 md:flex">
            <NavLink href="/markets" label="Markets" icon={<LineChart className="h-4 w-4" />} />
            <NavLink href="/create" label="Create" icon={<PlusSquare className="h-4 w-4" />} />
            <NavLink href="/portfolio" label="Portfolio" icon={<Gem className="h-4 w-4" />} />
            <NavLink href="/leaderboard" label="Leaderboard" icon={<Trophy className="h-4 w-4" />} />
            {profile?.role === "admin" ? (
              <NavLink
                href="/admin"
                label="Admin"
                icon={<LayoutDashboard className="h-4 w-4" />}
              />
            ) : null}
          </nav>

          <div className="flex items-center gap-3">
            {profile ? (
              <>
                <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right sm:block">
                  <p className="text-sm font-semibold">{formatGems(profile.gem_balance)}</p>
                  <p className="text-xs text-cream/55">{formatUsdHint(profile.gem_balance)}</p>
                </div>
                <Link href={`/u/${profile.username}`} className="text-sm font-medium text-cream/80">
                  @{profile.username}
                </Link>
                <form action={logoutAction}>
                  <button className="text-sm font-medium text-cream/65 hover:text-cream" type="submit">
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-cream/75 hover:text-cream">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-2xl bg-gold px-4 py-2 text-sm font-semibold text-ink"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="app-shell py-8">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-cream/70 hover:bg-white/6 hover:text-cream"
    >
      {icon}
      {label}
    </Link>
  );
}
