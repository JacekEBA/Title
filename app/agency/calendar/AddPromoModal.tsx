'use client';

import { useState, useTransition } from 'react';
import { createPromoAction } from './actions';

export default function AddPromoModal({
  orgOptions,
  templateOptions,
}: {
  orgOptions: { id: string; name: string }[];
  templateOptions: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        Add RCS Promo
      </button>
      {open && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="section-title">Schedule RCS Promo</h3>
            <form
              action={(fd) => {
                start(async () => {
                  await createPromoAction({
                    org_id: fd.get('org_id') as string,
                    course_id: (fd.get('course_id') as string) || null,
                    template_id: fd.get('template_id') as string,
                    name: fd.get('name') as string,
                    description: (fd.get('description') as string) || null,
                    scheduled_at: fd.get('scheduled_at') as string,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                  });
                  setOpen(false);
                });
              }}
            >
              <label className="lbl">
                Organization
                <select name="org_id" required defaultValue="">
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
                Course (optional)
                <input name="course_id" placeholder="UUID or leave blank" />
              </label>

              <label className="lbl">
                Template
                <select name="template_id" required defaultValue="">
                  <option value="" disabled>
                    Select template
                  </option>
                  {templateOptions.map((t) => (
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
                <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>
                  Cancel
                </button>
                <button className="btn-primary" disabled={pending}>
                  {pending ? 'Scheduling…' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
