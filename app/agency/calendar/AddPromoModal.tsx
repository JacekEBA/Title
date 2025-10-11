'use client';

import { useState, useEffect, type FormEvent } from 'react';

type Course = {
  id: string;
  name: string;
  timezone: string;
};

type Template = {
  id: string;
  name: string;
};

type Org = {
  id: string;
  name: string;
};

type AddPromoModalProps = {
  orgOptions: Org[];
  courseOptionsByOrg: Record<string, Course[]>;
  templateOptionsByOrg: Record<string, Template[]>;
  action: (formData: FormData) => Promise<void>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium block">{label}</label>
    {children}
  </div>
);

export default function AddPromoModal({
  orgOptions,
  courseOptionsByOrg,
  templateOptionsByOrg,
  action,
}: AddPromoModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [orgId, setOrgId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [timezone, setTimezone] = useState('');
  
  // Drip settings
  const [dripEnabled, setDripEnabled] = useState(false);
  const [dripBatchSize, setDripBatchSize] = useState('10');
  const [dripIntervalMinutes, setDripIntervalMinutes] = useState('5');

  const courses = orgId ? (courseOptionsByOrg[orgId] ?? []) : [];
  const templates = orgId ? (templateOptionsByOrg[orgId] ?? []) : [];

  // Update timezone when course changes
  useEffect(() => {
    const course = courses.find((c) => c.id === courseId);
    setTimezone(course?.timezone ?? '');
  }, [courseId, courses]);

  const resetForm = () => {
    setOrgId('');
    setCourseId('');
    setTemplateId('');
    setName('');
    setDescription('');
    setScheduledAt('');
    setTimezone('');
    setDripEnabled(false);
    setDripBatchSize('10');
    setDripIntervalMinutes('5');
  };

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    resetForm();
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!orgId) {
      alert('Please choose an Organization.');
      return;
    }
    if (!courseId) {
      alert('Please choose a Course.');
      return;
    }
    if (!templateId) {
      alert('Please choose a Template.');
      return;
    }
    if (!name.trim()) {
      alert('Please enter a Campaign Name.');
      return;
    }
    if (!scheduledAt) {
      alert('Please pick a Scheduled time.');
      return;
    }
    if (!timezone) {
      alert('Missing timezone (comes from Course).');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('org_id', orgId);
      formData.set('course_id', courseId);
      formData.set('template_id', templateId);
      formData.set('name', name);
      formData.set('description', description);
      formData.set('scheduled_at', scheduledAt);
      formData.set('timezone', timezone);
      
      // Add drip settings
      formData.set('drip_enabled', dripEnabled.toString());
      if (dripEnabled) {
        formData.set('drip_batch_size', dripBatchSize);
        formData.set('drip_interval_minutes', dripIntervalMinutes);
      }

      await action(formData);

      alert('Campaign scheduled successfully!');
      resetForm();
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create campaign: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="btn-primary"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        type="button"
      >
        Add RCS Promo
      </button>

      {open && (
        <div className="modal-overlay" onClick={handleClose}>
          <div
            className="modal max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Schedule RCS Promo</h2>
              <button
                type="button"
                className="btn"
                onClick={handleClose}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Organization">
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="input"
                  required
                  disabled={loading}
                >
                  <option value="">Select organization…</option>
                  {orgOptions.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Course (required)">
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="input"
                  required
                  disabled={!orgId || loading}
                >
                  <option value="">
                    {!orgId ? 'Select organization first…' : 'Select course…'}
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Template">
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="input"
                  required
                  disabled={!orgId || loading}
                >
                  <option value="">
                    {!orgId
                      ? 'Select organization first…'
                      : 'Select RCS template…'}
                  </option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Campaign Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Weekend Promo Blast"
                  required
                  disabled={loading}
                />
              </Field>

              <Field label="Description (optional)">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Short internal note…"
                  disabled={loading}
                />
              </Field>

              <Field label="Scheduled Time">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="input"
                  required
                  disabled={loading}
                />
              </Field>

              <Field label="Timezone (auto from Course)">
                <input
                  name="timezone"
                  value={timezone}
                  readOnly
                  className="input bg-muted"
                  placeholder="Select a course to load timezone"
                  disabled={loading}
                />
              </Field>

              {/* Drip Campaign Settings */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="dripEnabled"
                    checked={dripEnabled}
                    onChange={(e) => setDripEnabled(e.target.checked)}
                    className="w-4 h-4"
                    disabled={loading}
                  />
                  <label htmlFor="dripEnabled" className="text-sm font-medium cursor-pointer">
                    Enable Drip Campaign (send gradually)
                  </label>
                </div>

                {dripEnabled && (
                  <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-muted rounded-md">
                    <Field label="Contacts per Batch">
                      <input
                        type="number"
                        value={dripBatchSize}
                        onChange={(e) => setDripBatchSize(e.target.value)}
                        className="input"
                        min="1"
                        max="1000"
                        required
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        How many contacts to message at once
                      </p>
                    </Field>

                    <Field label="Minutes Between Batches">
                      <input
                        type="number"
                        value={dripIntervalMinutes}
                        onChange={(e) => setDripIntervalMinutes(e.target.value)}
                        className="input"
                        min="1"
                        max="1440"
                        required
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Wait time before sending next batch
                      </p>
                    </Field>
                  </div>
                )}
                
                {dripEnabled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Messages will be sent in batches of {dripBatchSize} every {dripIntervalMinutes} minutes
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="btn"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving…' : 'Schedule Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
