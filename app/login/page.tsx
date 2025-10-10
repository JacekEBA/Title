'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/AuthCard';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if URL contains password reset/invite token
    const hash = window.location.hash;
    
    // Parse the hash parameters
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    
    // If there's an access token in the URL, this is either:
    // - A password reset link (type=recovery)
    // - An invite link (type=invite or type=magiclink)
    if (accessToken) {
      // Redirect to reset password page, preserving the hash
      window.location.href = '/reset-password' + hash;
    }
  }, []);

  return (
    <main className="login-bg">
      <div className="auth-wrap">
        <div className="brand">
          <div className="flag" />
          <span>Title</span>
        </div>
        <AuthCard />
        <footer className="login-footer">
          <span>© {new Date().getFullYear()} Title • Golf-first RCS</span>
        </footer>
      </div>
    </main>
  );
}
