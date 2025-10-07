'use client';

import { useFormState } from 'react-dom';
import type { Metadata } from 'next';
import Link from 'next/link';
import { updatePasswordAction } from '@/app/login/actions';

type ActionState = { ok: boolean; message?: string };

export default function ResetPasswordPage() {
  const [state, action] = useFormState<ActionState, FormData>(
    updatePasswordAction,
    { ok: false }
  );

  return (
    <main className="login-bg">
      <div className="auth-wrap">
        <div className="brand">
          <div className="flag" />
          <span>Title</span>
        </div>
        <div className="auth-card">
          <h1 className="headline">Set a new password</h1>
          <p className="subtext">Enter a new password for your account.</p>
          
          <form action={action} className="form-grid">
            <input
              name="password"
              type="password"
              placeholder="New password"
              required
              minLength={8}
              className="input"
            />
            <input
              name="confirm"
              type="password"
              placeholder="Confirm new password"
              required
              minLength={8}
              className="input"
            />
            
            {state.message && (
              <div className={state.ok ? 'notice' : 'alert'}>
                {state.message}
              </div>
            )}
            
            <button className="btn-primary w-full" type="submit">
              Update password
            </button>
          </form>
          
          <div className="hint muted">
            Done?{' '}
            <Link href="/login" className="link">
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
