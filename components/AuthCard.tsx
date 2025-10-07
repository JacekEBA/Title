'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { signInAction, signUpAction, sendResetAction } from '@/app/login/actions';

type ActionState = { ok: boolean; message?: string };

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary w-full" type="submit" disabled={pending}>
      {pending ? 'Please wait…' : children}
    </button>
  );
}

export default function AuthCard() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showForgot, setShowForgot] = useState(false);

  const [signInState, signInActionBound] = useFormState<ActionState, FormData>(signInAction, { ok: false });
  const [signUpState, signUpActionBound] = useFormState<ActionState, FormData>(signUpAction, { ok: false });
  const [resetState, resetActionBound] = useFormState<ActionState, FormData>(sendResetAction, { ok: false });

  const headline = useMemo(() => (mode === 'signin' ? 'Welcome back' : 'Create your account'), [mode]);

  useEffect(() => {
    if (signUpState.message && /already have an account/i.test(signUpState.message)) {
      setMode('signin');
    }
  }, [signUpState.message]);

  const shouldShowForgot = showForgot || (!!signInState.message && !signInState.ok);

  return (
    <div className="auth-wrap">
      <div className="brand">
        <div className="flag" />
        <span>Title</span>
      </div>

      <div className="auth-card">
        <div className="tabs">
          <button
            className={mode === 'signin' ? 'tab active' : 'tab'}
            onClick={() => setMode('signin')}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === 'signup' ? 'tab active' : 'tab'}
            onClick={() => setMode('signup')}
            type="button"
          >
            Sign up
          </button>
        </div>

        <h2 className="headline">{headline}</h2>
        <p className="subtext">Golf-ready messaging for your courses.</p>

        {mode === 'signin' && (
          <form action={signInActionBound} className="form-grid">
            <input name="email" type="email" placeholder="Email" required className="input" />
            <input name="password" type="password" placeholder="Password" required className="input" />
            {signInState.message && <div className="alert">{signInState.message}</div>}
            <SubmitButton>Sign in</SubmitButton>
          </form>
        )}

        {mode === 'signup' && (
          <form action={signUpActionBound} className="form-grid">
            <input name="email" type="email" placeholder="Email" required className="input" />
            <input
              name="password"
              type="password"
              placeholder="Password (min 8 chars)"
              required
              minLength={8}
              className="input"
            />
            {signUpState.message && <div className={signUpState.ok ? 'notice' : 'alert'}>{signUpState.message}</div>}
            <SubmitButton>Create account</SubmitButton>
            <div className="muted hint">
              Already have an account?{' '}
              <button className="link" type="button" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </div>
          </form>
        )}

        <div className="forgot">
          <button className="link small" type="button" onClick={() => setShowForgot((s) => !s)}>
            {shouldShowForgot ? 'Hide password reset' : 'Forgot password?'}
          </button>
          {shouldShowForgot && (
            <form action={resetActionBound} className="form-inline">
              <input name="email" type="email" placeholder="Your email" required className="input" />
              <SubmitButton>Send reset link</SubmitButton>
              {resetState.message && <div className={resetState.ok ? 'notice' : 'alert'}>{resetState.message}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
