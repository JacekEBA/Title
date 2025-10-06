import { requireProfile } from "@/lib/auth";
import { LogoutButton } from "./_components/logout-button";

export default async function SettingsPage() {
  const {
    profile: { role, organizationId, fullName },
    supabase,
  } = await requireProfile();

  let organization = null;

  if (organizationId) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, timezone, status, created_at")
      .eq("id", organizationId)
      .maybeSingle();
    organization = data;
  }

  const roleLabel = role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update your profile, branding, timezone, and integrations.
        </p>
      </header>

      <section className="grid gap-6 rounded-2xl border bg-card p-6 shadow-sm lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="grid gap-2 text-sm">
            <label className="text-xs uppercase text-muted-foreground">Name</label>
            <p className="rounded-lg border bg-background px-3 py-2">{fullName}</p>
            <label className="text-xs uppercase text-muted-foreground">Role</label>
            <p className="rounded-lg border bg-background px-3 py-2">{roleLabel}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Organization</h2>
          {organization ? (
            <div className="grid gap-2 text-sm">
              <label className="text-xs uppercase text-muted-foreground">Name</label>
              <p className="rounded-lg border bg-background px-3 py-2">{organization.name}</p>
              <label className="text-xs uppercase text-muted-foreground">Timezone</label>
              <p className="rounded-lg border bg-background px-3 py-2">{organization.timezone}</p>
              <label className="text-xs uppercase text-muted-foreground">Status</label>
              <p className="rounded-lg border bg-background px-3 py-2 capitalize">{organization.status}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Owners can assign you to an organization to manage branding and timezone defaults.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Connections</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Store API keys for RCS providers, billing, and webhooks. We surface connection health and alert the Title team if anything breaks.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map((integration) => (
            <div key={integration} className="rounded-xl border bg-background px-4 py-3 text-sm shadow-sm">
              <p className="font-medium">{integration}</p>
              <p className="text-xs text-muted-foreground">Status: Connected</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign out of your account and return to the login page.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}

const INTEGRATIONS = [
  "TextGrid",
  "GHL Subaccount",
  "Stripe",
  "Webhooks",
];
