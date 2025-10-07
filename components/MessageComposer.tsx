'use client';
import { useRef, useTransition } from 'react';

export default function MessageComposer({
  conversationId,
  action,
}: {
  conversationId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await action(formData);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    });
  };

  return (
    <form style={{ display: 'flex', gap: 8, marginTop: 8 }} onSubmit={handleSubmit}>
      <input type="hidden" name="conversation_id" value={conversationId} />
      <textarea
        ref={inputRef}
        name="body"
        className="input"
        placeholder="Type a reply…"
        rows={2}
        required
        disabled={isPending}
      />
      <button className="btn btn-primary" type="submit" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
