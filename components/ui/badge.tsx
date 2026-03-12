import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function Badge({
  children,
  tone = "neutral"
}: PropsWithChildren<{ tone?: "neutral" | "gold" | "mint" | "sky" | "danger" }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "neutral" && "border-white/10 bg-white/6 text-cream/80",
        tone === "gold" && "border-gold/40 bg-gold/10 text-gold",
        tone === "mint" && "border-mint/40 bg-mint/10 text-mint",
        tone === "sky" && "border-sky/40 bg-sky/10 text-sky",
        tone === "danger" && "border-danger/35 bg-danger/10 text-danger"
      )}
    >
      {children}
    </span>
  );
}
