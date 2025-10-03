export type Nullable<T> = T | null | undefined;

export function cn(...classes: Nullable<string>[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function usd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function getRollingWeekLabel(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const weeksDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  const labelIndex = Math.max(0, Math.min(4, 4 - weeksDiff));
  return `W${labelIndex + 1}`;
}
