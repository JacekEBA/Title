import SignOutButton from './SignOutButton';
import { signOutAction } from './actions';

export const metadata = { title: 'Agency • Settings' };

export default function Page() {
  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      <div className="card">
        <h2 className="section-title">Account</h2>
        <p className="muted">Sign out of the agency dashboard.</p>
        <form action={signOutAction}>
          <SignOutButton />
        </form>
      </div>

      <div className="card">
        <h2 className="section-title">Preferences</h2>
        <p className="muted">Theme, notifications, and other preferences can go here.</p>
      </div>
    </div>
  );
}

