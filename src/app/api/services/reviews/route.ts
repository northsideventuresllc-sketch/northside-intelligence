import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getServiceBySlug } from "@/lib/services/offerings";

interface ReviewBody {
  serviceSlug: string;
  rating: number;
  title?: string;
  body: string;
}

export async function GET(request: NextRequest) {
  const serviceSlug = request.nextUrl.searchParams.get("serviceSlug");
  const admin = createServiceClient();

  let query = admin
    .from("ni_service_reviews")
    .select("id, service_slug, rating, title, body, created_at, user_id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (serviceSlug) {
    query = query.eq("service_slug", serviceSlug);
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }

  const userIds = Array.from(new Set((reviews ?? []).map((r) => r.user_id)));
  const profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("ni_portal_profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      const name =
        profile.full_name?.trim() ||
        profile.email?.split("@")[0] ||
        "Verified Customer";
      profileMap.set(profile.id, name);
    }
  }

  const enrichedReviews = (reviews ?? []).map((review) => ({
    id: review.id,
    service_slug: review.service_slug,
    rating: review.rating,
    title: review.title,
    body: review.body,
    created_at: review.created_at,
    author_name: profileMap.get(review.user_id) ?? "Verified Customer",
  }));

  const summaryMap = new Map<string, { total: number; count: number }>();
  for (const review of enrichedReviews) {
    const existing = summaryMap.get(review.service_slug) ?? { total: 0, count: 0 };
    existing.total += review.rating;
    existing.count += 1;
    summaryMap.set(review.service_slug, existing);
  }

  const summaries = Array.from(summaryMap.entries()).map(([slug, { total, count }]) => ({
    service_slug: slug,
    average_rating: total / count,
    review_count: count,
  }));

  return NextResponse.json({ reviews: enrichedReviews, summaries });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "An account is required to submit a review" },
      { status: 401 }
    );
  }

  let body: ReviewBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.serviceSlug?.trim()) {
    return NextResponse.json({ error: "Service slug is required" }, { status: 400 });
  }

  const service = getServiceBySlug(body.serviceSlug.trim());
  if (!service) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }

  if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Review body is required" }, { status: 400 });
  }

  const admin = createServiceClient();
  const now = new Date().toISOString();

  const { error: insertError } = await admin.from("ni_service_reviews").insert({
    user_id: user.id,
    service_slug: body.serviceSlug.trim(),
    rating: Math.round(body.rating),
    title: body.title?.trim() || null,
    body: body.body.trim(),
    status: "published",
    created_at: now,
    updated_at: now,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You have already reviewed this service" },
        { status: 409 }
      );
    }
    console.error("Failed to insert review:", insertError);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
