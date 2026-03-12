import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    fullWidth?: boolean;
  }
>;

export function Button({
  className,
  variant = "primary",
  fullWidth,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-gold text-ink hover:bg-[#ffd979] active:translate-y-px",
        variant === "secondary" &&
          "border border-white/15 bg-white/10 text-cream hover:bg-white/15",
        variant === "ghost" && "text-cream/80 hover:bg-white/8 hover:text-cream",
        variant === "danger" &&
          "border border-danger/40 bg-danger/15 text-danger hover:bg-danger/20",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
