import type { Metadata } from 'next';
import { signOutAction } from './actions';
import SignOutButton from './SignOutButton';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Account Section */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Account</h2>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium mb-1">Sign out</h3>
                <p className="text-sm text-muted-foreground">
                  Sign out of the agency dashboard.
                </p>
              </div>
              <form action={signOutAction}>
                <SignOutButton />
              </form>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Preferences</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Theme</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize how Title looks for you.
                  </p>
                </div>
                <select className="input w-auto">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>

              <div className="flex items-start justify-between border-t border-border pt-6">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage email and push notifications.
                  </p>
                </div>
                <button className="btn">Configure</button>
              </div>

              <div className="flex items-start justify-between border-t border-border pt-6">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Language</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred language.
                  </p>
                </div>
                <select className="input w-auto">
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Privacy & Security</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Two-factor authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <button className="btn">Enable</button>
              </div>

              <div className="flex items-start justify-between border-t border-border pt-6">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Change password</h3>
                  <p className="text-sm text-muted-foreground">
                    Update your password regularly to keep your account secure.
                  </p>
                </div>
                <button className="btn">Update</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
