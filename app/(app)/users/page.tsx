import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function UsersPage() {
  const {
    profile: { role },
  } = await requireProfile();

  if (role !== "owner") {
    notFound();
  }

  const supabase = supabaseServer();
  const { data: users } = await supabase
    .from("profiles")
    .select("user_id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Invite teammates, assign roles, and control which organizations they can access.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-[2fr,1fr,1fr] gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <span>Name</span>
          <span>Role</span>
          <span>Invited</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {(users ?? SAMPLE_USERS).map((user) => (
            <div
              key={user.user_id}
              className="grid grid-cols-[2fr,1fr,1fr] items-center gap-2 rounded-xl border bg-background px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-medium">{user.full_name ?? user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{user.role}</span>
              <span className="text-xs text-muted-foreground">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "--"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-dashed bg-muted/40 p-4 text-sm">
          <p className="font-semibold">Invite a user</p>
          <p className="text-muted-foreground">
            Send invites via email. Owners can grant org-wide access; client admins are scoped to their course roster.
          </p>
        </div>
      </section>
    </div>
  );
}

const SAMPLE_USERS = [
  {
    user_id: "sample-user",
    email: "proshop@greenacres.com",
    full_name: "Pro Shop",
    role: "client_admin",
    created_at: new Date().toISOString(),
  },
];
