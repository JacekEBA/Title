'use client';

import { useMemo, useState } from 'react';
import { Calendar as RBC, luxonLocalizer } from 'react-big-calendar';
import { DateTime } from 'luxon';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = luxonLocalizer(DateTime);

function toDate(d: any) {
  return typeof d === 'string' ? new Date(d) : d;
}

export default function Calendar({ events }: { events: { id: string; title: string; start: any; end: any }[] }) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [date, setDate] = useState(new Date());

  const ev = useMemo(
    () => events.map((e) => ({ ...e, start: toDate(e.start), end: toDate(e.end) })),
    [events]
  );

  return (
    <div>
      <div className="toolbar">
        <div className="seg">
          <button className={view === 'month' ? 'btn-tab active' : 'btn-tab'} onClick={() => setView('month')}>
            Month
          </button>
          <button className={view === 'week' ? 'btn-tab active' : 'btn-tab'} onClick={() => setView('week')}>
            Week
          </button>
          <button className={view === 'day' ? 'btn-tab active' : 'btn-tab'} onClick={() => setView('day')}>
            Day
          </button>
        </div>
        <div className="seg">
          <button className="btn" onClick={() => setDate(new Date())}>
            Today
          </button>
          <button
            className="btn"
            onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          >
            Prev
          </button>
          <button
            className="btn"
            onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
          >
            Next
          </button>
        </div>
      </div>

      <RBC
        localizer={localizer}
        events={ev}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={(v) => setView(v as 'month' | 'week' | 'day')}
        date={date}
        onNavigate={(d) => setDate(d)}
        selectable
        popup
        style={{ height: 700, marginTop: 10 }}
      />
    </div>
  );
}
