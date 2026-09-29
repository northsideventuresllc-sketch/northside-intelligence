import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";

/**
 * The five IT public pages (/replyflow /grantbot /gapscan /signaldesk /bridgeai) are the
 * logged-out marketing pages. Commit db8c2e3 replaced them with 'use client' demo pages
 * (tier selector, MCP modal, feedback widget). These tests pin the marketing shell that
 * existed at db8c2e3^ using the TypeScript AST, so comments and strings-in-comments never count.
 */
const ROOT = path.resolve(__dirname, "../..");
const BASELINE = "db8c2e3^";

function readHead(it: string): string {
  return fs.readFileSync(path.join(ROOT, "src/app", it, "page.tsx"), "utf8");
}
function readBaseline(it: string): string | null {
  try {
    return execFileSync("git", ["show", `${BASELINE}:src/app/${it}/page.tsx`], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null; // shallow clone without history: baseline column prints n/a
  }
}

interface Facts {
  useClient: boolean;
  identifiers: Set<string>;
  jsxTags: Set<string>;
  imports: { name: string; from: string }[];
  /** every string literal / template / JSX text (comments excluded by construction) */
  text: string;
  h1Text: string;
  factoryCall: { firstArg: string | null; props: Record<string, string> } | null;
}

function analyze(source: string): Facts {
  const sf = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const facts: Facts = {
    useClient: false,
    identifiers: new Set(),
    jsxTags: new Set(),
    imports: [],
    text: "",
    h1Text: "",
    factoryCall: null,
  };
  for (const st of sf.statements) {
    if (!ts.isExpressionStatement(st) || !ts.isStringLiteral(st.expression)) break;
    if (st.expression.text === "use client") facts.useClient = true;
  }
  const texts: string[] = [];
  const textOf = (n: ts.Node): string => {
    const parts: string[] = [];
    const walk = (x: ts.Node) => {
      if (ts.isJsxText(x)) parts.push(x.text.replace(/\s+/g, " ").trim());
      else if (ts.isStringLiteralLike(x)) parts.push(x.text);
      ts.forEachChild(x, walk);
    };
    walk(n);
    return parts.filter(Boolean).join(" ");
  };
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n)) facts.identifiers.add(n.text);
    if (ts.isJsxText(n)) texts.push(n.text);
    if (ts.isStringLiteralLike(n)) texts.push(n.text);
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      facts.jsxTags.add(tag);
    }
    if (ts.isJsxElement(n) && n.openingElement.tagName.getText(sf) === "h1") {
      facts.h1Text += " " + textOf(n);
    }
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      const from = n.moduleSpecifier.text;
      const clause = n.importClause;
      if (clause?.name) facts.imports.push({ name: clause.name.text, from });
      const nb = clause?.namedBindings;
      if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) facts.imports.push({ name: el.name.text, from });
    }
    if (ts.isExportAssignment(n) && ts.isCallExpression(n.expression)) {
      const call = n.expression;
      if (ts.isIdentifier(call.expression) && call.expression.text === "createSector3LandingPage") {
        const [a0, a1] = call.arguments;
        const props: Record<string, string> = {};
        if (a1 && ts.isObjectLiteralExpression(a1)) {
          for (const p of a1.properties) {
            if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && ts.isStringLiteralLike(p.initializer)) {
              props[p.name.text] = p.initializer.text;
            }
          }
        }
        facts.factoryCall = { firstArg: a0 && ts.isIdentifier(a0) ? a0.text : null, props };
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  facts.text = texts.join("\n");
  return facts;
}

const FORBIDDEN_IDENTS = ["MCPManagerModal", "ITFeedbackWidget", "useState"];
const ALL_ITS = ["replyflow", "grantbot", "gapscan", "signaldesk", "bridgeai"] as const;

interface MarkerRow {
  it: string;
  marker: string;
  base: (f: Facts) => boolean;
}

const FACTORY = {
  gapscan: { cfg: "GAPSCAN_CONFIG", headline: "Find the Gaps", accent: "Before They Cost You" },
  signaldesk: { cfg: "SIGNALDESK_CONFIG", headline: "Signal Intelligence", accent: "Ranked and Actionable" },
  bridgeai: { cfg: "BRIDGEAI_CONFIG", headline: "Bridge Your Stack", accent: "With an Orchestration Plan" },
} as const;

const SERVER_PAGES = {
  grantbot: { prefix: "GrantBot", h1: ["Grant Discovery", "And Drafting That Saves Hours"] },
  replyflow: { prefix: "ReplyFlow", h1: ["Customer Replies", "That Sound Human, Ship Fast"] },
} as const;

function markerRows(): { it: string; marker: string; check: (f: Facts) => boolean }[] {
  const rows: { it: string; marker: string; check: (f: Facts) => boolean }[] = [];
  for (const [it, d] of Object.entries(SERVER_PAGES)) {
    rows.push({ it, marker: `<${d.prefix}Nav>`, check: (f) => f.jsxTags.has(`${d.prefix}Nav`) });
    rows.push({ it, marker: `<${d.prefix}PricingSection>`, check: (f) => f.jsxTags.has(`${d.prefix}PricingSection`) });
    for (const lit of d.h1) rows.push({ it, marker: `<h1> "${lit}"`, check: (f) => f.h1Text.includes(lit) });
  }
  for (const [it, d] of Object.entries(FACTORY)) {
    rows.push({
      it,
      marker: `import ${d.cfg} from configs`,
      check: (f) => f.imports.some((i) => i.name === d.cfg && i.from === "@/lib/sector3-tools/configs"),
    });
    rows.push({
      it,
      marker: `createSector3LandingPage(${d.cfg},`,
      check: (f) => f.factoryCall?.firstArg === d.cfg,
    });
    rows.push({ it, marker: `headline "${d.headline}"`, check: (f) => f.factoryCall?.props.headline === d.headline });
    rows.push({ it, marker: `headlineAccent "${d.accent}"`, check: (f) => f.factoryCall?.props.headlineAccent === d.accent });
  }
  for (const it of ALL_ITS) {
    rows.push({ it, marker: "NOT 'use client'", check: (f) => !f.useClient });
    for (const id of FORBIDDEN_IDENTS) rows.push({ it, marker: `NOT ${id}`, check: (f) => !f.identifiers.has(id) });
    rows.push({ it, marker: "NOT Autopilot/agentic text", check: (f) => !/autopilot|agentic/i.test(f.text) && ![...f.identifiers].some((i) => /autopilot|agentic/i.test(i)) });
  }
  return rows;
}

describe("IT public pages are the marketing shell (not the db8c2e3 client demos)", () => {
  const rows = markerRows();

  it("prints marker table: marker | in db8c2e3^ | in HEAD", () => {
    const lines = ["", "IT | marker | db8c2e3^ | HEAD"];
    for (const r of rows) {
      const b = readBaseline(r.it);
      const base = b === null ? "n/a" : r.check(analyze(b)) ? "yes" : "no";
      const head = r.check(analyze(readHead(r.it))) ? "yes" : "no";
      lines.push(`${r.it} | ${r.marker} | ${base} | ${head}`);
    }
    console.log(lines.join("\n"));
    expect(rows.length).toBeGreaterThan(0);
  });

  for (const [slug, d] of Object.entries(SERVER_PAGES)) {
    describe(`${slug} (server marketing page)`, () => {
      const f = () => analyze(readHead(slug));
      it(`renders <${d.prefix}Nav> and <${d.prefix}PricingSection>`, () => {
        expect(f().jsxTags.has(`${d.prefix}Nav`)).toBe(true);
        expect(f().jsxTags.has(`${d.prefix}PricingSection`)).toBe(true);
      });
      it("has the original <h1> headline", () => {
        for (const lit of d.h1) expect(f().h1Text).toContain(lit);
      });
    });
  }

  for (const [slug, d] of Object.entries(FACTORY)) {
    describe(`${slug} (factory page)`, () => {
      const f = () => analyze(readHead(slug));
      it(`imports ${d.cfg} from '@/lib/sector3-tools/configs'`, () => {
        expect(f().imports).toContainEqual({ name: d.cfg, from: "@/lib/sector3-tools/configs" });
        expect(f().imports).toContainEqual({
          name: "createSector3LandingPage",
          from: "@/lib/sector3-tools/create-landing-page",
        });
      });
      it(`default-exports createSector3LandingPage(${d.cfg}, ...)`, () => {
        expect(f().factoryCall?.firstArg).toBe(d.cfg);
      });
      it("keeps the original headline and headlineAccent", () => {
        expect(f().factoryCall?.props.headline).toBe(d.headline);
        expect(f().factoryCall?.props.headlineAccent).toBe(d.accent);
      });
    });
  }

  describe.each(ALL_ITS)("%s has none of the client-demo leftovers", (slug) => {
    const f = () => analyze(readHead(slug));
    it("is not a 'use client' module", () => {
      expect(f().useClient).toBe(false);
    });
    it.each(FORBIDDEN_IDENTS)("does not reference %s", (id) => {
      expect(f().identifiers.has(id)).toBe(false);
    });
    it("has no Autopilot / agentic copy", () => {
      expect(f().text).not.toMatch(/autopilot|agentic/i);
    });
  });
});
