import { supabaseServer } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export default async function InboxPage() {
  await requireProfile();

  const supabase = supabaseServer();
  const { data: recentReplies } = await supabase
    .from("message_sends")
    .select("id, body, created_at")
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Review customer replies, acknowledge read receipts, and respond when needed.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:grid-cols-[1.2fr,2fr]">
        <aside className="space-y-3 text-sm">
          <div className="rounded-xl border bg-background px-4 py-3 shadow-sm">
            <p className="text-sm font-semibold">Conversations</p>
            <p className="text-xs text-muted-foreground">
              Threads populate automatically when customers reply to a campaign or promo.
            </p>
          </div>
          <ul className="space-y-3">
            {(recentReplies ?? SAMPLE_THREADS).map((reply) => (
              <li key={reply.id} className="rounded-xl border bg-background px-4 py-3 shadow-sm">
                <p className="text-sm font-medium">{reply.body?.slice(0, 80) ?? "Reply"}</p>
                <p className="text-xs text-muted-foreground">
                  {reply.created_at
                    ? new Date(reply.created_at).toLocaleString()
                    : "Just now"}
                </p>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex h-full min-h-[24rem] flex-col justify-between rounded-xl border bg-background p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold">Thread preview</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a conversation to view message history, delivery receipts, and CTA clicks. Quick reply templates will live here.
            </p>
          </div>
          <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            Reply composer placeholder
          </div>
        </div>
      </section>
    </div>
  );
}

const SAMPLE_THREADS = [
  {
    id: "sample-1",
    body: "Thanks for the reminder! Can I bring a guest?",
    created_at: new Date().toISOString(),
  },
];
