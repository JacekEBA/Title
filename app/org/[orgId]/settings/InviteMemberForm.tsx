'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { inviteMemberAction } from './actions';
import { inviteMemberInitialState, type InviteMemberActionState } from './inviteMemberState';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Sending…' : 'Send Invite'}
    </button>
  );
}

export default function InviteMemberForm({ orgId }: { orgId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<InviteMemberActionState, FormData>(
    inviteMemberAction,
    inviteMemberInitialState
  );

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="org_id" value={orgId} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="member@example.com"
          className="input md:col-span-2"
          aria-label="Member email address"
        />
        
        <select
          name="role"
          className="input"
          aria-label="Member role"
          required
        >
          <option value="client_admin">Admin</option>
          <option value="client_viewer">Viewer</option>
        </select>
      </div>
      
      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.message && (
          <p
            role="status"
            aria-live={state.status === 'error' ? 'assertive' : 'polite'}
            className={`text-sm ${
              state.status === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {state.message}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <strong>Admin:</strong> Can manage settings, courses, and invite members • <strong>Viewer:</strong> Read-only access
      </p>
    </form>
  );
}
