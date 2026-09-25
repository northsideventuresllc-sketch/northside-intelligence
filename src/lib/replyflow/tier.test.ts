import { describe, it, expect, afterEach } from "vitest";
import { getDeploymentTier, normalizeUserPlan, getPlanLimits, PLAN_LABELS } from "./tier";

describe("getDeploymentTier", () => {
  const original = process.env.TIER;
  afterEach(() => {
    process.env.TIER = original;
  });

  it("returns lite only when TIER=lite", () => {
    process.env.TIER = "lite";
    expect(getDeploymentTier()).toBe("lite");
  });

  it("defaults to pro for any other value", () => {
    process.env.TIER = "anything-else";
    expect(getDeploymentTier()).toBe("pro");
    delete process.env.TIER;
    expect(getDeploymentTier()).toBe("pro");
  });
});

describe("normalizeUserPlan", () => {
  it("passes through a known plan", () => {
    expect(normalizeUserPlan("solo")).toBe("solo");
    expect(normalizeUserPlan("agency")).toBe("agency");
  });

  it("falls back to free for null/undefined/unknown", () => {
    expect(normalizeUserPlan(null)).toBe("free");
    expect(normalizeUserPlan(undefined)).toBe("free");
    expect(normalizeUserPlan("enterprise")).toBe("free");
  });
});

describe("getPlanLimits", () => {
  it("gives lower limits on lite than pro for every plan", () => {
    const lite = getPlanLimits("lite");
    const pro = getPlanLimits("pro");
    for (const plan of ["free", "solo", "team", "agency"] as const) {
      expect(lite[plan]).toBeLessThanOrEqual(pro[plan]);
    }
  });

  it("agency on pro is effectively unlimited", () => {
    expect(getPlanLimits("pro").agency).toBe(999999);
  });
});

describe("PLAN_LABELS", () => {
  it("has a label for every plan", () => {
    expect(PLAN_LABELS.free).toBe("Free");
    expect(PLAN_LABELS.agency).toBe("Agency");
  });
});
