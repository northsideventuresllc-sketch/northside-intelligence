export type ContentPostType = "Carousel" | "Static" | "Video" | "Text";
export type ContentTargetGroup = "Join the Team" | "List With Us" | "Clients";

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
};

export type GenerateSlotInput = {
  brandSlug: string;
  dayIndex: number;
  postType: ContentPostType;
  targetGroup: ContentTargetGroup;
  researchSnippet?: string;
};
