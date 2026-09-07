export type ContentPostType = "Carousel" | "Static" | "Video" | "Text";
// BUILD fix 2026-09-07 (content-machine wrong-brand bug, root cause round 4): this used to
// be ONLY Match Fit's own audience-segment vocabulary ("Join the Team" = Fitness Pros
// joining Match Fit, "List With Us" = independent Fitness Pros listing on Match Fit,
// "Clients" = Match Fit clients), and every brand's weekly theme skeleton was forced to use
// these three groups because there were no others to pick from. Added three brand-neutral
// groups for DEFAULT_WEEKDAY_THEMES (weekday-themes.ts) so a non-match-fit brand's content
// brief doesn't have to borrow Match Fit's own audience names. The original three stay
// unchanged and still apply to match-fit's own skeleton.
export type ContentTargetGroup =
  | "Join the Team"
  | "List With Us"
  | "Clients"
  | "New Users"
  | "Existing Users"
  | "General Audience";

export type PostStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected";

export type SignalType =
  | "EDIT"
  | "APPROVE"
  | "REJECT"
  | "REGENERATED"
  | "POSTED"
  | "METRICS";

export type BrandProfile = {
  id: string;
  slug: string;
  name: string;
  venture: string;
  voice_rules: string[];
  banned_phrases: string[];
  cta_paths: Record<string, string>;
  brand_colors: { dark: string; accent: string };
  skeleton: WeekdayTheme[];
};

export type WeekdayTheme = {
  dayIndex: number;
  name: string;
  headline: string;
  themeBrief: string;
  audienceByPostType: Record<ContentPostType, ContentTargetGroup>;
  formatAngles: Record<ContentPostType, string>;
  clientAngleRule?: string;
};

export type ContentPost = {
  id: string;
  brand_slug: string;
  status: PostStatus;
  day_index: number;
  post_type: ContentPostType;
  target_group: ContentTargetGroup;
  theme_name: string | null;
  caption: string;
  visual_prompt: string | null;
  hashtags: string[];
  image_url: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  platforms: string[];
  batch_id: string | null;
  source_post_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ToneRule = {
  id: string;
  brand_slug: string;
  rule_type: string;
  rule_text: string;
  weight: number;
  active: boolean;
};

export type FewShot = {
  id: string;
  brand_slug: string;
  post_type: ContentPostType;
  target_group: ContentTargetGroup;
  platform: string | null;
  caption: string;
  visual_prompt: string | null;
  hashtags: string[];
};

export type GeneratedDraft = {
  caption: string;
  visualPrompt: string | null;
  hashtags: string[];
};

export type QualityGateResult = {
  pass: boolean;
  failures: string[];
  /** True when `failures` contains a banned-phrase hit — a correctness bug (wrong-brand
   * or off-limits content), never eligible for the "accept best draft flagged" fallback
   * after MAX_REGEN_ATTEMPTS. See BANNED_PHRASE_FAILURE in quality-gate.ts. */
  hardFail: boolean;
};

export type GenerateSlotInput = {
  brandSlug: string;
  dayIndex: number;
  postType: ContentPostType;
  targetGroup: ContentTargetGroup;
  researchSnippet?: string;
};
