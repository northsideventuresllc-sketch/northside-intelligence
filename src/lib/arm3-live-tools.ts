import { createServiceClient } from "@/lib/supabase/server";
import {
  getToolBrand,
  STATIC_COMING_SOON_TOOLS,
  type IntelligenceTool,
  type ToolCategory,
} from "@/lib/constants";
import { GITHUB_ORG, PORTAL_URL, SECTOR3_REGISTRY } from "@/lib/sector3-registry";

interface Arm3ToolRow {
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  status: string;
  target_user: string | null;
}

const VALID_CATEGORIES = new Set<string>([
  "Automation",
  "Intelligence",
  "Orchestration",
  "Productivity",
]);

function normalizeCategory(raw: string | null): ToolCategory {
  if (raw && VALID_CATEGORIES.has(raw)) {
    return raw as ToolCategory;
  }
  return "Productivity";
}

function keywordsForTool(row: Arm3ToolRow): string[] {
  const fromTarget = row.target_user
    ?.split(/[,;/]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (fromTarget?.length) {
    return fromTarget.slice(0, 5);
  }

  return row.description
    ? row.description
        .split(/\s+/)
        .slice(0, 5)
        .map((word) => word.replace(/[^\w-]/g, ""))
        .filter(Boolean)
    : [row.slug];
}

function mapArm3RowToIntelligenceTool(row: Arm3ToolRow): IntelligenceTool {
  const registryEntry = SECTOR3_REGISTRY.find((entry) => entry.slug === row.slug);
  const brand = getToolBrand(row.slug);
  const appUrl =
    registryEntry?.appUrl ??
    (row.status === "live" || row.status === "scale"
      ? `${PORTAL_URL}/${row.slug}`
      : undefined);

  return {
    name: row.name,
    slug: row.slug,
    subdomain: registryEntry?.subdomain ?? `${row.slug}.northsideintelligence.com`,
    description: row.description ?? "",
    status: row.status === "live" || row.status === "scale" ? "LIVE" : "COMING SOON",
    category: normalizeCategory(row.category),
    keywords: keywordsForTool(row),
    url: appUrl,
    github: registryEntry?.github ?? `https://github.com/${GITHUB_ORG}/${row.slug}`,
    ...brand,
  };
}

export async function getLiveArm3ToolsForCarousel(): Promise<IntelligenceTool[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("arm3_tools")
    .select("name, slug, description, category, status, target_user")
    .in("status", ["live", "scale"])
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return SECTOR3_REGISTRY.map((entry) =>
      mapArm3RowToIntelligenceTool({
        name: entry.name,
        slug: entry.slug,
        description: entry.description,
        category: entry.slug === "replyflow" ? "Automation" : "Intelligence",
        status: entry.status === "LIVE" ? "live" : "building",
        target_user: null,
      })
    );
  }

  return (data as Arm3ToolRow[]).map(mapArm3RowToIntelligenceTool);
}

export async function getCarouselTools(): Promise<IntelligenceTool[]> {
  const liveTools = await getLiveArm3ToolsForCarousel();
  const liveSlugs = new Set(liveTools.map((tool) => tool.slug));
  const comingSoon = STATIC_COMING_SOON_TOOLS.filter(
    (tool) => !liveSlugs.has(tool.slug)
  );

  return [...liveTools, ...comingSoon];
}
