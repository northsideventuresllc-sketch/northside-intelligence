import "server-only";

export interface ApiServicePreset {
  serviceId: "hubspot" | "stripe" | "notion" | "slack" | "resend" | "supabase";
  name: string;
  baseUrl: string;
  authHeaderType: "Bearer" | "Basic" | "ApiKeyHeader";
  authHeaderName: string;
  keyPlaceholder: string;
  commonEndpoints: Array<{
    name: string;
    path: string;
    method: "GET" | "POST" | "PATCH" | "DELETE";
    description: string;
  }>;
}

export const API_PRESETS: Record<string, ApiServicePreset> = {
  hubspot: {
    serviceId: "hubspot",
    name: "HubSpot CRM",
    baseUrl: "https://api.hubapi.com",
    authHeaderType: "Bearer",
    authHeaderName: "Authorization",
    keyPlaceholder: "pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    commonEndpoints: [
      { name: "Create Contact", path: "/crm/v3/objects/contacts", method: "POST", description: "Creates a new CRM contact lead" },
      { name: "Get Deal Pipeline", path: "/crm/v3/pipelines/deals", method: "GET", description: "Fetches active sales deal stages" },
    ],
  },
  stripe: {
    serviceId: "stripe",
    name: "Stripe Billing & Payments",
    baseUrl: "https://api.stripe.com/v1",
    authHeaderType: "Bearer",
    authHeaderName: "Authorization",
    keyPlaceholder: "sk_live_... or sk_test_...",
    commonEndpoints: [
      { name: "Create Customer", path: "/customers", method: "POST", description: "Registers customer with payment method" },
      { name: "Create Checkout Session", path: "/checkout/sessions", method: "POST", description: "Generates hosted payment checkout URL" },
    ],
  },
  notion: {
    serviceId: "notion",
    name: "Notion Workspace API",
    baseUrl: "https://api.notion.com/v1",
    authHeaderType: "Bearer",
    authHeaderName: "Authorization",
    keyPlaceholder: "secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    commonEndpoints: [
      { name: "Query Database", path: "/databases/{database_id}/query", method: "POST", description: "Searches or filters database pages" },
      { name: "Create Page", path: "/pages", method: "POST", description: "Appends new row or document page" },
    ],
  },
  slack: {
    serviceId: "slack",
    name: "Slack Webhooks & Bot API",
    baseUrl: "https://slack.com/api",
    authHeaderType: "Bearer",
    authHeaderName: "Authorization",
    keyPlaceholder: "xoxb-... or Webhook URL",
    commonEndpoints: [
      { name: "Post Message", path: "/chat.postMessage", method: "POST", description: "Sends interactive channel notification" },
    ],
  },
  resend: {
    serviceId: "resend",
    name: "Resend Email Platform",
    baseUrl: "https://api.resend.com",
    authHeaderType: "Bearer",
    authHeaderName: "Authorization",
    keyPlaceholder: "re_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx",
    commonEndpoints: [
      { name: "Send Email", path: "/emails", method: "POST", description: "Dispatches transactional HTML/Markdown email" },
    ],
  },
  supabase: {
    serviceId: "supabase",
    name: "Supabase Database & Auth",
    baseUrl: "https://your-project.supabase.co/rest/v1",
    authHeaderType: "ApiKeyHeader",
    authHeaderName: "apikey",
    keyPlaceholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    commonEndpoints: [
      { name: "Query Table", path: "/{table}?select=*", method: "GET", description: "Queries table records with RLS filters" },
      { name: "Insert Record", path: "/{table}", method: "POST", description: "Inserts record payload into database" },
    ],
  },
};
