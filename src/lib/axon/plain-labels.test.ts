import { describe, it, expect } from "vitest";
import { plainStatus, statusHelp, mediaStatusLabel } from "./plain-labels";

describe("plainStatus", () => {
  it("maps a known status to its plain label", () => {
    expect(plainStatus("pending_approval")).toBe("Waiting on you");
    expect(plainStatus("sent")).toBe("Sent");
    expect(plainStatus("closed_won")).toBe("Became a customer");
  });

  it("never returns a raw underscored code for a known status", () => {
    expect(plainStatus("icp_auto")).not.toContain("_");
  });

  it("de-underscores and capitalizes an unknown status as fallback", () => {
    expect(plainStatus("some_new_code")).toBe("Some new code");
  });

  it("handles an empty string without throwing", () => {
    expect(plainStatus("")).toBe("");
  });
});

describe("statusHelp", () => {
  it("returns help text for a known status", () => {
    expect(statusHelp("dead")).toMatch(/No reply/);
  });

  it("returns undefined for an unknown status", () => {
    expect(statusHelp("totally_unknown")).toBeUndefined();
  });
});

describe("mediaStatusLabel", () => {
  it("returns undefined for null/undefined input", () => {
    expect(mediaStatusLabel(null)).toBeUndefined();
    expect(mediaStatusLabel(undefined)).toBeUndefined();
  });

  it("maps the known pending_mini_chrome status", () => {
    expect(mediaStatusLabel("pending_mini_chrome")).toBe(
      "Waiting for media from the Mac mini"
    );
  });

  it("falls back to a sane default for an unrecognized non-empty status", () => {
    expect(mediaStatusLabel("some_future_status")).toBe(
      "Waiting for media from the Mac mini"
    );
  });
});
