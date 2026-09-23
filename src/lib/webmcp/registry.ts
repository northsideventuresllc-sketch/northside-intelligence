import type { ToolModule, ToolHandler } from "./types";
import { makeOrderStatusHandler } from "./order-status";
import * as mf_search_coaches from "./tools/mf_search_coaches";
import * as mf_book_coach from "./tools/mf_book_coach";
import * as ni_replyflow_subscribe from "./tools/ni_replyflow_subscribe";
import * as ni_replyflow_generate from "./tools/ni_replyflow_generate";
import * as ni_gapscan_run from "./tools/ni_gapscan_run";
import * as ni_signaldesk_brief from "./tools/ni_signaldesk_brief";
import * as ni_grantbot_search from "./tools/ni_grantbot_search";
import * as ni_bridgeai_run from "./tools/ni_bridgeai_run";
import * as ni_store_search from "./tools/ni_store_search";
import * as ni_store_order from "./tools/ni_store_order";
import * as ni_services_reserve from "./tools/ni_services_reserve";

export const modules: Record<string, ToolModule> = {
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

export const handlers: Record<string, ToolHandler> = {
  ...Object.fromEntries(Object.entries(modules).map(([k, m]) => [k, m.handler])),
  ni_order_status: makeOrderStatusHandler(modules),
};
