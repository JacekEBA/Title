import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

const MONTHLY_BLASTS = [
  { month: "January", name: "New Year Kickoff", status: "Planned" },
  { month: "April", name: "Masters Week", status: "Queued" },
  { month: "July", name: "Independence Day", status: "Sent" },
  { month: "December", name: "Holiday Card", status: "Planned" },
];

export default async function BlastsPage() {
  const {
    profile: { role },
  } = await requireProfile();

  if (role !== "owner") {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Holiday blasts</h1>
        <p className="text-sm text-muted-foreground">
          Pre-built monthly promos that keep every course engaged. Each blast references an RCS template you can tweak.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {MONTHLY_BLASTS.map((blast) => (
            <div key={blast.month} className="rounded-xl border bg-background p-4 shadow-sm">
              <p className="text-xs uppercase text-muted-foreground">{blast.month}</p>
              <p className="text-lg font-semibold">{blast.name}</p>
              <p className="text-xs text-muted-foreground">Status: {blast.status}</p>
              <button className="mt-4 inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
                Preview template
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
