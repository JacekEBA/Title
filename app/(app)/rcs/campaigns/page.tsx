import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Megaphone, Clock, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export default async function CampaignsPage() {
  const {
    profile: { role },
  } = await requireProfile();

  const supabase = supabaseServer();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title, status, scheduled_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">RCS campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Compose rich cards, target the right segments, and track delivery in one place.
          </p>
        </div>
        {role === "owner" && (
          <a
            href="/rcs/campaigns/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Megaphone className="h-4 w-4" />
            New campaign
          </a>
        )}
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <span>Name</span>
          <span>Scheduled</span>
          <span>Status</span>
          <span>Owner</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {(campaigns ?? SAMPLE_CAMPAIGNS).map((campaign) => {
            const rawStatus = (campaign.status ?? "draft") as CampaignStatus;
            const status: CampaignStatus =
              ["draft", "queued", "sending", "sent", "canceled"].includes(
                rawStatus
              )
                ? rawStatus
                : "draft";

            return (
              <div
                key={campaign.id}
                className="grid grid-cols-4 items-center gap-2 rounded-xl border bg-background px-4 py-3 shadow-sm"
              >
                <span className="font-medium">{campaign.title}</span>
                <span className="text-muted-foreground">
                  {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : "Send now"}
                </span>
                <StatusPill status={status} />
                <span className="text-muted-foreground">Title Ops</span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Campaign metrics roll up to analytics within a few minutes of send completion.
        </p>
      </section>
    </div>
  );
}

type CampaignStatus = "draft" | "queued" | "sending" | "sent" | "canceled";

function StatusPill({ status }: { status: CampaignStatus }) {
  const iconByStatus: Record<CampaignStatus, ReactNode> = {
    draft: <Clock className="h-3.5 w-3.5" />,
    queued: <Clock className="h-3.5 w-3.5" />,
    sending: <Clock className="h-3.5 w-3.5" />,
    sent: <CheckCircle2 className="h-3.5 w-3.5" />,
    canceled: <Clock className="h-3.5 w-3.5" />,
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium">
      {iconByStatus[status]}
      {label}
    </span>
  );
}

const SAMPLE_CAMPAIGNS: Array<{
  id: string;
  title: string;
  status: CampaignStatus;
  scheduled_at: string;
}> = [
  {
    id: "placeholder-1",
    title: "Junior Golf Open",
    status: "queued",
    scheduled_at: new Date().toISOString(),
  },
  {
    id: "placeholder-2",
    title: "Lesson Reminder",
    status: "sent",
    scheduled_at: new Date().toISOString(),
  },
];
