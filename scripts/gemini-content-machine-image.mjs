#!/usr/bin/env node
/**
 * CONTENT MACHINE IMAGE AUTOMATION — headless, CDP-driven (BUILD dispatch
 * NI-IMAGE-GEN-DIRECT-GEMINI-API-0906, 2026-09-07)
 * -----------------------------------------------------------------------------
 * Replaces src/lib/content-machine/image-gen.ts's old direct call to
 * generativelanguage.googleapis.com with the same Mac-mini Chrome/Gemini-Pro
 * automation pattern matchfit's scripts/gemini-media-automation.mjs already
 * proved live (Decision #1722 item 4: social images are generated ONLY in
 * JB's Gemini app in Chrome on the mini, never via an image API, free or paid).
 *
 * The browser-driving core below (connectBrowser..cropWhiteFrame) is copied
 * near-verbatim from matchfit's script on purpose — that half is brand-agnostic
 * Gemini-web-UI automation, already proven against real traffic, and re-deriving
 * it here would just reintroduce bugs that script already fixed. Only the
 * Supabase read/write-back is different: this drives content_machine_posts
 * (northside-intelligence) instead of match_fit_content_calendar_posts, and
 * every post here is a single image (no carousel slides), so there is no
 * slide-splitting step.
 *
 * Runs ON THE MAC MINI, queued via nvg_mini_jobs (kind="shell") by
 * queueContentMachineImageJob() in src/lib/content-machine/image-gen.ts, which
 * curls this file fresh from GitHub into matchfit's already-provisioned
 * $HOME/nvg-gemini-automation working directory (same Chrome profile, same
 * already-installed playwright-core/sharp) rather than standing up a second
 * automation directory. Can also be run by hand from that directory:
 *   node gemini-content-machine-image.mjs --ids=<uuid>,<uuid>
 *
 * Env required (read from /usr/local/etc/nvg-mini.env on the mini, or process env):
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY      -- NI-Brain project (kxijunwgbrlfzvgkhklo)
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS   -- comma-separated chat ids
 *   GEMINI_CDP_PORT                          -- default 9333
 */

import { chromium } from "playwright-core";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function loadMiniEnv() {
  const cfgPath = "/usr/local/etc/nvg-mini.env";
  const out = {};
  try {
    const raw = fs.readFileSync(cfgPath, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const idx = t.indexOf("=");
      out[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
    }
  } catch {
    // fine — fall back to process.env
  }
  return out;
}

const MINI_ENV = loadMiniEnv();
function envOf(key) {
  return process.env[key] ?? MINI_ENV[key];
}

const SUPABASE_URL = (envOf("SUPABASE_URL") || "").replace(/\/$/, "");
const SUPABASE_SERVICE_KEY = envOf("SUPABASE_SERVICE_KEY");
const TELEGRAM_BOT_TOKEN = envOf("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_IDS = (envOf("TELEGRAM_CHAT_IDS") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const CDP_PORT = Number(envOf("GEMINI_CDP_PORT") || 9333);
const BUCKET = "content-images";
const TABLE = "content_machine_posts";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "FATAL: SUPABASE_URL / SUPABASE_SERVICE_KEY not set (checked env + /usr/local/etc/nvg-mini.env)."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Supabase REST helpers
// ---------------------------------------------------------------------------

async function sbFetch(pathname, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${SUPABASE_URL}${pathname}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res;
}

async function fetchRows(ids) {
  const params = new URLSearchParams();
  params.set("select", "id,brand_slug,post_type,visual_prompt,caption,image_url,meta");
  params.set("id", `in.(${ids.join(",")})`);
  const res = await sbFetch(`/rest/v1/${TABLE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`fetch rows failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function writeImageResult(row, imageUrl) {
  const meta = { ...(row.meta || {}), image_status: "ready", image_generated_at: new Date().toISOString() };
  const res = await sbFetch(`/rest/v1/${TABLE}?id=eq.${row.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { image_url: imageUrl, meta, updated_at: new Date().toISOString() },
  });
  if (!res.ok) {
    throw new Error(`write-back failed for ${row.id}: ${res.status} ${await res.text()}`);
  }
}

async function writeImageFailure(row, errorMessage) {
  try {
    const meta = { ...(row.meta || {}), image_status: "failed", image_error: errorMessage };
    await sbFetch(`/rest/v1/${TABLE}?id=eq.${row.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: { meta, updated_at: new Date().toISOString() },
    });
  } catch (e) {
    console.warn(`failure write skipped for ${row.id}: ${e.message || e}`);
  }
}

async function uploadRaw(objectPath, buffer, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`storage upload failed: ${res.status} ${await res.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

async function notifyTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_IDS.length) {
    console.error("Telegram not configured — skipping ping. Message was:\n" + text);
    return;
  }
  for (const chatId of TELEGRAM_CHAT_IDS) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      });
      if (!res.ok) {
        console.error(`telegram send to ${chatId} failed: ${res.status} ${await res.text()}`);
      }
    } catch (e) {
      console.error(`telegram send to ${chatId} threw: ${e}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Browser automation (near-verbatim from matchfit/scripts/gemini-media-automation.mjs
// — brand-agnostic Gemini web-UI driving, already proven against real traffic)
// ---------------------------------------------------------------------------

async function connectBrowser() {
  const endpoint = `http://127.0.0.1:${CDP_PORT}`;
  try {
    return await chromium.connectOverCDP(endpoint);
  } catch (e) {
    throw new Error(
      `Could not connect over CDP at ${endpoint}. Is the automation Chrome ` +
        `profile running with --remote-debugging-port=${CDP_PORT}? ` +
        `Run mini-chrome-automation-launcher.sh first. Underlying error: ${e}`
    );
  }
}

async function getGeminiPage(browser, workDir) {
  const contexts = browser.contexts();
  const context = contexts[0] || (await browser.newContext());
  let page = context.pages().find((p) => p.url().includes("gemini.google.com"));
  if (!page) {
    page = await context.newPage();
    await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded" });
  }
  await page.bringToFront();
  if (workDir) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: workDir });
  }
  return page;
}

async function assertLoggedIn(page) {
  await page.waitForTimeout(2000);
  const signInVisible = await page
    .getByRole("link", { name: /sign in/i })
    .first()
    .isVisible()
    .catch(() => false);
  if (signInVisible) {
    throw new Error(
      "NOT_LOGGED_IN: the automation Chrome profile is not authenticated into JB's Gemini account."
    );
  }
}

/** JB direct order: images are Gemini Pro only, never Flash. See matchfit's
 * gemini-media-automation.mjs ensureProModel for the live-confirmed DOM probe this mirrors. */
async function ensureProModel(page) {
  const modeBtn = page.locator('button[aria-label*="mode picker" i]').first();
  const currentAria = await modeBtn.getAttribute("aria-label").catch(() => "");
  if (/currently[^,]*\bpro\b/i.test(currentAria || "")) return;

  await modeBtn.click();
  await page.waitForTimeout(800);

  const proItem = page.getByRole("menuitem", { name: /^\s*\d+(\.\d+)?\s+pro\b/i }).first();
  const proVisible = await proItem.isVisible().catch(() => false);
  if (!proVisible) {
    await page.keyboard.press("Escape").catch(() => null);
    throw new Error("PRO_MODE_OPTION_NOT_FOUND: mode picker opened but no '<N> Pro' menu item was visible.");
  }
  await proItem.click();
  await page.waitForTimeout(800);

  const afterAria = await modeBtn.getAttribute("aria-label").catch(() => "");
  if (!/currently[^,]*\bpro\b/i.test(afterAria || "")) {
    throw new Error(`PRO_MODE_NOT_CONFIRMED: mode picker still reads "${afterAria}".`);
  }
}

async function startNewChat(page) {
  const newChatBtn = page.getByText("New chat", { exact: true }).first();
  if (await newChatBtn.isVisible().catch(() => false)) {
    await newChatBtn.click().catch(() => null);
    await page.waitForTimeout(1500);
  }
}

async function generateAndDownload(page, visualPrompt, workDir) {
  const imgSel = 'generated-image, img[src*="generativelanguage"], [data-test-id="generated-image"]';
  const beforeCount = await page.locator(imgSel).count().catch(() => 0);

  const composer = page.locator('div[contenteditable="true"]').first();
  await composer.click();
  await composer.fill("");
  await page.keyboard.insertText(visualPrompt);
  await page.keyboard.press("Enter");

  const deadline = Date.now() + 120_000;
  let afterCount = beforeCount;
  while (Date.now() < deadline) {
    afterCount = await page.locator(imgSel).count().catch(() => beforeCount);
    if (afterCount > beforeCount) break;
    await page.waitForTimeout(1000);
  }
  if (afterCount <= beforeCount) {
    await page.screenshot({ path: "/tmp/gemini-cm-fail-debug.png", fullPage: false }).catch(() => null);
    throw new Error("NEW_IMAGE_NEVER_APPEARED: count stayed at " + beforeCount + " after 120s.");
  }
  const imageLocator = page.locator(imgSel).last();
  await imageLocator.waitFor({ state: "visible", timeout: 15_000 });
  await imageLocator.evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" })).catch(() => null);
  await imageLocator.hover();
  await page.waitForTimeout(1000);

  await page
    .context()
    .grantPermissions(["clipboard-read", "clipboard-write"], { origin: "https://gemini.google.com" })
    .catch((e) => console.error("grantPermissions failed: " + e));

  const copyBtn = page.locator('button[aria-label="Copy image"]').last();
  let copyClicked = false;
  for (let attempt = 0; attempt < 6 && !copyClicked; attempt++) {
    await imageLocator.hover().catch(() => null);
    await page.waitForTimeout(800);
    if (await copyBtn.isVisible().catch(() => false)) {
      await copyBtn.click();
      copyClicked = true;
    }
  }
  if (!copyClicked) {
    await page.screenshot({ path: "/tmp/gemini-cm-fail-debug.png", fullPage: false }).catch(() => null);
    throw new Error("COPY_BUTTON_NOT_FOUND: could not find/click Copy image button after 6 attempts.");
  }
  await page.bringToFront();
  await page.locator("body").click({ position: { x: 5, y: 5 }, force: true }).catch(() => null);
  await page.waitForTimeout(1500);

  async function readClipboardImage() {
    return page
      .evaluate(async () => {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              const buf = await blob.arrayBuffer();
              let binary = "";
              const bytes = new Uint8Array(buf);
              for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
              return btoa(binary);
            }
          }
        }
        return null;
      })
      .catch((e) => {
        console.error("clipboard read failed: " + e);
        return null;
      });
  }

  let base64 = null;
  for (let attempt = 0; attempt < 4 && !base64; attempt++) {
    if (attempt > 0) await page.waitForTimeout(1000);
    base64 = await readClipboardImage();
  }
  if (!base64) {
    await page.screenshot({ path: "/tmp/gemini-cm-fail-debug.png", fullPage: false }).catch(() => null);
    throw new Error("CLIPBOARD_READ_FAILED: Copy image was clicked but clipboard.read() returned no image data.");
  }

  const savePath = path.join(workDir, `raw-${Date.now()}.png`);
  fs.writeFileSync(savePath, Buffer.from(base64, "base64"));
  return savePath;
}

async function cropWhiteFrame(rawPath) {
  const input = fs.readFileSync(rawPath);
  const cropped = await sharp(input).trim({ background: "#ffffff", threshold: 24 }).toBuffer();
  return cropped;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, v] = arg.slice(2).split("=");
    out[k] = v ?? true;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.check) {
    const browser = await connectBrowser();
    const page = await getGeminiPage(browser);
    try {
      await assertLoggedIn(page);
      await ensureProModel(page);
      console.log("CHECK_OK: CDP reachable, Gemini session is logged in, mode is Pro.");
    } finally {
      await browser.close().catch(() => null);
    }
    return;
  }

  const ids = args.ids ? args.ids.split(",").filter(Boolean) : null;
  if (!ids || !ids.length) {
    console.error("Usage: --ids=uuid,uuid | --check");
    process.exit(2);
  }

  const rows = await fetchRows(ids);
  const pending = rows.filter((r) => !r.image_url);
  if (!pending.length) {
    console.log(`No pending rows (fetched ${rows.length}, all already have an image).`);
    return;
  }

  console.log(`Processing ${pending.length} row(s): ${pending.map((r) => r.id).join(", ")}`);

  const browser = await connectBrowser();
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "nvg-gemini-cm-"));
  let page;
  try {
    page = await getGeminiPage(browser, workDir);
    await assertLoggedIn(page);
    await ensureProModel(page);
  } catch (e) {
    for (const row of pending) await writeImageFailure(row, String(e.message || e));
    await browser.close().catch(() => null);
    throw e;
  }

  const results = [];
  const errors = [];

  for (const row of pending) {
    try {
      await startNewChat(page);
      const sourcePrompt = row.visual_prompt || row.caption;
      if (!sourcePrompt) throw new Error("row has no visual_prompt or caption — nothing to generate from");

      const rawPath = await generateAndDownload(page, sourcePrompt, workDir);
      const cropped = await cropWhiteFrame(rawPath);
      const objectPath = `content-machine/${row.brand_slug || "ni"}/${row.id}-${Date.now()}.png`;
      const publicUrl = await uploadRaw(objectPath, cropped, "image/png");
      fs.unlinkSync(rawPath);

      await writeImageResult(row, publicUrl);
      results.push({ id: row.id, post_type: row.post_type, publicUrl });
      console.log(`OK ${row.id} (${row.post_type}) -> ${publicUrl}`);
    } catch (e) {
      const message = String(e.message || e);
      errors.push({ id: row.id, post_type: row.post_type, error: message });
      console.error(`FAIL ${row.id}: ${message}`);
      await writeImageFailure(row, message);
    }
  }

  await browser.close().catch(() => null);

  const summaryLines = [
    `Content Machine image batch finished.`,
    `Ready: ${results.length}`,
    ...results.map((r) => `  - ${r.post_type} (${r.id.slice(0, 8)})`),
  ];
  if (errors.length) {
    summaryLines.push(`Failed: ${errors.length}`);
    summaryLines.push(...errors.map((e) => `  - ${e.post_type} (${e.id.slice(0, 8)}): ${e.error}`));
  }
  await notifyTelegram(summaryLines.join("\n"));

  console.log(JSON.stringify({ results, errors }, null, 2));
  if (errors.length && !results.length) process.exit(1);
}

main().catch((e) => {
  console.error("FATAL:", e.stack || e);
  notifyTelegram(`Content Machine Gemini image automation crashed: ${e.message || e}`).finally(() => {
    process.exit(1);
  });
});
