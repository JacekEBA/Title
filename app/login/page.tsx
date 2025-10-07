import '@/styles/globals.css';
import AuthCard from '@/components/AuthCard';

export const metadata = {
  title: 'Sign in • Title',
  description: 'RCS promos for golf courses',
};

export default function Page() {
  return (
    <main className="login-bg">
      <AuthCard />
      <footer className="login-footer">
        <span>© {new Date().getFullYear()} Title • Golf-first RCS</span>
      </footer>
    </main>
  );
}
