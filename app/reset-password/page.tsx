'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supabase] = useState(() => createSupabaseBrowserClient());

  useEffect(() => {
    const handleAuthToken = async () => {
      const hash = window.location.hash;
      
      if (!hash) {
        setError('No authentication token found. Please click the link in your email again.');
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken) {
        setError('Invalid authentication token. Please click the link in your email again.');
        return;
      }

      // Exchange the tokens with Supabase to establish a session
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
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirm = String(formData.get('confirm') ?? '');

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Update password directly using the browser client (which has the session)
    const { error: updateError } = await supabase.auth.updateUser({ 
      password 
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      setError('Could not update password. Please try again or request a new reset link.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  if (error && !isReady) {
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
          
          <form onSubmit={handleSubmit} className="form-grid">
            <input
              name="password"
              type="password"
              placeholder="New password"
              required
              minLength={8}
              className="input"
              disabled={loading || success}
            />
            <input
              name="confirm"
              type="password"
              placeholder="Confirm new password"
              required
              minLength={8}
              className="input"
              disabled={loading || success}
            />
            
            {error && (
              <div className="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="notice">
                Password updated! Redirecting to login...
              </div>
            )}
            
            <button 
              className="btn-primary w-full" 
              type="submit"
              disabled={loading || success}
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
          
          {!success && (
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
