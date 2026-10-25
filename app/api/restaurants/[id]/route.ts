import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

type ReviewRow = {
  id: number;
  rating: number;
  comment: string;
  created_at: string | Date;
};

function shapeReview(row: ReviewRow) {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const db = neon(process.env.DATABASE_URL!);

  try {
    // Fact 0: does the restaurant exist?
    const restaurants = (await db.query(
      "SELECT name, cuisine, area FROM restaurants WHERE id = $1",
      [restaurantId]
    )) as Array<{ name: string; cuisine: string; area: string }>;
    if (restaurants.length === 0) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 404 }
      );
    }

    // Facts -> answers, at the moment somebody asks.
    // This is the entire "intelligence" of the product, in one query:
    const stats = (await db.query(
      "SELECT AVG(rating) AS avg_rating, COUNT(*) AS total FROM reviews WHERE restaurant_id = $1",
      [restaurantId]
    )) as Array<{ avg_rating: string | null; total: string }>;

    // Newest first, latest created id wins ties.
    const all = (await db.query(
      "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC, id DESC",
      [restaurantId]
    )) as ReviewRow[];

    const latestReview = all.length > 0 ? shapeReview(all[0]) : null;
    const olderReviews = all.slice(1).map(shapeReview);

    // Round to one decimal — this is backend work, never frontend work.
    const avg = stats[0].avg_rating;
    const averageRating =
      avg === null ? null : Math.round(Number(avg) * 10) / 10;

    return NextResponse.json(
      {
        name: restaurants[0].name,
        cuisine: restaurants[0].cuisine,
        area: restaurants[0].area,
        averageRating,
        totalReviews: Number(stats[0].total),
        latestReview,
        reviews: olderReviews,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our side." },
      { status: 500 }
    );
  }
}
