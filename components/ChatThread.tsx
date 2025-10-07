'use client';
import { useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '../lib/supabase/client';

export default function ChatThread({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: { id: string; direction: string; body: string | null; created_at: string }[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return (
    <div className="card" style={{ minHeight: 360 }}>
      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            display: 'flex',
            justifyContent: message.direction === 'outbound' ? 'flex-end' : 'flex-start',
            margin: '6px 0',
          }}
        >
          <div
            style={{
              background: message.direction === 'outbound' ? 'var(--title-green)' : 'var(--muted)',
              padding: '8px 10px',
              borderRadius: 10,
              maxWidth: '70%',
              color: message.direction === 'outbound' ? '#0b3d0b' : 'inherit',
            }}
          >
            {message.body}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
