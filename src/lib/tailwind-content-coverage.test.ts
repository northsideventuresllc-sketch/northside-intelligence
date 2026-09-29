import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import fg from "fast-glob";
import jiti from "jiti";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

/**
 * Tailwind only emits utilities for files matched by `content` in tailwind.config.ts.
 * The five public IT landing pages and the shared landing factory live under src/app and
 * src/lib, so they must be matched by a glob or their classes silently vanish from the CSS.
 *
 * Named proof class: `mt-16`. It appears in exactly one source file in the whole repo,
 * src/lib/sector3-tools/create-landing-page.tsx (grep -rlw "mt-16" src), and in nothing under
 * src/components (the only scanned directory that exists; src/pages does not exist).
 */
const ROOT = path.resolve(__dirname, "../..");
const CONFIG_PATH = path.join(ROOT, "tailwind.config.ts");
const PROOF_CLASS = "mt-16";
const REQUIRED_FILES = [
  "src/app/replyflow/page.tsx",
  "src/app/grantbot/page.tsx",
  "src/app/gapscan/page.tsx",
  "src/app/signaldesk/page.tsx",
  "src/app/bridgeai/page.tsx",
  "src/lib/sector3-tools/create-landing-page.tsx",
];

interface LoadedConfig {
  content: string[];
  raw: Record<string, unknown>;
}

function loadRealConfig(): LoadedConfig {
  let mod: unknown;
  try {
    const load = jiti(__filename, { interopDefault: true, cache: false });
    mod = load(CONFIG_PATH);
  } catch (err) {
    throw new Error(`Cannot load real tailwind.config.ts via jiti: ${(err as Error).message}`);
  }
  const raw = ((mod as { default?: unknown }).default ?? mod) as Record<string, unknown>;
  const content = raw?.content as unknown;
  const files = Array.isArray(content)
    ? content
    : (content as { files?: unknown })?.files;
  if (!Array.isArray(files) || files.length === 0 || !files.every((f) => typeof f === "string")) {
    throw new Error("tailwind.config.ts did not expose a string[] `content`");
  }
  return { content: files as string[], raw };
}

async function buildCss(globs: string[], raw: Record<string, unknown>): Promise<string> {
  // absolute globs so the build does not depend on process.cwd()
  const absolute = globs.map((g) => path.join(ROOT, g.replace(/^\.\//, "")));
  const cfg = { ...raw, content: absolute };
  const result = await postcss([tailwindcss(cfg as never)]).process("@tailwind utilities;", {
    from: undefined,
  });
  return result.css;
}

function hasClass(css: string, name: string): boolean {
  return css.includes(`.${name.replace(/[:/[\]]/g, "\\$&")}`) || new RegExp(`\\.${name}[\\s{,:>.]`).test(css);
}

describe("tailwind content coverage for IT public pages", () => {
  let loaded: LoadedConfig;

  beforeAll(() => {
    loaded = loadRealConfig();
  });

  it("proof class is used only by the factory file and absent from every scanned component", () => {
    const factory = fs.readFileSync(path.join(ROOT, "src/lib/sector3-tools/create-landing-page.tsx"), "utf8");
    expect(factory).toMatch(new RegExp(`(^|[\\s"'\`])${PROOF_CLASS}([\\s"'\`]|$)`));
    const comps = fg.sync("src/components/**/*.{js,ts,jsx,tsx,mdx}", { cwd: ROOT, absolute: true });
    expect(comps.length).toBeGreaterThan(0);
    const re = new RegExp(`(^|[^\\w-])${PROOF_CLASS}([^\\w-]|$)`);
    const offenders = comps.filter((f) => re.test(fs.readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it.each(REQUIRED_FILES)("content globs match %s", (rel) => {
    const matched = new Set(
      fg.sync(loaded.content.map((g) => g.replace(/^\.\//, "")), { cwd: ROOT, absolute: true })
    );
    expect(matched.has(path.join(ROOT, rel))).toBe(true);
  });

  it("control: the components-only globs do NOT emit the proof class", async () => {
    const componentsOnly = loaded.content.filter((g) => g.includes("src/components"));
    expect(componentsOnly.length).toBeGreaterThan(0);
    const css = await buildCss(componentsOnly, loaded.raw);
    expect(hasClass(css, PROOF_CLASS), "proof class leaked into components-only CSS").toBe(false);
  });

  it("CSS built with the real config emits the proof class from the factory file", async () => {
    const css = await buildCss(loaded.content, loaded.raw);
    expect(hasClass(css, PROOF_CLASS), `.${PROOF_CLASS} missing from built CSS`).toBe(true);
    expect(hasClass(css, "animate-wave"), ".animate-wave missing from built CSS").toBe(true);
  });
});
