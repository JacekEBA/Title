'use client';
import clsx from 'clsx';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';

export default function ConversationList({
  items,
}: {
  items: { id: string; org_id: string; last_message_at: string; unread_count: number }[];
}) {
  const router = useRouter();
  return (
    <div className="card">
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item) => {
          const timestamp = DateTime.fromISO(item.last_message_at);
          return (
            <li
              key={item.id}
              style={{
                padding: '10px 8px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                Conversation {item.id.slice(0, 8)} •{' '}
                {timestamp.isValid
                  ? timestamp.toLocaleString(DateTime.DATETIME_SHORT)
                  : new Date(item.last_message_at).toLocaleString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.unread_count > 0 && (
                  <span className={clsx('badge', 'badge-unread')}>
                    {item.unread_count} new
                  </span>
                )}
                <button
                  className={clsx('btn', 'btn-secondary')}
                  onClick={() => router.push(`/org/${item.org_id}/inbox/${item.id}`)}
                >
                  Open
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
