import { requireProfile } from "@/lib/auth";

const SAMPLE_POSTS = [
  {
    id: "1",
    platform: "Instagram",
    scheduled_for: new Date().toISOString(),
    caption: "Sunset rounds + new RCS automation = ✨",
    status: "Scheduled",
  },
  {
    id: "2",
    platform: "Facebook",
    scheduled_for: new Date().toISOString(),
    caption: "Black Friday tee sheet opens next week.",
    status: "Draft",
  },
];

export default async function SocialPage() {
  await requireProfile();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Social queue</h1>
        <p className="text-sm text-muted-foreground">
          Coordinate social posts alongside RCS campaigns. Publish via Publer or your preferred tool.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {SAMPLE_POSTS.map((post) => (
            <div key={post.id} className="rounded-xl border bg-background p-4 shadow-sm">
              <p className="text-xs uppercase text-muted-foreground">{post.platform}</p>
              <p className="text-sm font-medium">{post.caption}</p>
              <p className="text-xs text-muted-foreground">
                Scheduled for {new Date(post.scheduled_for).toLocaleString()}
              </p>
              <span className="mt-3 inline-block rounded-full bg-muted px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                {post.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
