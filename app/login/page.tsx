import type { Metadata } from 'next';
import AuthCard from '@/components/AuthCard';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Title account',
};

export default function LoginPage() {
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
