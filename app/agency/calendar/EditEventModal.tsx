'use client';

import { useEffect, useState, type FormEvent } from 'react';

type EventDetails = {
  id: string;
  campaignId: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  orgId: string;
  courseId: string;
  templateId: string;
  orgName: string;
  courseName: string;
  templateName: string;
  timezone: string;
  status: string;
};

type CourseOption = {
  id: string;
  name: string;
  timezone: string;
};

type TemplateOption = {
  id: string;
  name: string;
};

type OrgOption = {
  id: string;
  name: string;
};

type EditEventModalProps = {
  event: EventDetails | null;
  orgOptions: OrgOption[];
  courseOptionsByOrg: Record<string, CourseOption[]>;
  templateOptionsByOrg: Record<string, TemplateOption[]>;
  onClose: () => void;
  onUpdate: (data: {
    eventId: string;
    campaignId: string;
    name: string;
    description: string | null;
    scheduledAt: string;
    timezone: string;
    orgId: string;
    courseId: string;
    templateId: string;
  }) => Promise<void>;
  onCancel: (eventId: string) => Promise<void>;
};

export default function EditEventModal({
  event,
  orgOptions,
  courseOptionsByOrg,
  templateOptionsByOrg,
  onClose,
  onUpdate,
  onCancel,
}: EditEventModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [orgId, setOrgId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [timezone, setTimezone] = useState('');

  // Get courses and templates for selected org
  const courses = orgId ? (courseOptionsByOrg[orgId] ?? []) : [];
  const templates = orgId ? (templateOptionsByOrg[orgId] ?? []) : [];

  useEffect(() => {
    if (event) {
      setName(event.title);
      setDescription(event.description ?? '');
      setOrgId(event.orgId);
      setCourseId(event.courseId);
      setTemplateId(event.templateId);
      setTimezone(event.timezone);
      
      // Convert ISO to datetime-local format
      const date = new Date(event.scheduledAt);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduledAt(localDateTime);
    }
  }, [event]);

  // Update timezone when course changes
  useEffect(() => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      return;
    }
    setTimezone(course.timezone ?? 'UTC');
  }, [courseId, courses]);

  if (!event) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Campaign name is required');
      return;
    }
    if (!orgId || !courseId || !templateId) {
      alert('Please select organization, course, and template');
      return;
    }
    if (!scheduledAt) {
      alert('Please select a scheduled time');
      return;
    }

    setLoading(true);
    try {
      // Convert to ISO
      const isoDateTime = new Date(scheduledAt).toISOString();
      
      await onUpdate({
        eventId: event.id,
        campaignId: event.campaignId,
        name: name.trim(),
        description: description.trim() || null,
        scheduledAt: isoDateTime,
        timezone,
        orgId,
        courseId,
        templateId,
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this campaign?')) {
      return;
    }

    setLoading(true);
    try {
      await onCancel(event.id);
      onClose();
    } catch (error) {
      console.error('Failed to cancel event:', error);
      alert('Failed to cancel event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = event.status === 'scheduled' || event.status === 'draft';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">
            {canEdit ? 'Edit Campaign' : 'Campaign Details'}
          </h2>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {canEdit ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Organization</span>
              <select
                value={orgId}
                onChange={(e) => {
                  setOrgId(e.target.value);
                  setCourseId('');
                  setTemplateId('');
                }}
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
            </label>

            {/* Course */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Course</span>
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
            </label>

            {/* Template */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Template</span>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="input"
                required
                disabled={!orgId || loading}
              >
                <option value="">
                  {!orgId ? 'Select organization first…' : 'Select template…'}
                </option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Campaign Name */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Campaign Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Weekend Promo Blast"
                required
                disabled={loading}
              />
            </label>

            {/* Description */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Description (optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={3}
                placeholder="Short internal note…"
                disabled={loading}
              />
            </label>

            {/* Scheduled Time */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Scheduled Time</span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input"
                required
                disabled={loading}
              />
            </label>

            {/* Timezone */}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Timezone (auto from Course)</span>
              <input
                type="text"
                value={timezone}
                readOnly
                className="input bg-muted"
                disabled={loading}
              />
            </label>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="btn bg-red-500 text-white hover:bg-red-600 border-red-500"
              >
                {loading ? 'Cancelling...' : 'Cancel Campaign'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn"
                  onClick={onClose}
                  disabled={loading}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          // Read-only view for completed/cancelled campaigns
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {event.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Organization:</span>
                <p className="font-medium">{event.orgName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Course:</span>
                <p className="font-medium">{event.courseName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Template:</span>
                <p className="font-medium">{event.templateName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium capitalize">{event.status}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button type="button" className="btn" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
