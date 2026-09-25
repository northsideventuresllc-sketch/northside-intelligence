import { describe, it, expect } from "vitest";
import {
  plainPlatform,
  plainHealth,
  plainWakeType,
  routineAgentStatus,
  plainCommsSource,
  plainCommsStatus,
  plainFleetStatus,
  plainSurface,
  plainDispatchState,
  plainToolkitBuildStatus,
  rosterHarnessBucket,
  plainHarnessBucket,
  rosterHealthChip,
  rosterHealthChipClass,
  plainRunMode,
  plainTodoStatus,
  todoStatusDotClass,
  plainMiniToggleNote,
  plainRelativeTime,
} from "./plain-labels";

describe("plainPlatform", () => {
  it("maps a known platform", () => {
    expect(plainPlatform("claude_code_cloud")).toBe("Claude Code");
  });
  it("defaults to axon for null/undefined", () => {
    expect(plainPlatform(null)).toBe("AXON");
    expect(plainPlatform(undefined)).toBe("AXON");
  });
  it("de-jargons an unknown platform instead of showing a raw slug", () => {
    expect(plainPlatform("some_new_platform")).toBe("Some new platform");
  });
});

describe("plainHealth", () => {
  it("maps healthy synonyms to Healthy", () => {
    expect(plainHealth("ok")).toBe("Healthy");
    expect(plainHealth("green")).toBe("Healthy");
  });
  it("maps broken synonyms to Not responding", () => {
    expect(plainHealth("critical")).toBe("Not responding");
    expect(plainHealth("down")).toBe("Not responding");
  });
  it("returns undefined for empty input", () => {
    expect(plainHealth(null)).toBeUndefined();
  });
});

describe("plainWakeType", () => {
  it("maps schedule synonyms to Scheduled", () => {
    expect(plainWakeType("cron")).toBe("Scheduled");
    expect(plainWakeType("schedule")).toBe("Scheduled");
  });
  it("returns undefined for empty input", () => {
    expect(plainWakeType(undefined)).toBeUndefined();
  });
});

describe("routineAgentStatus", () => {
  it("is idle when not active regardless of health", () => {
    expect(routineAgentStatus(false, "healthy")).toBe("idle");
    expect(routineAgentStatus(false, "down")).toBe("idle");
  });
  it("is blocked when active and health is a known-broken value", () => {
    expect(routineAgentStatus(true, "error")).toBe("blocked");
  });
  it("is active when active and health is not a known-broken value", () => {
    expect(routineAgentStatus(true, "healthy")).toBe("active");
    expect(routineAgentStatus(true, null)).toBe("active");
  });
  it("never returns a 5th state", () => {
    const result = routineAgentStatus(true, "unknown");
    expect(["blocked", "active", "idle"]).toContain(result);
  });
});

describe("plainCommsSource", () => {
  it("maps known sources", () => {
    expect(plainCommsSource("bus")).toBe("Agent Bus");
    expect(plainCommsSource("slack")).toBe("Slack");
  });
  it("returns Unknown for empty input", () => {
    expect(plainCommsSource(null)).toBe("Unknown");
  });
});

describe("plainCommsStatus", () => {
  it("maps open/pending to Waiting", () => {
    expect(plainCommsStatus("open")).toBe("Waiting");
    expect(plainCommsStatus("pending")).toBe("Waiting");
  });
  it("maps resolved to Answered", () => {
    expect(plainCommsStatus("resolved")).toBe("Answered");
  });
});

describe("plainFleetStatus", () => {
  it("maps known fleet statuses, never raw LIVE/STALE", () => {
    expect(plainFleetStatus("live")).toBe("Alive");
    expect(plainFleetStatus("never_seen")).toBe("Never checked in");
  });
  it("returns Status unknown for empty input", () => {
    expect(plainFleetStatus(null)).toBe("Status unknown");
  });
});

describe("plainSurface", () => {
  it("maps known surfaces", () => {
    expect(plainSurface("github_actions")).toBe("GitHub Actions");
    expect(plainSurface("mac_mini")).toBe("Mac Mini");
  });
});

describe("plainDispatchState", () => {
  it("maps known states, never the raw enum", () => {
    expect(plainDispatchState("completed")).toBe("Done");
    expect(plainDispatchState("failed")).toBe("Could not finish");
  });
  it("defaults to Sent for null", () => {
    expect(plainDispatchState(null)).toBe("Sent");
  });
});

describe("plainToolkitBuildStatus", () => {
  it("maps known statuses", () => {
    expect(plainToolkitBuildStatus("held")).toBe("Waiting on the FIRE gate");
  });
  it("defaults to Draft for null", () => {
    expect(plainToolkitBuildStatus(null)).toBe("Draft");
  });
});

describe("rosterHarnessBucket / plainHarnessBucket", () => {
  it("buckets legacy harness values into one of the five allowed buckets", () => {
    expect(rosterHarnessBucket("axon_local")).toBe("axon_v0");
    expect(rosterHarnessBucket("claude_code_routine")).toBe("claude_code");
    expect(rosterHarnessBucket("github_actions")).toBe("hermes");
  });
  it("buckets an unrecognized value into other, never invents a 6th bucket", () => {
    expect(rosterHarnessBucket("something_else")).toBe("other");
    expect(rosterHarnessBucket(null)).toBe("other");
  });
  it("gives a plain title for each bucket", () => {
    expect(plainHarnessBucket("axon_v0")).toBe("AXON v0");
    expect(plainHarnessBucket("other")).toBe("Unsorted");
  });
});

describe("rosterHealthChip", () => {
  it("returns Archived when retired regardless of health", () => {
    expect(rosterHealthChip("healthy", "2026-01-01T00:00:00Z", null)).toBe("Archived");
  });
  it("returns Healthy for a healthy status", () => {
    expect(rosterHealthChip("healthy", null, new Date().toISOString())).toBe("Healthy");
  });
  it("returns Broken for a known-broken status", () => {
    expect(rosterHealthChip("critical", null, new Date().toISOString())).toBe("Broken");
  });
  it("returns Needs attention for a known-degraded status", () => {
    expect(rosterHealthChip("degraded", null, new Date().toISOString())).toBe("Needs attention");
  });
  it("returns Stale for an unknown status that hasn't fired in over 3 days", () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(rosterHealthChip("unknown", null, old)).toBe("Stale");
  });
  it("returns Stale for a row that has never fired", () => {
    expect(rosterHealthChip(null, null, null)).toBe("Stale");
  });
  it("returns Needs attention for an unknown status with a recent fire", () => {
    expect(rosterHealthChip("unknown", null, new Date().toISOString())).toBe("Needs attention");
  });
});

describe("rosterHealthChipClass", () => {
  it("maps every chip to a css class", () => {
    expect(rosterHealthChipClass("Healthy")).toBe("cf-status-pill--live");
    expect(rosterHealthChipClass("Broken")).toBe("cf-status-pill--broken");
  });
});

describe("plainRunMode", () => {
  it("prefers model over provider", () => {
    expect(plainRunMode("anthropic", "claude-sonnet-5", "cron")).toBe("claude-sonnet-5 · Scheduled");
  });
  it("falls back to provider when model is missing", () => {
    expect(plainRunMode("anthropic", null, null)).toBe("Anthropic");
  });
  it("returns No LLM when nothing is set", () => {
    expect(plainRunMode(null, null, null)).toBe("No LLM");
  });
});

describe("plainTodoStatus / todoStatusDotClass", () => {
  it("done wins over raw status", () => {
    expect(plainTodoStatus("urgent", true)).toBe("Done");
    expect(todoStatusDotClass("urgent", true)).toBe("td-dot-done");
  });
  it("maps known statuses", () => {
    expect(plainTodoStatus("semi_urgent")).toBe("High this week");
    expect(todoStatusDotClass("urgent")).toBe("td-dot-urgent");
  });
  it("defaults to Open for unknown/empty status", () => {
    expect(plainTodoStatus(null)).toBe("Open");
    expect(todoStatusDotClass(null)).toBe("td-dot-open");
  });
});

describe("plainMiniToggleNote", () => {
  it("returns the note only for nvg_mini platform", () => {
    expect(plainMiniToggleNote("nvg_mini")).toMatch(/Mac mini/);
  });
  it("returns null for any other platform", () => {
    expect(plainMiniToggleNote("github_actions")).toBeNull();
    expect(plainMiniToggleNote(null)).toBeNull();
  });
});

describe("plainRelativeTime", () => {
  it("returns undefined for empty/invalid input", () => {
    expect(plainRelativeTime(null)).toBeUndefined();
    expect(plainRelativeTime("not-a-date")).toBeUndefined();
  });
  it("returns just now for a timestamp under a minute old", () => {
    expect(plainRelativeTime(new Date().toISOString())).toBe("just now");
  });
  it("returns minutes ago for a recent timestamp", () => {
    const iso = new Date(Date.now() - 5 * 60000).toISOString();
    expect(plainRelativeTime(iso)).toBe("5m ago");
  });
  it("returns hours ago for an older timestamp", () => {
    const iso = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(plainRelativeTime(iso)).toBe("3h ago");
  });
  it("returns days ago for a much older timestamp", () => {
    const iso = new Date(Date.now() - 5 * 86400000).toISOString();
    expect(plainRelativeTime(iso)).toBe("5d ago");
  });
});
