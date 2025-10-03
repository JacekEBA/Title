// app/dashboard/page.tsx
import { supabaseServer } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  // Safety check – though your layout already handles redirects
  if (!user) {
    return <div className="p-6">You must be logged in to see the dashboard.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back, {user.email} 👋
      </p>

      {/* Example: dashboard widgets/links go here */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-4 shadow-sm">
          <h2 className="font-semibold">Your Courses</h2>
          <p className="text-sm text-muted-foreground">Stats and progress.</p>
        </div>

        <div className="rounded-xl border p-4 shadow-sm">
          <h2 className="font-semibold">Calendar</h2>
          <p className="text-sm text-muted-foreground">Upcoming events.</p>
        </div>
      </div>
    </div>
  );
}

