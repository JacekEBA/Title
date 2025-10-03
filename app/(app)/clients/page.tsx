import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function ClientsPage() {
  const {
    profile: { role },
  } = await requireProfile();

  if (role !== "owner") {
    notFound();
  }

  const supabase = supabaseServer();
  const { data: clients } = await supabase
    .from("organizations")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-sm text-muted-foreground">
          Manage golf courses and resorts on the Title platform. Invite client admins and monitor integration health.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-[2fr,1fr,1fr] gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <span>Organization</span>
          <span>Status</span>
          <span>Added</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {(clients ?? SAMPLE_CLIENTS).map((client) => (
            <div
              key={client.id}
              className="grid grid-cols-[2fr,1fr,1fr] items-center gap-2 rounded-xl border bg-background px-4 py-3 shadow-sm"
            >
              <span className="font-medium">{client.name}</span>
              <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                {client.status ?? "active"}
              </span>
              <span className="text-xs text-muted-foreground">
                {client.created_at
                  ? new Date(client.created_at).toLocaleDateString()
                  : "--"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-dashed bg-muted/40 p-4 text-sm">
          <p className="font-semibold">Add a new client</p>
          <p className="text-muted-foreground">
            Capture org name, billing plan, timezone, and courses. Assign at least one client admin so they can approve promos and view analytics.
          </p>
        </div>
      </section>
    </div>
  );
}

const SAMPLE_CLIENTS = [
  {
    id: "sample-client",
    name: "Green Acres Golf Club",
    status: "active",
    created_at: new Date().toISOString(),
  },
];
