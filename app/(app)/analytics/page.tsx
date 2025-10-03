import { supabaseServer } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function AnalyticsPage() {
  await requireProfile();

  const supabase = supabaseServer();
  const { data: metrics } = await supabase
    .from("v_org_campaigns")
    .select(
      "campaigns_count, sent_total, delivered_total, read_total, reply_rate, click_rate, last_sent_at"
    )
    .limit(5);

  const rows = metrics ?? SAMPLE_METRICS;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Monitor engagement across campaigns, courses, and segments. Export CSVs for deeper analysis.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2">Campaigns</th>
                <th className="py-2">Sent</th>
                <th className="py-2">Delivered</th>
                <th className="py-2">Read</th>
                <th className="py-2">Reply rate</th>
                <th className="py-2">Click rate</th>
                <th className="py-2">Last sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="py-2 font-medium">{formatNumber(row.campaigns_count)}</td>
                  <td className="py-2">{formatNumber(row.sent_total)}</td>
                  <td className="py-2">{formatNumber(row.delivered_total)}</td>
                  <td className="py-2">{formatNumber(row.read_total)}</td>
                  <td className="py-2">{formatPercent(row.reply_rate ?? 0)}</td>
                  <td className="py-2">{formatPercent(row.click_rate ?? 0)}</td>
                  <td className="py-2 text-muted-foreground">
                    {row.last_sent_at
                      ? new Date(row.last_sent_at).toLocaleDateString()
                      : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>Breakdowns by course, segment, and send window land here.</p>
          <button className="rounded-full border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
            Export CSV
          </button>
        </div>
      </section>
    </div>
  );
}

const SAMPLE_METRICS = [
  {
    campaigns_count: 12,
    sent_total: 8450,
    delivered_total: 8123,
    read_total: 6201,
    reply_rate: 0.084,
    click_rate: 0.162,
    last_sent_at: new Date().toISOString(),
  },
];
