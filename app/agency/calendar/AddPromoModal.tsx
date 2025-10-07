"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPromoAction } from "./actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Org = { id: string; name: string };
type Tmpl = { id: string; name: string; org_id: string };

export default function AddPromoModal({
  orgOptions,
  templateOptions,
}: {
  orgOptions: Org[];
  templateOptions: Tmpl[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const [orgId, setOrgId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [err, setErr] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const resetForm = () => {
    setOrgId("");
    setCourseId("");
    setCourses([]);
    setTemplateId("");
  };

  // Load courses whenever org changes
  useEffect(() => {
    setCourseId("");
    setCourses([]);
    setTemplateId("");
    setErr("");
    if (!orgId) return;
    (async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name", { ascending: true });
      if (error) {
        setErr("Could not load courses. Please check your access.");
        return;
      }
      setCourses(data ?? []);
    })();
  }, [orgId, supabase]);

  // Filter templates by selected org
  const templatesForOrg = useMemo(
    () => (orgId ? templateOptions.filter((t) => t.org_id === orgId) : []),
    [orgId, templateOptions],
  );

  return (
    <>
      <button
        className="btn-primary"
        onClick={() => {
          resetForm();
          setErr("");
          setOpen(true);
        }}
      >
        Add RCS Promo
      </button>
      {open && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="section-title">Schedule RCS Promo</h3>

            {err && (
              <div className="alert-error" style={{ marginBottom: 10 }}>
                {err}
              </div>
            )}

            <form
              action={(fd) => {
                setErr("");
                start(async () => {
                  try {
                    const payload = {
                      org_id: fd.get("org_id") as string,
                      course_id: fd.get("course_id") as string,
                      template_id: fd.get("template_id") as string,
                      name: fd.get("name") as string,
                      description: (fd.get("description") as string) || null,
                      scheduled_at: fd.get("scheduled_at") as string,
                      timezone:
                        Intl.DateTimeFormat().resolvedOptions().timeZone ||
                        "UTC",
                    };
                    await createPromoAction(payload);
                    resetForm();
                    setOpen(false);
                  } catch (e: any) {
                    setErr(e?.message || "Failed to schedule promo.");
                  }
                });
              }}
            >
              <label className="lbl">
                Organization
                <select
                  name="org_id"
                  required
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                >
                  <option value="" disabled>
                    Select org
                  </option>
                  {orgOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="lbl">
                Course
                <select
                  name="course_id"
                  required
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={!orgId || !courses.length}
                >
                  <option value="" disabled>
                    {!orgId
                      ? "Select an org first"
                      : courses.length
                        ? "Select course"
                        : "No courses found"}
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="lbl">
                Template
                <select
                  key={orgId}
                  name="template_id"
                  required
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  disabled={!orgId || !templatesForOrg.length}
                >
                  <option value="" disabled>
                    {!orgId
                      ? "Select an org first"
                      : templatesForOrg.length
                        ? "Select template"
                        : "No templates found"}
                  </option>
                  {templatesForOrg.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="lbl">
                Name/title
                <input name="name" required placeholder="Promo title" />
              </label>

              <label className="lbl">
                Description
                <textarea name="description" placeholder="Optional notes" />
              </label>

              <label className="lbl">
                Scheduled time
                <input type="datetime-local" name="scheduled_at" required />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    resetForm();
                    setErr("");
                    setOpen(false);
                  }}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  disabled={pending || !orgId || !courseId || !templateId}
                >
                  {pending ? "Scheduling…" : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
