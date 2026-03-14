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
const pacificPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGems(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return `${numeric.toLocaleString()} Gems`;
}

export function formatPriceGems(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString()} Jayhawk Gems`;
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

export function pacificLocalInputToUtcIso(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const targetUtcEquivalent = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  let guess = targetUtcEquivalent;

  for (let index = 0; index < 4; index += 1) {
    const zonedParts = pacificPartsFormatter.formatToParts(new Date(guess));
    const represented = {
      year: Number(zonedParts.find((part) => part.type === "year")?.value ?? year),
      month: Number(zonedParts.find((part) => part.type === "month")?.value ?? month),
      day: Number(zonedParts.find((part) => part.type === "day")?.value ?? day),
      hour: Number(zonedParts.find((part) => part.type === "hour")?.value ?? hour),
      minute: Number(zonedParts.find((part) => part.type === "minute")?.value ?? minute)
    };

    const representedUtcEquivalent = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute
    );

    const diff = targetUtcEquivalent - representedUtcEquivalent;
    guess += diff;

    if (diff === 0) break;
  }

  return new Date(guess).toISOString();
}

export function formatMarketPhase(market: {
  status: string;
  trading_close_at?: string;
  vote_start_at?: string;
  vote_end_at?: string | null;
  resolved_outcome?: string | null;
}) {
  if (market.status === "pending") return "Pending review";
  if (market.status === "rejected") return "Rejected";
  if (market.status === "deleted") return "Deleted";
  if (market.resolved_outcome || market.status === "resolved") return "Resolved";

  const now = new Date();
  const close = market.trading_close_at ? new Date(market.trading_close_at) : null;
  const voteStart = market.vote_start_at ? new Date(market.vote_start_at) : null;
  const voteEnd = market.vote_end_at ? new Date(market.vote_end_at) : null;

  if (close && now < close) return "Live";
  if (close && voteStart && now >= close && now < voteStart) return "Closed";
  if (voteStart && (!voteEnd || now < voteEnd) && now >= voteStart) return "Voting";
  if (voteEnd && now >= voteEnd) return "Awaiting resolution";
  return "Approved";
}

export function yesNoPrice(yesPrice: number) {
  return {
    yes: yesPrice,
    no: 100 - yesPrice
  };
}
