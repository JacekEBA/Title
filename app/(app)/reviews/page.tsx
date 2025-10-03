import { requireProfile } from "@/lib/auth";

const SAMPLE_REVIEWS = [
  {
    id: "1",
    author: "Alex M.",
    rating: 5,
    platform: "Google",
    created_at: new Date().toISOString(),
    body: "Course is in great shape and the RCS reminders made check-in a breeze!",
  },
];

export default async function ReviewsPage() {
  await requireProfile();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Keep tabs on Google Business reviews alongside messaging performance.
        </p>
      </header>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <ul className="space-y-4">
          {SAMPLE_REVIEWS.map((review) => (
            <li key={review.id} className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{review.author}</span>
                <span className="text-xs text-muted-foreground">{review.platform}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()} · Rating {review.rating}/5
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
