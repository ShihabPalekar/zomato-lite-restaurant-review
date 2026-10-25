import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  const db = neon(process.env.DATABASE_URL!);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }
  const data = body as {
    restaurantId?: unknown;
    rating?: unknown;
    comment?: unknown;
  };

  // Check 1: rating is a whole number from 1 to 5
  if (
    !Number.isInteger(data.rating) ||
    (data.rating as number) < 1 ||
    (data.rating as number) > 5
  ) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  // Check 2: comment is non-empty after trimming whitespace
  if (typeof data.comment !== "string" || data.comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Comment must be non-empty text." },
      { status: 400 }
    );
  }

  // Check 3: restaurantId is a whole number (before the database is bothered)
  if (!Number.isInteger(data.restaurantId)) {
    return NextResponse.json(
      { error: "Restaurant must be identified by a whole number." },
      { status: 400 }
    );
  }

  // From here on, every check involves the database — so every possible
  // failure from here is either "client sent something invalid" (400) or
  // "the database was unreachable" (500, caught below).
  try {
    // Check 4: the restaurant actually exists (a database lookup)
    const existing = (await db.query(
      "SELECT id FROM restaurants WHERE id = $1",
      [data.restaurantId]
    )) as Array<{ id: number }>;
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 400 }
      );
    }

    // All checks passed — write exactly one row of fact.
    const inserted = (await db.query(
      "INSERT INTO reviews (restaurant_id, rating, comment) VALUES ($1, $2, $3) RETURNING id",
      [data.restaurantId, data.rating, data.comment.trim()]
    )) as Array<{ id: number }>;

    return NextResponse.json(
      { success: true, reviewId: inserted[0].id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong on our side." },
      { status: 500 }
    );
  }
}
