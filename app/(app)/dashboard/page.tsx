import type { ReactNode } from "react";
import { KpiCard } from "@/components/ui/kpi-card";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ArrowUpRight, CalendarPlus, Megaphone, UserPlus } from "lucide-react";
import { requireProfile } from "@/lib/auth";

const KPI_LABELS = [
  "Sent",
  "Delivered",
  "Read",
  "Replies",
  "CTR",
  "Opt-out rate",
] as const;

export default async function DashboardPage() {
  const {
    profile: { role },
  } = await requireProfile();

  const mockTotals = {
    sent: 12450,
    delivered: 12032,
    read: 8455,
    replies: 724,
    ctr: 0.182,
    optOut: 0.014,
  };

  const funnel = [
    { label: "Sent", value: mockTotals.sent },
    { label: "Delivered", value: mockTotals.delivered },
    { label: "Read", value: mockTotals.read },
    { label: "Replies", value: mockTotals.replies },
  ];

  const recent = [
    {
      title: "Summer Twilight Promo",
      description: "Scheduled for Pine Hills · Aug 22, 2024",
    },
    {
      title: "VIP Lesson Reminder",
      description: "Sent to 320 members · 42% read",
    },
    {
      title: "Labor Day Blast",
      description: "Queued · Approval pending from Green Acres",
    },
  ];

  const kpiValues = [
    formatNumber(mockTotals.sent),
    formatNumber(mockTotals.delivered),
    formatNumber(mockTotals.read),
    formatNumber(mockTotals.replies),
    formatPercent(mockTotals.ctr),
    formatPercent(mockTotals.optOut),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Organization overview</h1>
          <p className="text-sm text-muted-foreground">
            Track RCS performance across your courses over the last 30 days.
          </p>
        </div>

        {role === "owner" && (
          <div className="flex flex-wrap gap-2">
            <QuickAction
              href="/rcs/campaigns/new"
              icon={<Megaphone className="h-4 w-4" />}
              label="New Campaign"
            />
            <QuickAction
              href="/promos/new"
              icon={<CalendarPlus className="h-4 w-4" />}
              label="Schedule Promo"
            />
            <QuickAction
              href="/rcs/segments"
              icon={<UserPlus className="h-4 w-4" />}
              label="Create Segment"
            />
          </div>
        )}
      </div>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {KPI_LABELS.map((label, index) => (
          <KpiCard key={label} title={label} value={kpiValues[index]} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Engagement funnel</h2>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          <div className="mt-6 space-y-4">
            {funnel.map((stage) => {
              const percentage = Math.max(
                0,
                Math.round((stage.value / mockTotals.sent) * 100)
              );
              return (
                <div key={stage.label}>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{stage.label}</span>
                    <span>{formatNumber(stage.value)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="mt-6 space-y-4 text-sm">
            {recent.map((item) => (
              <li key={item.title}>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:border-primary hover:text-primary"
    >
      {icon}
      {label}
    </a>
  );
}
