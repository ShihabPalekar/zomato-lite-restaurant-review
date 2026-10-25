"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type RestaurantPage = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

// Presentation only — builds "★★★★☆". No ratings are invented here.
function starsOf(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function showDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RestaurantPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/restaurants/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Restaurant not found.");
        const body = (await res.json()) as RestaurantPage;
        if (alive) setData(body);
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Could not load this page.");
        }
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto min-h-screen max-w-[560px] px-5 py-16">
        <p className="text-sm text-stone-500">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto min-h-screen max-w-[560px] px-5 py-16">
        <p className="text-sm text-stone-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[560px] px-5 py-16">
      {/* 1. Name + location */}
      <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
      <p className="mt-1 text-sm text-stone-500">
        {data.cuisine} · {data.area}
      </p>

      {/* 2. The big number — printed, not computed. No maths in this file. */}
      {data.averageRating !== null && (
        <div className="mt-10 flex items-baseline gap-3">
          <span className="text-6xl font-bold tracking-tight">
            {data.averageRating}
          </span>
          <span className="text-sm text-stone-500">
            {data.totalReviews} {data.totalReviews === 1 ? "review" : "reviews"}
          </span>
        </div>
      )}

      {/* 3. Latest review — set apart on purpose */}
      {data.latestReview && (
        <section className="mt-8">
          <p className="text-xs font-medium tracking-widest text-[#b45309] uppercase">
            Latest
          </p>
          <div className="mt-3 rounded-xl border border-[#b45309]/25 bg-[#b45309]/5 p-5">
            <p className="text-sm tracking-wider text-[#b45309]" aria-label={`${data.latestReview.rating} out of 5 stars`}>
              {starsOf(data.latestReview.rating)}
            </p>
            <p className="mt-2 leading-relaxed">{data.latestReview.comment}</p>
            <p className="mt-3 text-xs text-stone-500">
              {showDate(data.latestReview.createdAt)}
            </p>
          </div>
        </section>
      )}

      {/* 4. Older reviews, plain list */}
      {data.reviews.length > 0 && (
        <ul className="mt-10 divide-y divide-stone-200">
          {data.reviews.map((review) => (
            <li key={review.id} className="py-4">
              <p className="text-sm tracking-wider text-stone-400" aria-label={`${review.rating} out of 5 stars`}>
                {starsOf(review.rating)}
              </p>
              <p className="mt-1 leading-relaxed">{review.comment}</p>
              <p className="mt-2 text-xs text-stone-500">{showDate(review.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Empty state — nothing collected yet, so insteaed of a fake zero… */}
      {data.totalReviews === 0 && (
        <div className="mt-10 rounded-xl border border-stone-200 bg-white p-6 text-center">
          <p className="font-medium">No reviews yet</p>
          <p className="mt-1 text-sm text-stone-500">
            Be the first to review this place.
          </p>
        </div>
      )}

      {/* 5. Door to Screen 1 */}
      <Link
        href={`/review/${id}`}
        className="mt-12 inline-flex rounded-lg bg-[#b45309] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#8f4007]"
      >
        Write a review
      </Link>
    </main>
  );
}
