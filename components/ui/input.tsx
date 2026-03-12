import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-cream outline-none ring-0 transition placeholder:text-cream/35 focus:border-sky/50 focus:bg-white/8",
        props.className
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-cream outline-none ring-0 transition placeholder:text-cream/35 focus:border-sky/50 focus:bg-white/8",
        props.className
      )}
    />
  );
}
