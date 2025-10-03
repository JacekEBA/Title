import { describe, it, expect } from "vitest";
import { usd, getRollingWeekLabel } from "../lib/utils";


describe('usd()', () => {
it('formats dollars with two decimals', () => {
expect(usd(1234.5)).toBe('$1,234.50');
expect(usd(0)).toBe('$0.00');
});
it('handles large numbers', () => {
expect(usd(1000000)).toBe('$1,000,000.00');
});
it('handles negatives', () => {
expect(usd(-42)).toBe('-$42.00');
});
});


describe('getRollingWeekLabel()', () => {
const now = new Date('2024-06-30T00:00:00Z');
it('returns W5 for current week window', () => {
expect(getRollingWeekLabel(new Date('2024-06-29T00:00:00Z'), now)).toBe('W5');
});
it('rolls back one week → W4', () => {
expect(getRollingWeekLabel(new Date('2024-06-22T00:00:00Z'), now)).toBe('W4');
});
it('minimum is W1 for old dates', () => {
expect(getRollingWeekLabel(new Date('2024-01-01T00:00:00Z'), now)).toBe('W1');
});
it('never returns W0 or W>5', () => {
expect(['W0', 'W6'].includes(getRollingWeekLabel(new Date('2000-01-01'), now))).toBe(false);
});
});
