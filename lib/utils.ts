import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const PACIFIC_TIMEZONE = "America/Los_Angeles";
const pacificDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TIMEZONE,
  month: "short",
  day: "numeric",
  year: "numeric"
});
const pacificDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TIMEZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZoneName: "short"
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGems(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return `${numeric.toLocaleString()} Gems`;
}

export function formatUsdHint(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0) / 100;
  return `$${numeric.toFixed(2)} est.`;
}

export function formatPct(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

export function formatDatePst(value: string | Date) {
  return pacificDateFormatter.format(new Date(value));
}

export function formatDateTimePst(value: string | Date) {
  return pacificDateTimeFormatter.format(new Date(value));
}

export function formatMarketPhase(market: {
  status: string;
  trading_close_at?: string;
  vote_start_at?: string;
  resolved_outcome?: string | null;
}) {
  if (market.status === "pending") return "Pending review";
  if (market.status === "rejected") return "Rejected";
  if (market.status === "deleted") return "Deleted";
  if (market.resolved_outcome || market.status === "resolved") return "Resolved";

  const now = new Date();
  const close = market.trading_close_at ? new Date(market.trading_close_at) : null;
  const voteStart = market.vote_start_at ? new Date(market.vote_start_at) : null;

  if (close && now < close) return "Live";
  if (close && voteStart && now >= close && now < voteStart) return "Closed";
  if (voteStart && now >= voteStart) return "Voting";
  return "Approved";
}

export function yesNoPrice(yesPrice: number) {
  return {
    yes: yesPrice,
    no: 100 - yesPrice
  };
}
