'use client';

import { useMemo } from 'react';
import { Calendar as RBC, Views, luxonLocalizer } from 'react-big-calendar';
import { DateTime } from 'luxon';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Use Luxon for all calendar date formatting
const localizer = luxonLocalizer(DateTime);

function toDate(d: any) {
  return typeof d === 'string' ? new Date(d) : d;
}

export default function Calendar({
  events,
  onSelectSlot,
  onSelectEvent,
}: {
  events: { id: string; title: string; start: Date | string; end: Date | string }[];
  onSelectSlot?: (slot: any) => void;
  onSelectEvent?: (ev: any) => void;
}) {
  const ev = useMemo(
    () => events.map((e) => ({ ...e, start: toDate(e.start), end: toDate(e.end) })),
    [events]
  );

  return (
    <div className="card">
      <RBC
        localizer={localizer}
        events={ev}
        startAccessor="start"
        endAccessor="end"
        selectable
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        style={{ height: 720 }}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}
