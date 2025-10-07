import Calendar from "@/components/Calendar";
import AddPromoModal from "./AddPromoModal";
import { getAccessibleOrgs, getCalendarEventsForOwner } from "@/lib/agency";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Agency • Calendar" };

export default async function Page() {
  const from = new Date(Date.now() - 100060602430).toISOString();
  const to = new Date(Date.now() + 100060602460).toISOString();
  const eventsRaw = await getCalendarEventsForOwner({ from, to });
  const events = eventsRaw.map((e) => ({
    id: e.id,
    title: e.title ?? "Promo",
    start: e.start_time,
    end: e.end_time ?? e.start_time,
  }));

  const orgs = await getAccessibleOrgs();

  const supabase = createSupabaseServerClient();
  // include org_id so the modal can filter templates by selected org
  const { data: templates } = await supabase
    .from("rcs_templates")
    .select("id, name, org_id")
    .order("name", { ascending: true });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <AddPromoModal
          orgOptions={orgs.map((o) => ({ id: o.id, name: o.name }))}
          templateOptions={(templates ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            org_id: t.org_id,
          }))}
        />
      </div>
      <div className="card">
        <Calendar events={events} />
      </div>
    </div>
  );
}
