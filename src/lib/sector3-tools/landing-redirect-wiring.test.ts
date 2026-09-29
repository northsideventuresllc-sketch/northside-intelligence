import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

/**
 * A logged-in user hitting an IT landing page must be redirected to its dashboard.
 * The redirect only works if the page function's FIRST statement is
 *   await redirectLoggedInSector3ToDashboard(<basePath>)
 * (anything before it, a missing await, a nested/conditional call, or a hoisted call all
 * change behaviour). Checked on the TypeScript AST, not with regexes.
 */
const ROOT = path.resolve(__dirname, "../../..");
const CALLEE = "redirectLoggedInSector3ToDashboard";

const parse = (src: string) =>
  ts.createSourceFile("x.tsx", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/** Returns null when the first statement of `body` is `await CALLEE(<arg>)`, else a reason. */
function firstStatementProblem(
  body: ts.Block | undefined,
  matchArg: (arg: ts.Expression, sf: ts.SourceFile) => boolean,
  sf: ts.SourceFile
): string | null {
  if (!body) return "function has no block body";
  const first = body.statements[0];
  if (!first) return "function body is empty";
  if (!ts.isExpressionStatement(first)) return `first statement is ${ts.SyntaxKind[first.kind]}, not the redirect call`;
  const e = first.expression;
  if (!ts.isAwaitExpression(e)) return "first statement is not awaited";
  const call = e.expression;
  if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || call.expression.text !== CALLEE) {
    return `first statement does not await ${CALLEE}(...)`;
  }
  if (call.arguments.length !== 1 || !matchArg(call.arguments[0], sf)) {
    return `${CALLEE} argument is not the expected path`;
  }
  return null;
}

function isAsync(fn: ts.FunctionLikeDeclaration | ts.FunctionExpression | ts.ArrowFunction): boolean {
  return !!ts.getModifiers(fn as ts.HasModifiers)?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
}

/** Factory: the inner async function RETURNED by createSector3LandingPage. */
function checkFactory(src: string): string | null {
  const sf = parse(src);
  const outer = sf.statements.find(
    (s): s is ts.FunctionDeclaration => ts.isFunctionDeclaration(s) && s.name?.text === "createSector3LandingPage"
  );
  if (!outer?.body) return "createSector3LandingPage not found";
  const ret = outer.body.statements.find((s): s is ts.ReturnStatement => ts.isReturnStatement(s));
  const fn = ret?.expression;
  if (!fn || !(ts.isFunctionExpression(fn) || ts.isArrowFunction(fn))) return "factory does not return a function";
  if (!isAsync(fn)) return "returned function is not async";
  if (!ts.isBlock(fn.body)) return "returned function has an expression body";
  return firstStatementProblem(
    fn.body,
    (arg) => ts.isPropertyAccessExpression(arg) && arg.expression.getText(sf) === "config" && arg.name.text === "basePath",
    sf
  );
}

/** Page: the default-exported async function. */
function checkPage(src: string, expectedPath: string): string | null {
  const sf = parse(src);
  const fn = sf.statements.find(
    (s): s is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(s) &&
      !!ts.getModifiers(s)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
  );
  if (!fn) return "no `export default function` found";
  if (!isAsync(fn)) return "default function is not async";
  return firstStatementProblem(fn.body, (arg) => ts.isStringLiteralLike(arg) && arg.text === expectedPath, sf);
}

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const FACTORY_FILE = "src/lib/sector3-tools/create-landing-page.tsx";

describe("T3 factory wiring: createSector3LandingPage", () => {
  it("first statement of the returned async function is `await redirectLoggedInSector3ToDashboard(config.basePath)`", () => {
    expect(checkFactory(read(FACTORY_FILE))).toBeNull();
  });

  // The checker itself must be able to fail: in-memory mutations of the real source.
  const src = read(FACTORY_FILE);
  const line = "await redirectLoggedInSector3ToDashboard(config.basePath);";
  const mutations: Record<string, (s: string) => string> = {
    "remove await": (s) => s.replace(line, "redirectLoggedInSector3ToDashboard(config.basePath);"),
    "statement inserted before the call": (s) => s.replace(line, `const before = 1;\n    ${line}`),
    "call deleted": (s) => s.replace(line, ""),
    "call moved into nested function": (s) => s.replace(line, `const later = async () => { ${line} };`),
    "call made conditional": (s) => s.replace(line, `if (config.basePath) { ${line} }`),
    "call hoisted to outer function": (s) =>
      s.replace(line, "").replace("  return async function Sector3LandingPage() {", `  ${line}\n  return async function Sector3LandingPage() {`),
    "wrong argument": (s) => s.replace(line, "await redirectLoggedInSector3ToDashboard('/x');"),
  };
  it.each(Object.keys(mutations))("checker rejects mutation: %s", (name) => {
    const mutated = mutations[name](src);
    expect(mutated).not.toBe(src);
    expect(checkFactory(mutated)).not.toBeNull();
  });
});

describe("T3b restored public pages: redirect is the first statement", () => {
  it.each([
    ["grantbot", "/grantbot"],
    ["replyflow", "/replyflow"],
  ])("src/app/%s/page.tsx awaits redirectLoggedInSector3ToDashboard(%s) first", (it2, p) => {
    expect(checkPage(read(`src/app/${it2}/page.tsx`), p)).toBeNull();
  });

  const good = `export default async function P() {\n  await ${CALLEE}("/grantbot");\n  const a = 1;\n}`;
  it("checker accepts the canonical shape", () => {
    expect(checkPage(good, "/grantbot")).toBeNull();
  });
  it.each([
    ["remove await", good.replace("await ", "")],
    ["statement before", good.replace("  await", "  const z = 0;\n  await")],
    ["call deleted", good.replace(`await ${CALLEE}("/grantbot");`, "")],
    ["nested", good.replace(`await ${CALLEE}("/grantbot");`, `const f = async () => { await ${CALLEE}("/grantbot"); };`)],
    ["conditional", good.replace(`await ${CALLEE}("/grantbot");`, `if (Math.random()) { await ${CALLEE}("/grantbot"); }`)],
    ["not async", good.replace("async ", "")],
    ["wrong path", good.replace("/grantbot", "/other")],
  ])("checker rejects mutation: %s", (_n, mutated) => {
    expect(checkPage(mutated, "/grantbot")).not.toBeNull();
  });
});
