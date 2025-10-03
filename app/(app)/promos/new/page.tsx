import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function NewPromoPage() {
  const {
    profile: { role },
  } = await requireProfile();

  if (role !== "owner") {
    notFound();
  }

  const supabase = supabaseServer();
  const { data: templates } = await supabase
    .from("rcs_templates")
    .select("id, name")
    .order("name")
    .limit(20);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Schedule a promo</h1>
        <p className="text-sm text-muted-foreground">
          Attach an RCS campaign template, target a course, and pick the delivery window.
        </p>
      </header>

      <form className="grid gap-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="title">
            Promo title
          </label>
          <input
            id="title"
            required
            placeholder="Early Bird Tee Times"
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="template">
            Template
          </label>
          <select
            id="template"
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select template</option>
            {templates?.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="start">
              Start
            </label>
            <input
              id="start"
              type="datetime-local"
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="end">
              End
            </label>
            <input
              id="end"
              type="datetime-local"
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="course">
            Target course(s)
          </label>
          <textarea
            id="course"
            rows={2}
            placeholder="Select courses in the scheduler UI"
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">
            Multi-course promos default to organization timezone. Adjust send windows per location if needed.
          </p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="notes">
            Notes for client approval (optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
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
