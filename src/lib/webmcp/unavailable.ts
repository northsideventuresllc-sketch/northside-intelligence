import type { ToolHandler } from "./types";

export const unavailable: ToolHandler = async (tool) => ({
  status: "unavailable",
  message: `${tool.name} is not available yet. Contact jb@northsideintelligence.com.`,
});
