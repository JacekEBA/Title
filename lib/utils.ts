export function usd(n: number) {
console.debug('[utils.usd] input:', n);
const out = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
console.debug('[utils.usd] output:', out);
return out;
}


/** Map a date within the last ~5 weeks into labels W1..W5 (W5 = most recent). */
export function getRollingWeekLabel(d: Date, now: Date = new Date()): string {
const diffMs = now.getTime() - d.getTime();
const weeksDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
const idx = Math.max(1, 5 - weeksDiff);
const label = `W${idx}`;
console.debug('[utils.getRollingWeekLabel]', { date: d.toISOString?.() ?? d, now: now.toISOString?.() ?? now, weeksDiff, label });
return label;
}
