'use client';

import { useEffect, useState } from 'react';

type EventDetails = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  orgName: string;
  courseName: string;
  templateName: string;
  status: string;
};

type EditEventModalProps = {
  event: EventDetails | null;
  onClose: () => void;
  onUpdate: (eventId: string, scheduledAt: string) => Promise<void>;
  onCancel: (eventId: string) => Promise<void>;
};

export default function EditEventModal({
  event,
  onClose,
  onUpdate,
  onCancel,
}: EditEventModalProps) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      // Convert ISO to datetime-local format
      const date = new Date(event.scheduledAt);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduledAt(localDateTime);
    }
  }, [event]);

  if (!event) return null;

  const handleUpdate = async () => {
    if (!scheduledAt) {
      alert('Please select a new time');
      return;
    }

    setLoading(true);
    try {
      // Convert to ISO
      const isoDateTime = new Date(scheduledAt).toISOString();
      await onUpdate(event.id, isoDateTime);
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

  const canEdit = event.status === 'scheduled';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Event Details</h2>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Event Info */}
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

          {canEdit && (
            <>
              <hr className="border-border" />

              {/* Reschedule Section */}
              <div>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Reschedule To:</span>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="input"
                    disabled={loading}
                  />
                </label>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4">
            <div>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn bg-red-500 text-white hover:bg-red-600 border-red-500"
                >
                  {loading ? 'Cancelling...' : 'Cancel Campaign'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn"
                onClick={onClose}
                disabled={loading}
              >
                Close
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Updating...' : 'Update Time'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
