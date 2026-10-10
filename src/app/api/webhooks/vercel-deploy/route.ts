import { NextRequest, NextResponse } from "next/server";
import {
  notifyDeployToAllUsers,
  formatChangelog,
} from "@/lib/deploy-notifications";

/**
 * POST /api/webhooks/vercel-deploy
 *
 * Vercel deployment webhook. Configure in Vercel dashboard:
 * Project Settings → Webhooks → Add webhook for "Deployment Succeeded"
 * pointing at https://www.northsideintelligence.com/api/webhooks/vercel-deploy
 * with a secret stored as VERCEL_DEPLOY_WEBHOOK_SECRET.
 *
 * On every successful production deploy, every account holder gets an
 * email + portal notification describing what changed.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.VERCEL_DEPLOY_WEBHOOK_SECRET?.trim();
  if (secret) {
    const provided =
      req.headers.get("x-vercel-webhook-secret") ??
      req.nextUrl.searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Vercel webhook payload shape
  const type = payload.type as string | undefined;
  const deployment = payload.payload as Record<string, unknown> | undefined;
  if (!deployment) {
    return NextResponse.json({ error: "Missing deployment payload" }, { status: 400 });
  }

  // Only notify on successful production deployments
  const target = (deployment.target as string) ?? "";
  const state = (deployment.state as string) ?? "";
  const readyState = (deployment.readyState as string) ?? "";
  if (target !== "production") {
    return NextResponse.json({ skipped: "not production" });
  }
  if (type && !type.includes("succeeded") && readyState !== "READY" && state !== "READY") {
    return NextResponse.json({ skipped: "not succeeded" });
  }

  const meta = (deployment.meta as Record<string, unknown>) ?? {};
  const commitSha = String(
    meta.githubCommitSha ?? deployment.commitSha ?? ""
  );
  const commitMessage = String(
    meta.githubCommitMessage ?? deployment.commitMessage ?? "Improvements and bug fixes"
  );
  const projectName = String(
    (deployment.project as Record<string, unknown> | undefined)?.name ??
      deployment.name ??
      "northside-intelligence"
  );
  const deploymentUrl = String(deployment.url ?? "");

  // Don't spam for automated/empty commits
  if (/^chore\(deps\)/i.test(commitMessage)) {
    return NextResponse.json({ skipped: "dependency chore" });
  }

  const result = await notifyDeployToAllUsers({
    commitSha,
    commitMessage,
    deploymentUrl,
    projectName,
  });

  return NextResponse.json({
    ok: true,
    changelog: formatChangelog(commitMessage),
    ...result,
  });
}
