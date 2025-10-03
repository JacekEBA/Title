import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export default async function SegmentsPage() {
  const {
    profile: { role },
  } = await requireProfile();

  const supabase = supabaseServer();
  const { data: segments } = await supabase
    .from("contact_lists")
    .select("id, name, description, is_dynamic, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Segments</h1>
        <p className="text-sm text-muted-foreground">
          Build dynamic filters by tags, opt-in status, past replies, and course activity.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-[2fr,1fr,1fr] gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <span>Name</span>
          <span>Type</span>
          <span>Created</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {(segments ?? []).map((segment) => (
            <div
              key={segment.id}
              className="grid grid-cols-[2fr,1fr,1fr] items-start gap-2 rounded-xl border bg-background px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-medium">{segment.name}</p>
                {segment.description && (
                  <p className="text-xs text-muted-foreground">{segment.description}</p>
                )}
              </div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {segment.is_dynamic ? "Dynamic" : "Static"}
              </span>
              <span className="text-xs text-muted-foreground">
                {segment.created_at
                  ? new Date(segment.created_at).toLocaleDateString()
                  : "--"}
              </span>
            </div>
          ))}
        </div>
        {role === "owner" && (
          <div className="mt-6 rounded-xl border border-dashed bg-muted/40 p-4 text-sm">
            <p className="font-semibold">Need a new segment?</p>
            <p className="text-muted-foreground">
              Use the segment builder to combine tags, visit recency, spend, and opt-in signals. Live counts update as you add rules.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
