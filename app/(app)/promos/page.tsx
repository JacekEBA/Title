import { requireProfile } from "@/lib/auth";
import { CalendarDays, Filter, MapPin } from "lucide-react";

const VIEWS = ["Month", "Week", "Day"];

const SAMPLE_EVENTS = [
  {
    id: "1",
    title: "Member Mixer",
    course: "Pine Hills",
    status: "Scheduled",
    window: "Aug 14 · 4:00 – 6:00 PM",
  },
  {
    id: "2",
    title: "Labor Day Blast",
    course: "All locations",
    status: "Draft",
    window: "Aug 29 · 9:00 AM",
  },
  {
    id: "3",
    title: "Nine & Dine",
    course: "River Bend",
    status: "Sent",
    window: "Aug 2 · 12:00 PM",
  },
];

export default async function PromoCalendarPage() {
  const {
    profile: { role },
  } = await requireProfile();

  const canEdit = role === "owner";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Promo calendar</h1>
          <p className="text-sm text-muted-foreground">
            Plan rich messaging and course promotions by month, week, or day.
          </p>
        </div>
        {canEdit && (
          <a
            href="/promos/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <CalendarDays className="h-4 w-4" />
            Schedule promo
          </a>
        )}
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium">
            <Filter className="h-3.5 w-3.5" /> Filters
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            All locations
          </div>
          <div className="ml-auto flex gap-2">
            {VIEWS.map((view) => (
              <button
                key={view}
                type="button"
                className="rounded-full border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="grid gap-4 rounded-xl bg-muted/30 p-4 text-sm">
            <p className="text-muted-foreground">
              Interactive calendar coming soon. Drag across the grid to set promo windows, tap any block to edit the attached campaign, and switch between month/week/day views.
            </p>
            <div className="grid h-72 place-items-center rounded-xl border border-dashed border-muted-foreground/40 bg-background/80 text-muted-foreground">
              Calendar grid placeholder
            </div>
          </div>
          <aside className="space-y-4 text-sm">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground">Upcoming promos</h2>
            <ul className="space-y-3">
              {SAMPLE_EVENTS.map((event) => (
                <li key={event.id} className="rounded-xl border bg-background px-3 py-3 shadow-sm">
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.window}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{event.course}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide">
                      {event.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Clients see the same schedule in read-only mode. Owners control scheduling, approvals, and changes.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
