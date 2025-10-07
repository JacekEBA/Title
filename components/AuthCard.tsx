'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { signInAction, signUpAction, sendResetAction } from '@/app/login/actions';

type ActionState = { ok: boolean; message?: string };

export default function AuthCard() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  
  const [signInState, signInFormAction] = useFormState<ActionState, FormData>(
    signInAction,
    { ok: false }
  );
  
  const [signUpState, signUpFormAction] = useFormState<ActionState, FormData>(
    signUpAction,
    { ok: false }
  );
  
  const [resetState, resetFormAction] = useFormState<ActionState, FormData>(
    sendResetAction,
    { ok: false }
  );

  return (
    <div className="auth-card">
      {mode === 'reset' ? (
        <>
          <h1 className="headline">Reset password</h1>
          <p className="subtext">Enter your email to receive a reset link.</p>
          
          <form action={resetFormAction} className="form-grid">
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="input"
            />
            
            {resetState.message && (
              <div className={resetState.ok ? 'notice' : 'alert'}>
                {resetState.message}
              </div>
            )}
            
            <button className="btn btn-primary w-full" type="submit">
              Send reset link
            </button>
          </form>
          
          <div className="hint muted">
            Remember your password?{' '}
            <button
              onClick={() => setMode('signin')}
              className="link"
              type="button"
            >
              Sign in
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                mode === 'signin'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign up
            </button>
          </div>

          {mode === 'signin' ? (
            <>
              <h1 className="headline">Welcome back</h1>
              <p className="subtext">Golf-ready messaging for your courses.</p>
              
              <form action={signInFormAction} className="form-grid">
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="input"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  className="input"
                />
                
                {signInState.message && (
                  <div className="alert">{signInState.message}</div>
                )}
                
                <button className="btn btn-primary w-full" type="submit">
                  Sign in
                </button>
              </form>
              
              <div className="hint muted">
                <button
                  onClick={() => setMode('reset')}
                  className="link"
                  type="button"
                >
                  Forgot password?
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="headline">Create account</h1>
              <p className="subtext">Get started with Title Golf RCS.</p>
              
              <form action={signUpFormAction} className="form-grid">
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="input"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password (min 8 characters)"
                  required
                  minLength={8}
                  className="input"
                />
                
                {signUpState.message && (
                  <div className={signUpState.ok ? 'notice' : 'alert'}>
                    {signUpState.message}
                  </div>
                )}
                
                <button className="btn btn-primary w-full" type="submit">
                  Create account
                </button>
              </form>
              
              <div className="hint muted text-xs mt-4">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
