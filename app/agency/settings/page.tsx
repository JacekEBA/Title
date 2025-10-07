import type { Metadata } from 'next';
import SignOutButton from './SignOutButton';
import { signOutAction } from './actions';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      <div className="space-y-6">
        <div className="card">
          <h2 className="section-title">Account</h2>
          <p className="muted mb-4">Sign out of the agency dashboard.</p>
          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </div>

        <div className="card">
          <h2 className="section-title">Preferences</h2>
          <p className="muted">
            Theme, notifications, and other preferences can go here.
          </p>
        </div>
      </div>
    </div>
  );
}
