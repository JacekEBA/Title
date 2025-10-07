"use server";

import { createSupabaseActionClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPromoAction(input: {
  org_id: string;
  course_id: string; // now required
  template_id: string;
  name: string;
  description: string | null;
  scheduled_at: string; // ISO from datetime-local
  timezone: string;
}) {
  // Defensive validation with friendly messages
  if (!input.org_id) throw new Error("Organization is required.");
  if (!input.course_id) throw new Error("Course is required.");
  if (!input.template_id) throw new Error("Template is required.");
  if (!input.name) throw new Error("Name is required.");
  if (!input.scheduled_at) throw new Error("Scheduled time is required.");

  const supabase = createSupabaseActionClient();

  // 1) create campaign
  const { data: c, error: cErr } = await supabase
    .from("campaigns")
    .insert({
      org_id: input.org_id,
      course_id: input.course_id,
      template_id: input.template_id,
      name: input.name,
      description: input.description,
      audience_kind: "all_contacts",
      scheduled_at: input.scheduled_at,
      timezone: input.timezone,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (cErr) throw new Error(cErr.message || "Failed to create campaign");

  // 2) calendar event
  const { error: eErr } = await supabase.from("calendar_events").insert({
    org_id: input.org_id,
    course_id: input.course_id,
    event_type: "campaign_send",
    campaign_id: c.id,
    title: input.name,
    description: input.description,
    start_time: input.scheduled_at,
    end_time: input.scheduled_at,
    event_status: "scheduled",
  });

  if (eErr) throw new Error(eErr.message || "Failed to create calendar event");

  // 3) send job
  const { error: jErr } = await supabase.from("send_jobs").insert({
    campaign_id: c.id,
    run_at: input.scheduled_at,
    status: "pending",
  });

  if (jErr) throw new Error(jErr.message || "Failed to schedule job");

  revalidatePath("/agency/calendar");
}
