'use client';

type EventDetails = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  courseName: string;
  templateName: string;
  timezone: string;
  status: string;
  campaignStatus: string;
};

type ViewEventModalProps = {
  event: EventDetails;
  onClose: () => void;
};

export default function ViewEventModal({ event, onClose }: ViewEventModalProps) {
  // Format the scheduled time
  const scheduledDate = new Date(event.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.campaignStatus)}`}>
              {event.campaignStatus}
            </span>
          </div>
          <button
            type="button"
            className="btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Event Details */}
        <div className="space-y-6">
          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-base">{event.description}</p>
            </div>
          )}

          {/* Schedule Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Scheduled Date</h3>
              <p className="text-base font-medium">{formattedDate}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Scheduled Time</h3>
              <p className="text-base font-medium">{formattedTime} ({event.timezone})</p>
            </div>
          </div>

          {/* Course and Template */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Course</h3>
              <p className="text-base">{event.courseName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Message Template</h3>
              <p className="text-base">{event.templateName}</p>
            </div>
          </div>

          {/* Info Notice */}
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This campaign is managed by your agency. For any changes or questions, please contact your agency administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
          <button
            type="button"
            className="btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Save this as: app/org/[orgId]/calendar/ViewEventModal.tsx
