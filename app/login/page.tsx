'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/AuthCard';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if URL contains password reset token
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      // This is a password reset/invite link - redirect to reset password page
      router.replace('/reset-password');
    }
  }, [router]);

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
