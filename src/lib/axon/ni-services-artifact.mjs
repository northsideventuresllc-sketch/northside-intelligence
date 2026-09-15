/**
 * NI-OUTREACH-ARTIFACT-GAP-0914 — v1 generator.
 *
 * Decision #1888 (2026-09-11) locked the spec: for an NI Services lead with no
 * existing website, OUTREACH delivers one individualized interactive HTML site
 * preview per business, researched against real design inspiration for that
 * business's category. Building the full research-driven design pipeline is a
 * separate, bigger project (per the 2026-09-14 scoping note) — this module is
 * the honest v1 slice: a template-per-category generator, seeded per business
 * so two leads in the same category don't render identically, built entirely
 * from fields already present on the lead row. No LLM call, no external image
 * fetch, no network access at all — the whole file is generated in-process and
 * is fully self-contained (inline CSS, inline SVG placeholder art), so it has
 * nothing to fail at render time and nothing to leak to a paid API tier.
 *
 * Explicit v1 gaps (see PR description, do not silently claim otherwise):
 *  - No per-business web research into "what makes the best sites in this
 *    category work" — category selection is keyword matching against fields
 *    already on the row (niche / icp_scan.industry / recommended_service /
 *    why_match_fit), not a researched, bespoke layout.
 *  - "Real or realistic placeholder photos" are rendered as clean inline SVG
 *    iconography/graphics, not photographs — generating realistic photos of a
 *    real, non-consenting business (or a fabricated person standing in for
 *    one) raises its own honesty problem and needs image-gen infra this scope
 *    doesn't include. This is a deliberate, documented choice, not an oversight.
 */

// ---------------------------------------------------------------------------
// Small deterministic helpers (no Math.random — same lead always renders the
// same artifact, so re-generating on a retry is a no-op, not new noise).
// ---------------------------------------------------------------------------

function seedFromString(input) {
  const str = String(input || '');
  let hash = 2166136261; // FNV-1a
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function hexToHsl(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Shift an accent color's hue by a small, seeded amount so two leads in the
 * same category still look like two different businesses, not one template. */
function seededAccentShift(hex, seed) {
  const [h, s, l] = hexToHsl(hex);
  const shift = (seed % 25) - 12; // -12..+12 degrees
  return hslToHex((h + shift + 360) % 360, s, l);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function titleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function deriveBusinessName(lead) {
  const meta = lead?.meta || {};
  if (meta.company && String(meta.company).trim()) return String(meta.company).trim();
  const handle = String(lead?.handle || '').trim();
  const cleaned = handle
    .replace(/^@/, '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\.(com|net|org|co|io)\/?$/i, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'This Business';
  return titleCase(cleaned);
}

// ---------------------------------------------------------------------------
// Category detection + theming
// ---------------------------------------------------------------------------

const CATEGORY_RULES = [
  {
    key: 'restaurant',
    match: /restaurant|cafe|café|diner|bakery|catering|food ?truck|pizzer|eatery|bar\b|brewery/i,
    label: 'Restaurant & Food Service',
    offerings: ['Dine-In & Takeout', 'Private Events & Catering', 'Seasonal Menu Updates'],
    icon: 'fork',
    theme: { mode: 'dark', bg: '#1b1410', surface: '#241b16', accent: '#f0b23e', text: '#f7ede1', muted: '#c8ad93' },
  },
  {
    key: 'salon',
    match: /salon|barber|spa\b|beauty|nail|hair ?stud|esthetic/i,
    label: 'Salon & Beauty',
    offerings: ['Appointment Booking', 'Signature Services Menu', 'Membership & Packages'],
    icon: 'sparkle',
    theme: { mode: 'light', bg: '#fbf6f5', surface: '#ffffff', accent: '#b45a72', text: '#2c2020', muted: '#7a6a6a' },
  },
  {
    key: 'health',
    match: /clinic|dental|dentist|health|wellness|therapy|chiro|medical|physio|counsel/i,
    label: 'Health & Wellness',
    offerings: ['New Patient Onboarding', 'Insurance & Billing Info', 'Telehealth Availability'],
    icon: 'pulse',
    theme: { mode: 'light', bg: '#f4f9f9', surface: '#ffffff', accent: '#0f766e', text: '#152827', muted: '#5c7472' },
  },
  {
    key: 'professional',
    match: /law|legal|attorney|accounting|financial|consult|insurance|realt|cpa|advisor/i,
    label: 'Professional Services',
    offerings: ['Free Initial Consultation', 'Case & Engagement Tracking', 'Secure Client Portal'],
    icon: 'briefcase',
    theme: { mode: 'dark', bg: '#0b1220', surface: '#121b2e', accent: '#c9a227', text: '#f2ecdd', muted: '#a7adbd' },
  },
  {
    key: 'homeServices',
    match: /plumb|electric|hvac|contractor|landscap|roofing|clean(ing)?|repair|construction|handyman|pest/i,
    label: 'Home Services',
    offerings: ['Free On-Site Estimate', 'Emergency Availability', 'Licensed & Insured Crews'],
    icon: 'wrench',
    theme: { mode: 'dark', bg: '#12181f', surface: '#1a222b', accent: '#e2662d', text: '#f4efe9', muted: '#b3b9c2' },
  },
  {
    key: 'fitness',
    match: /gym|fitness|yoga|pilates|coach(ing)?|training|crossfit|athletic/i,
    label: 'Fitness & Coaching',
    offerings: ['Class & Session Booking', 'Membership Tiers', 'Progress Tracking'],
    icon: 'pulse-bolt',
    theme: { mode: 'dark', bg: '#0a0a0a', surface: '#161616', accent: '#d7ff3f', text: '#f5f5f0', muted: '#9a9a90' },
  },
  {
    key: 'retail',
    match: /boutique|retail|storefront|apparel|jewelry|florist|goods/i,
    label: 'Retail & Boutique',
    offerings: ['Shop the Collection', 'In-Store Pickup', 'Gift Cards'],
    icon: 'bag',
    theme: { mode: 'light', bg: '#fbf6ef', surface: '#ffffff', accent: '#b1512f', text: '#2b211a', muted: '#7d7166' },
  },
];

const DEFAULT_CATEGORY = {
  key: 'general',
  label: 'Local Business',
  offerings: ['Get in Touch', 'See What We Offer', 'Work With a Local Team'],
  icon: 'spark',
  theme: { mode: 'dark', bg: '#0e1a1f', surface: '#152229', accent: '#ff8552', text: '#f2ede6', muted: '#a9b6b9' },
};

export function detectCategory(lead) {
  const meta = lead?.meta || {};
  const blob = [lead?.niche, meta.icp_scan?.industry, meta.recommended_service, lead?.why_match_fit]
    .filter(Boolean)
    .join(' ');
  const found = CATEGORY_RULES.find((rule) => rule.match.test(blob));
  return found || DEFAULT_CATEGORY;
}

// ---------------------------------------------------------------------------
// Inline SVG iconography (category-relevant line art, no external requests)
// ---------------------------------------------------------------------------

const ICONS = {
  fork: '<path d="M8 2v9M12 2v9M16 2v9M8 11c0 2 1.5 3 4 3s4-1 4-3M12 14v20" />',
  sparkle: '<path d="M20 4l2.2 6.8L29 13l-6.8 2.2L20 22l-2.2-6.8L11 13l6.8-2.2L20 4z" /><path d="M9 24l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />',
  pulse: '<path d="M4 20h6l3-9 4 18 3-13 2 4h14" />',
  briefcase: '<rect x="6" y="12" width="28" height="18" rx="2" /><path d="M14 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />',
  wrench: '<path d="M27 6a8 8 0 0 0-10.6 9.3L6 25.7l4.3 4.3 10.4-10.4A8 8 0 0 0 30 9L24 15l-3-3 6-6z" />',
  'pulse-bolt': '<path d="M22 2 8 20h9l-3 18 16-22h-9l1-14z" />',
  bag: '<path d="M9 12h22l-2 20H11L9 12z" /><path d="M14 12V9a6 6 0 0 1 12 0v3" />',
  spark: '<path d="M20 4v10M20 26v10M4 20h10M26 20h10M9 9l7 7M31 31l-7-7M9 31l7-7M31 9l-7 7" />',
};

function heroIcon(iconKey, accent, seed) {
  const path = ICONS[iconKey] || ICONS.spark;
  const rotate = seed % 8; // 0-7deg, subtle per-business tilt
  return `<svg viewBox="0 0 40 40" width="88" height="88" fill="none" stroke="${accent}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(${rotate}deg)" aria-hidden="true">${path}</svg>`;
}

/** Deterministic, restrained geometric backdrop — texture, not noise. */
function heroBackdrop(accent, seed, mode) {
  const dotOpacity = mode === 'light' ? 0.14 : 0.16;
  const offsetX = seed % 40;
  const offsetY = (seed >> 3) % 40;
  return `
    <svg class="hero-backdrop" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse" x="${offsetX}" y="${offsetY}">
          <circle cx="2" cy="2" r="1.6" fill="${accent}" opacity="${dotOpacity}" />
        </pattern>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.16" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#grid)" />
      <rect width="400" height="240" fill="url(#fade)" />
    </svg>`;
}

// ---------------------------------------------------------------------------
// Copy synthesis (from real row fields only — nothing fabricated about the
// specific business; category offerings below describe what businesses of
// this type typically provide, not a verified claim about this one)
// ---------------------------------------------------------------------------

function synthesizeAbout(lead, businessName, category) {
  const trimmedFit = (lead?.why_match_fit || '').trim();
  if (trimmedFit) {
    // why_match_fit is AXON's internal fit rationale for OUR outreach — reword
    // it as neutral, business-facing copy rather than exposing it verbatim.
    return `${businessName} is a ${category.label.toLowerCase()} business${
      lead?.target_group ? ` serving ${lead.target_group === 'enterprise' ? 'larger clients and organizations' : 'the local community'}` : ''
    }. This preview is a starting point for a site built around what makes ${businessName} worth choosing — clear information, an easy way to reach you, and a design that actually looks like it belongs to your business.`;
  }
  return `${businessName} deserves a homepage that says exactly what you do and makes it effortless for people to reach you. This is a working preview of what that could look like.`;
}

function taglineFor(category, businessName) {
  const templates = {
    restaurant: `Real food, made right, at ${businessName}.`,
    salon: `Look good. Feel better. Only at ${businessName}.`,
    health: `Care that puts you first — ${businessName}.`,
    professional: `Straight answers, real results — ${businessName}.`,
    homeServices: `Done right, the first time — ${businessName}.`,
    fitness: `Train with purpose at ${businessName}.`,
    retail: `Find what you love at ${businessName}.`,
  };
  return templates[category.key] || `Welcome to ${businessName}.`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a single self-contained HTML page (inline CSS + inline SVG, zero
 * external requests) previewing a website for this lead's business.
 * @param {import('./types').Lead & { meta?: import('./types').LeadMeta }} lead
 * @returns {string} full HTML document
 */
export function buildNiServicesArtifactHtml(lead) {
  const businessName = deriveBusinessName(lead);
  const category = detectCategory(lead);
  const seed = seedFromString(lead?.id || businessName);
  const accent = seededAccentShift(category.theme.accent, seed);
  const { bg, surface, text, muted, mode } = category.theme;
  const tagline = taglineFor(category, businessName);
  const about = synthesizeAbout(lead, businessName, category);
  const contactEmail = lead?.meta?.contact_email || null;
  const generatedAt = new Date().toISOString().slice(0, 10);
  const escapedName = escapeHtml(businessName);

  const offeringCards = category.offerings
    .map(
      (offering, i) => `
        <div class="card">
          <span class="card-index">0${i + 1}</span>
          <h3>${escapeHtml(offering)}</h3>
        </div>`
    )
    .join('\n');

  const contactLine = contactEmail
    ? `<a href="mailto:${escapeHtml(contactEmail)}" class="contact-link">${escapeHtml(contactEmail)}</a>`
    : `<span class="contact-link contact-link--muted">Add your contact details here</span>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapedName}</title>
<meta name="robots" content="noindex, nofollow" />
<style>
  :root {
    --bg: ${bg};
    --surface: ${surface};
    --accent: ${accent};
    --text: ${text};
    --muted: ${muted};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.5;
  }
  .wrap { max-width: 980px; margin: 0 auto; padding: 0 24px; }
  header.nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 0; border-bottom: 1px solid color-mix(in srgb, var(--muted) 30%, transparent);
  }
  .brand { font-weight: 700; font-size: 1.05rem; letter-spacing: 0.01em; }
  nav.links { display: flex; gap: 22px; font-size: 0.85rem; color: var(--muted); }
  nav.links a { color: inherit; text-decoration: none; }
  nav.links a:hover { color: var(--accent); }
  .hero {
    position: relative; overflow: hidden;
    padding: 72px 0 56px;
    border-bottom: 1px solid color-mix(in srgb, var(--muted) 25%, transparent);
  }
  .hero-backdrop { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; opacity: ${mode === 'light' ? '0.6' : '1'}; }
  .hero-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
  .hero-icon {
    flex: 0 0 auto; width: 108px; height: 108px; border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--accent) 14%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  }
  .hero-copy { flex: 1 1 320px; min-width: 0; }
  .eyebrow {
    display: inline-block; font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--accent); font-weight: 600; margin-bottom: 10px;
  }
  h1 { font-size: clamp(1.9rem, 4.4vw, 2.9rem); margin: 0 0 12px; letter-spacing: -0.01em; }
  .tagline { font-size: 1.1rem; color: var(--muted); margin: 0 0 22px; max-width: 46ch; }
  .cta {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--accent); color: ${mode === 'light' ? '#fff' : bg};
    padding: 12px 22px; border-radius: 999px; font-weight: 600; font-size: 0.92rem;
    text-decoration: none;
  }
  section { padding: 52px 0; border-bottom: 1px solid color-mix(in srgb, var(--muted) 20%, transparent); }
  section:last-of-type { border-bottom: none; }
  .section-label { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin-bottom: 14px; }
  .about-grid { display: flex; gap: 40px; flex-wrap: wrap; align-items: flex-start; }
  .about-text { flex: 1 1 340px; font-size: 1.02rem; color: var(--muted); max-width: 60ch; }
  .about-figure {
    flex: 0 0 220px; height: 160px; border-radius: 16px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, var(--surface)), var(--surface));
    border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    display: flex; align-items: center; justify-content: center;
  }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
  .card {
    background: var(--surface); border: 1px solid color-mix(in srgb, var(--muted) 25%, transparent);
    border-radius: 14px; padding: 20px;
  }
  .card-index { font-size: 0.75rem; color: var(--accent); font-weight: 700; letter-spacing: 0.08em; }
  .card h3 { margin: 8px 0 0; font-size: 1.02rem; }
  .contact-block {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px;
  }
  .contact-link { color: var(--accent); text-decoration: none; font-weight: 600; font-size: 1.05rem; }
  .contact-link--muted { color: var(--muted); font-weight: 400; font-style: italic; }
  footer { padding: 26px 0 40px; font-size: 0.78rem; color: var(--muted); }
  footer strong { color: var(--text); }
  @media (max-width: 560px) {
    .hero-inner { gap: 20px; }
    .hero-icon { width: 84px; height: 84px; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <header class="nav">
      <div class="brand">${escapedName}</div>
      <nav class="links">
        <a href="#about">About</a>
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  </div>

  <section class="hero">
    ${heroBackdrop(accent, seed, mode)}
    <div class="wrap hero-inner">
      <div class="hero-icon">${heroIcon(category.icon, accent, seed)}</div>
      <div class="hero-copy">
        <span class="eyebrow">${escapeHtml(category.label)}</span>
        <h1>${escapedName}</h1>
        <p class="tagline">${escapeHtml(tagline)}</p>
        <a class="cta" href="#contact">Get In Touch →</a>
      </div>
    </div>
  </section>

  <section id="about">
    <div class="wrap">
      <div class="section-label">About</div>
      <div class="about-grid">
        <p class="about-text">${escapeHtml(about)}</p>
        <div class="about-figure">${heroIcon(category.icon, accent, seed + 1)}</div>
      </div>
    </div>
  </section>

  <section id="services">
    <div class="wrap">
      <div class="section-label">What We Offer</div>
      <div class="cards">
        ${offeringCards}
      </div>
    </div>
  </section>

  <section id="contact">
    <div class="wrap">
      <div class="section-label">Get In Touch</div>
      <div class="contact-block">
        <p style="margin:0;color:var(--muted);max-width:42ch;">Ready to see this become your real site? Reach out and let's talk about what ${escapedName} actually needs.</p>
        ${contactLine}
      </div>
    </div>
  </section>

  <div class="wrap">
    <footer>
      Design preview crafted by <strong>Northside Intelligence</strong> for ${escapedName} — a working starting point, not a finished site. Generated ${generatedAt}.
    </footer>
  </div>
</body>
</html>`;
}

export const NI_SERVICES_ARTIFACT_CATEGORIES = [...CATEGORY_RULES, DEFAULT_CATEGORY].map((c) => c.key);
