// components/DashboardOverview.tsx
import { BarChart3, Building2, PanelsTopLeft, Users } from "lucide-react";

export default function DashboardOverview() {
  // TODO: replace these numbers with real counts from your DB
  const KPIS = [
    { label: "Organizations", value: 0, icon: Building2 },
    { label: "Courses", value: 0, icon: PanelsTopLeft },
    { label: "Users", value: 0, icon: Users },
  ];

  const RECENT = [
    { name: "Autumn Weekend Special - 20% Off", status: "draft", sent: 0, open: "—", conv: "—", date: "—" },
    { name: "Member Championship", status: "planned", sent: 0, open: "—", conv: "—", date: "—" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome / Performance banner */}
      <section className="rounded-xl border overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
          <h2 className="text-lg font-semibold">Welcome back 👋</h2>
          <p className="opacity-90">
            Here’s how your organization is performing. Keep building momentum!
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-sm">
            <BarChart3 className="h-4 w-4" />
            <span>+7.3% engagement vs. last month</span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {KPIS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
              </div>
              <div className="rounded-xl border bg-background p-2">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Recent Campaigns (example table) */}
      <section className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-semibold">Recent Campaigns</h3>
          <button className="rounded-lg border bg-background px-3 py-2 text-sm hover:bg-accent/60">
            Request Campaign
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-t">
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Sent</th>
                <th className="px-5 py-3 font-medium">Open Rate</th>
                <th className="px-5 py-3 font-medium">Conversions</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map((c, i) => (
                <tr key={i} className="border-t">
                  <td className="px-5 py-3">{c.name}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full border px-2 py-0.5 text-xs">{c.status}</span>
                  </td>
                  <td className="px-5 py-3">{c.sent}</td>
                  <td className="px-5 py-3">{c.open}</td>
                  <td className="px-5 py-3">{c.conv}</td>
                  <td className="px-5 py-3">{c.date}</td>
                </tr>
              ))}
              {RECENT.length === 0 && (
                <tr className="border-t">
                  <td className="px-5 py-8 text-center text-muted-foreground" colSpan={6}>
                    No campaigns yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
