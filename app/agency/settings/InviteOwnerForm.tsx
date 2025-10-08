'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import {
  inviteOwnerAction,
  inviteOwnerInitialState,
  type InviteOwnerActionState,
} from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Sending…' : 'Send Invite'}
    </button>
  );
}

export default function InviteOwnerForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<
    InviteOwnerActionState,
    FormData
  >(inviteOwnerAction, inviteOwnerInitialState);

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="email"
          name="email"
          required
          placeholder="owner@example.com"
          className="input flex-1"
          aria-label="Owner email address"
        />
        <SubmitButton />
      </div>

      {state.message ? (
        <p
          role="status"
          aria-live={state.status === 'error' ? 'assertive' : 'polite'}
          className={`text-sm ${
            state.status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
