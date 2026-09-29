import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AutopilotComingSoonCard } from "./AutopilotComingSoonCard";

describe("AutopilotComingSoonCard", () => {
  const html = renderToStaticMarkup(createElement(AutopilotComingSoonCard));

  it("says Autopilot and Coming Soon", () => {
    expect(html).toContain("Autopilot");
    expect(html).toContain("Coming Soon");
  });

  it("has no selector, button, link or price", () => {
    expect(html).not.toContain("<select");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a ");
    expect(html).not.toMatch(/\$\d/);
  });
});
