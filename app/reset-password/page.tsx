'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updatePasswordAction } from '@/app/login/actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type ActionState = { ok: boolean; message?: string };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [state, action] = useFormState<ActionState, FormData>(
    updatePasswordAction,
    { ok: false }
  );

  useEffect(() => {
    const handleAuthToken = async () => {
      // Get the hash from the URL
      const hash = window.location.hash;
      
      if (!hash) {
        setError('No authentication token found. Please click the link in your email again.');
        return;
      }

      // Parse hash parameters
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (!accessToken) {
        setError('Invalid authentication token. Please click the link in your email again.');
        return;
      }

      // Exchange the tokens with Supabase to establish a session
      const supabase = createSupabaseBrowserClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError) {
        setError('Could not verify your link. Please request a new one.');
        console.error('Session error:', sessionError);
        return;
      }

      // Clear the hash from URL for security
      window.history.replaceState(null, '', window.location.pathname);
      
      setIsReady(true);
    };

    handleAuthToken();
  }, []);

  // Redirect to login after successful password update
  useEffect(() => {
    if (state.ok) {
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }, [state.ok, router]);

  if (error) {
    return (
      <main className="login-bg">
        <div className="auth-wrap">
          <div className="brand">
            <div className="flag" />
            <span>Title</span>
          </div>
          <div className="auth-card">
            <h1 className="headline">Link Error</h1>
            <div className="alert mb-4">
              {error}
            </div>
            <Link href="/login" className="btn btn-primary w-full text-center block">
              Back to login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!isReady) {
    return (
      <main className="login-bg">
        <div className="auth-wrap">
          <div className="brand">
            <div className="flag" />
            <span>Title</span>
          </div>
          <div className="auth-card">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Verifying your link...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
          
          {!state.ok && (
            <div className="hint muted">
              Done?{' '}
              <Link href="/login" className="link">
                Return to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
