'use client';
import { Plus } from 'lucide-react';
import { useState, useTransition } from 'react';

export default function AddPromoModal({
  orgOptions,
  courseOptionsByOrg,
  templateOptions,
  action,
}: {
  orgOptions: { id: string; name: string }[];
  courseOptionsByOrg: Record<string, { id: string; name: string }[]>;
  templateOptions: { id: string; name: string }[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [orgId, setOrgId] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const courses = orgId ? courseOptionsByOrg[orgId] ?? [] : [];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={16} /> Add RCS Promo
      </button>
      {open && (
        <div
          className="card"
          style={{ position: 'fixed', inset: '10% 20%', background: '#fff', zIndex: 50 }}
        >
          <h3 style={{ marginBottom: 12 }}>Schedule RCS Promo</h3>
          <form style={{ display: 'grid', gap: 10 }} onSubmit={handleSubmit}>
            <label>
              Organization
              <select
                name="org_id"
                className="input"
                required
                value={orgId}
                onChange={(event) => setOrgId(event.target.value)}
              >
                <option value="">Select organization</option>
                {orgOptions.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Course (optional)
              <select name="course_id" className="input" defaultValue="">
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Template
              <select name="template_id" className="input" required defaultValue="">
                <option value="" disabled>
                  Select a template
                </option>
                {templateOptions.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <div className="col">
                <label>
                  Audience kind
                  <select name="audience_kind" className="input" required defaultValue="all_contacts">
                    <option value="all_contacts">All contacts</option>
                    <option value="contact_list">Contact list</option>
                    <option value="smart_list">Smart list</option>
                  </select>
                </label>
              </div>
              <div className="col">
                <label>
                  Audience ref (list id)
                  <input className="input" name="audience_ref" placeholder="uuid or empty" />
                </label>
              </div>
            </div>
            <label>
              Name
              <input className="input" name="name" placeholder="Promo name" required />
            </label>
            <label>
              Description
              <textarea className="input" name="description" placeholder="Optional description" />
            </label>
            <div className="row">
              <div className="col">
                <label>
                  Scheduled time (ISO)
                  <input className="input" name="scheduled_at" type="datetime-local" required />
                </label>
              </div>
              <div className="col">
                <label>
                  Timezone
                  <input className="input" name="timezone" placeholder="America/Chicago" required />
                </label>
              </div>
            </div>
            <label>
              Max sends per minute (optional)
              <input className="input" name="max_sends_per_minute" type="number" placeholder="e.g. 200" />
            </label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
