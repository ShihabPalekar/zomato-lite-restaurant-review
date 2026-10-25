"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function WriteReviewPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();

  const [name, setName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch only the name — so the visitor knows which restaurant they are reviewing.
  useEffect(() => {
    let alive = true;
    fetch(`/api/restaurants/${restaurantId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Restaurant not found.");
        const body = (await res.json()) as { name: string };
        if (alive) setName(body.name);
      })
      .catch((err: unknown) => {
        if (alive) {
          setLoadError(err instanceof Error ? err.message : "Could not load this page.");
        }
      });
    return () => {
      alive = false;
    };
  }, [restaurantId]);

  // Validation lives HERE only as kindness; the backend re-checks everything.
  const canSubmit = rating >= 1 && comment.trim().length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: Number(restaurantId),
          rating,
          comment,
        }),
      });
      if (res.status === 201) {
        router.push(`/restaurant/${restaurantId}`);
        return;
      }
      // Display the backend's own message, verbatim.
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto min-h-screen max-w-[560px] px-5 py-16">
        <p className="text-sm text-stone-500">{loadError}</p>
      </main>
    );
  }

  const shown = hover > 0 ? hover : rating;

  return (
    <main className="mx-auto min-h-screen max-w-[560px] px-5 py-16">
      <p className="text-xs font-medium tracking-widest text-stone-400 uppercase">
        Write a review
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {name ?? "…"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-10">
        {/* Star picker, 1 to 5 */}
        <div
          className="flex gap-1"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              className={`rounded-lg p-2 text-3xl leading-none transition-colors ${
                n <= shown ? "text-[#b45309]" : "text-stone-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Comment box */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="What did you think?"
          className="mt-8 w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-stone-400 focus:border-[#b45309]"
        />

        {/* Submit — disabled until a rating is picked and the comment is non-empty */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`mt-4 w-full rounded-lg px-5 py-3 text-sm font-medium transition-colors ${
            canSubmit
              ? "bg-[#b45309] text-white hover:bg-[#8f4007]"
              : "cursor-not-allowed bg-stone-200 text-stone-400"
          }`}
        >
          {submitting ? "Saving…" : "Submit"}
        </button>

        {/* The backend's message, shown exactly as it said it */}
        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
