import type { ToolHandler } from "./types";
import { handler as mf_search_coaches } from "./tools/mf_search_coaches";
import { handler as mf_book_coach } from "./tools/mf_book_coach";
import { handler as ni_replyflow_subscribe } from "./tools/ni_replyflow_subscribe";
import { handler as ni_replyflow_generate } from "./tools/ni_replyflow_generate";
import { handler as ni_gapscan_run } from "./tools/ni_gapscan_run";
import { handler as ni_signaldesk_brief } from "./tools/ni_signaldesk_brief";
import { handler as ni_grantbot_search } from "./tools/ni_grantbot_search";
import { handler as ni_bridgeai_run } from "./tools/ni_bridgeai_run";
import { handler as ni_store_search } from "./tools/ni_store_search";
import { handler as ni_store_order } from "./tools/ni_store_order";
import { handler as ni_services_reserve } from "./tools/ni_services_reserve";

export const handlers: Record<string, ToolHandler> = {
  mf_search_coaches,
  mf_book_coach,
  ni_replyflow_subscribe,
  ni_replyflow_generate,
  ni_gapscan_run,
  ni_signaldesk_brief,
  ni_grantbot_search,
  ni_bridgeai_run,
  ni_store_search,
  ni_store_order,
  ni_services_reserve,
};
