import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function NewCampaignPage() {
  const {
    profile: { role },
  } = await requireProfile();

  if (role !== "owner") {
    notFound();
  }

  const supabase = supabaseServer();
  const { data: segments } = await supabase
    .from("contact_lists")
    .select("id, name, is_dynamic")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: templates } = await supabase
    .from("rcs_templates")
    .select("id, name")
    .order("name")
    .limit(20);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Compose RCS campaign</h1>
        <p className="text-sm text-muted-foreground">
          Build the message, pick your target segment, and schedule the send window.
        </p>
      </header>

      <form className="grid gap-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="template">
              Template
            </label>
            <select
              id="template"
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Start from scratch</option>
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="schedule">
              Schedule
            </label>
            <input
              id="schedule"
              type="datetime-local"
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to send immediately in the org default timezone.
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="headline">
            Message headline
          </label>
          <input
            id="headline"
            placeholder="Get ready for the Member-Guest"
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="body">
            Message body
          </label>
          <textarea
            id="body"
            rows={5}
            placeholder="Rich text + media composer coming soon. Drop in card copy, add CTAs, and preview before sending."
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="segment">
            Target segment
          </label>
          <select
            id="segment"
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All opted-in contacts</option>
            {segments?.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.name} {segment.is_dynamic ? "(Dynamic)" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Segment size and opt-in health surface here before you launch.
          </p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="ab-test">
            A/B test variant
          </label>
          <input
            id="ab-test"
            type="checkbox"
            className="h-4 w-4 rounded border"
          />
          <p className="text-xs text-muted-foreground">
            Toggle to experiment with copy or buttons. We&apos;ll split traffic automatically.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Save draft
        </button>
      </form>
    </div>
  );
}
