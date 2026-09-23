import manifestJson from "../../../public/.well-known/webmcp.json";
import type { ManifestTool } from "./types";

export const manifest = manifestJson as { tools: ManifestTool[] } & Record<string, unknown>;

export function findTool(name: unknown): ManifestTool | undefined {
  return typeof name === "string" ? manifest.tools.find((t) => t.name === name) : undefined;
}
