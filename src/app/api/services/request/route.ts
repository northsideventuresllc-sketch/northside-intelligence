import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getServiceBySlug, type AccountType } from "@/lib/services/offerings";

interface ServiceRequestBody {
  serviceSlug: string;
  contactName: string;
  email: string;
  accountType: AccountType;
  businessName?: string;
  industry: string;
  currentSystems: string;
  painPoints: string;
  desiredOutcomes: string;
  timeline: string;
  budgetRange: string;
  teamSize: string;
  additionalContext: string;
  referralSource?: string;
}

const VALID_ACCOUNT_TYPES: AccountType[] = ["personal", "business"];

export async function POST(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "An account is required to submit a service request" }, { status: 401 });
  }

  let body: ServiceRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.serviceSlug?.trim()) {
    return NextResponse.json({ error: "Service slug is required" }, { status: 400 });
  }

  const service = getServiceBySlug(body.serviceSlug.trim());
  if (!service) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }

  if (!VALID_ACCOUNT_TYPES.includes(body.accountType)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }

  if (body.accountType === "business" && !body.businessName?.trim()) {
    return NextResponse.json({ error: "Business name is required for business accounts" }, { status: 400 });
  }

  const requiredFields: (keyof ServiceRequestBody)[] = [
    "contactName",
    "email",
    "industry",
    "currentSystems",
    "painPoints",
    "desiredOutcomes",
    "timeline",
    "budgetRange",
    "teamSize",
  ];

  for (const field of requiredFields) {
    const value = body[field];
    if (typeof value !== "string" || !value.trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const admin = createServiceClient();
  const now = new Date().toISOString();

  const profileUpdates: Record<string, string | null> = {
    account_type: body.accountType,
    updated_at: now,
  };

  if (body.accountType === "business" && body.businessName?.trim()) {
    profileUpdates.business_name = body.businessName.trim();
  }

  await admin.from("ni_portal_profiles").update(profileUpdates).eq("id", user.id);

  const payload = {
    contactName: body.contactName.trim(),
    email: body.email.trim().toLowerCase(),
    businessName: body.businessName?.trim() || null,
    industry: body.industry.trim(),
    currentSystems: body.currentSystems.trim(),
    painPoints: body.painPoints.trim(),
    desiredOutcomes: body.desiredOutcomes.trim(),
    timeline: body.timeline.trim(),
    budgetRange: body.budgetRange.trim(),
    teamSize: body.teamSize.trim(),
    additionalContext: body.additionalContext?.trim() || "",
    referralSource: body.referralSource?.trim() || null,
  };

  const { error: insertError } = await admin.from("ni_service_requests").insert({
    user_id: user.id,
    service_slug: body.serviceSlug.trim(),
    account_type: body.accountType,
    payload,
    status: "pending",
    created_at: now,
    updated_at: now,
  });

  if (insertError) {
    console.error("Failed to insert service request:", insertError);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }

  // Marketing skeleton signal — interested lead (non-blocking).
  try {
    const { recordSkeletonSignal } = await import("@/lib/marketing-skeleton/db");
    await recordSkeletonSignal({
      productSlug: "ni-services",
      signalType: "signup",
      detail: { service_slug: body.serviceSlug.trim(), account_type: body.accountType },
    });
  } catch (signalError) {
    console.error("[marketing-skeleton] service request signal failed:", signalError);
  }

  return NextResponse.json({ success: true });
}
