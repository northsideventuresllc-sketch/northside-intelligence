import type { ToolHandler } from "../types";

const MATCH_FIT = "https://match-fit.net";

/**
 * Match Fit bookings require a Match Fit client account (payments and session credits are tied
 * to it), so NI never charges or books on Match Fit's behalf. We hand back the coach's public
 * profile, where the buyer signs up and checks out on Match Fit directly.
 */
export const handler: ToolHandler = async (_tool, params) => {
  const raw = typeof params.coach_id === "string" ? params.coach_id : typeof params.username === "string" ? params.username : "";
  const username = raw.trim();
  if (!/^[a-zA-Z0-9_-]{2,64}$/.test(username)) {
    return { status: "invalid_input", message: "coach_id must be a coach username from mf_search_coaches." };
  }
  return {
    status: "ok",
    data: {
      coach: username,
      next_step_url: `${MATCH_FIT}/trainers/${encodeURIComponent(username)}`,
      booked: false,
    },
    message: "Not booked yet. Send the buyer to next_step_url to create a Match Fit account and complete checkout with the coach.",
  };
};
