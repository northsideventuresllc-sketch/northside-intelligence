"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { INTELLIGENCE_SERVICES } from "@/lib/services/offerings";
import { buildPortalAuthUrl } from "@/lib/ni-auth";
import { StarRating } from "@/components/services/StarRating";

interface Review {
  id: string;
  service_slug: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
  author_name: string;
}

interface ReviewSummary {
  service_slug: string;
  average_rating: number;
  review_count: number;
}

export function ServiceReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summaries, setSummaries] = useState<ReviewSummary[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterSlug, setFilterSlug] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);

  const [formSlug, setFormSlug] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchReviews = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterSlug !== "all") params.set("serviceSlug", filterSlug);

    const res = await fetch(`/api/services/reviews?${params.toString()}`);
    if (!res.ok) return;
    const data = (await res.json()) as { reviews: Review[]; summaries: ReviewSummary[] };
    setReviews(data.reviews);
    setSummaries(data.summaries);
  }, [filterSlug]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      const [authRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json() as Promise<{ user?: unknown }>),
        fetchReviews(),
      ]);
      if (!cancelled) {
        setIsLoggedIn(!!authRes.user);
        setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [fetchReviews]);

  async function handleSubmitReview(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formSlug) {
      setFormError("Please select a service to review.");
      return;
    }
    if (formRating < 1) {
      setFormError("Please select a star rating.");
      return;
    }
    if (!formBody.trim()) {
      setFormError("Please write your review.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/services/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: formSlug,
          rating: formRating,
          title: formTitle.trim() || undefined,
          body: formBody.trim(),
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Failed to submit review");
        return;
      }

      setFormSuccess(true);
      setFormRating(0);
      setFormTitle("");
      setFormBody("");
      setShowForm(false);
      await fetchReviews();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50";

  const overallAvg =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.average_rating * s.review_count, 0) /
        summaries.reduce((sum, s) => sum + s.review_count, 0)
      : 0;
  const totalReviews = summaries.reduce((sum, s) => sum + s.review_count, 0);

  return (
    <section className="mt-20 border-t border-white/10 pt-16">
      <div className="mb-10 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
          Reviews
        </p>
        <h2 className="mb-4 text-3xl font-semibold text-white">What Customers Say</h2>
        {totalReviews > 0 && (
          <div className="flex items-center justify-center gap-3">
            <StarRating rating={overallAvg} size="lg" />
            <span className="text-lg font-medium text-white">{overallAvg.toFixed(1)}</span>
            <span className="text-sm text-ni-muted">
              ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
            </span>
          </div>
        )}
      </div>

      {summaries.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => {
            const service = INTELLIGENCE_SERVICES.find((s) => s.slug === summary.service_slug);
            return (
              <div
                key={summary.service_slug}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <p className="mb-1 text-sm font-medium text-white">
                  {service?.name ?? summary.service_slug}
                </p>
                <div className="flex items-center gap-2">
                  <StarRating rating={summary.average_rating} size="sm" />
                  <span className="text-xs text-ni-muted">
                    {summary.average_rating.toFixed(1)} ({summary.review_count})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <select
          value={filterSlug}
          onChange={(e) => setFilterSlug(e.target.value)}
          className="rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Services</option>
          {INTELLIGENCE_SERVICES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>

        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setFormSuccess(false);
            }}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            {showForm ? "Cancel" : "Write a Review"}
          </button>
        ) : (
          <Link
            href={buildPortalAuthUrl("signup", "/services")}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            Create Free Account to Review
          </Link>
        )}
      </div>

      {formSuccess && (
        <p className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Thank you! Your review has been published.
        </p>
      )}

      {showForm && isLoggedIn && (
        <form onSubmit={handleSubmitReview} className="glass-panel mb-8 space-y-4 p-6">
          {formError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
              {formError}
            </p>
          )}

          <div>
            <label htmlFor="reviewService" className="mb-1 block text-sm text-ni-muted">
              Service
            </label>
            <select
              id="reviewService"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select a service</option>
              {INTELLIGENCE_SERVICES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-ni-muted">Rating</label>
            <StarRating
              rating={formRating}
              size="lg"
              interactive
              onChange={setFormRating}
            />
          </div>

          <div>
            <label htmlFor="reviewTitle" className="mb-1 block text-sm text-ni-muted">
              Title (Optional)
            </label>
            <input
              id="reviewTitle"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Summarize your experience"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="reviewBody" className="mb-1 block text-sm text-ni-muted">
              Your Review
            </label>
            <textarea
              id="reviewBody"
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              required
              rows={4}
              placeholder="Share your experience with this service..."
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {formLoading ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center text-sm text-ni-muted">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-ni-muted">No reviews yet. Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const service = INTELLIGENCE_SERVICES.find((s) => s.slug === review.service_slug);
            return (
              <article key={review.id} className="glass-panel p-6">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{review.author_name}</p>
                    <p className="text-xs text-ni-muted">
                      {service?.name ?? review.service_slug} ·{" "}
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.title && (
                  <p className="mb-2 text-sm font-semibold text-white">{review.title}</p>
                )}
                <p className="text-sm leading-relaxed text-ni-muted">{review.body}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
