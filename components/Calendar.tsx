'use client';
import { useMemo } from 'react';
import {
  Calendar as RBC,
  Views,
  dateFnsLocalizer,
  type SlotInfo,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

function toDate(value: Date | string) {
  return typeof value === 'string' ? new Date(value) : value;
}

export default function Calendar({
  events,
  onSelectSlot,
  onSelectEvent,
}: {
  events: { id: string; title: string; start: Date | string; end: Date | string }[];
  onSelectSlot?: (slot: SlotInfo) => void;
  onSelectEvent?: (event: any) => void;
}) {
  const mapped = useMemo(
    () => events.map((event) => ({ ...event, start: toDate(event.start), end: toDate(event.end) })),
    [events]
  );

  return (
    <div className="card">
      <RBC
        localizer={localizer}
        events={mapped}
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
