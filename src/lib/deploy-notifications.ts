import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { sendNoreplyEmail, buildNiEmailHtml } from "@/lib/email/noreply";
import { createNotification } from "@/lib/notifications/service";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";

export interface DeployInfo {
  commitSha: string;
  commitMessage: string;
  deploymentUrl: string;
  projectName: string;
}

/**
 * Format a commit message into a user-friendly changelog.
 * Commit messages follow the pattern: "Brief summary: detail1, detail2, ..."
 */
export function formatChangelog(commitMessage: string): string {
  // Take the first line, strip common prefixes
  const firstLine = commitMessage.split("\n")[0].trim();
  const cleaned = firstLine
    .replace(/^(feat|fix|chore|docs|style|refactor|test)(\(.+\))?:\s*/i, "")
    .trim();
  return cleaned || "Improvements and bug fixes";
}

/**
 * Notify GrantBot users about the live grant search fix.
 * Targeted email: grant search now uses live data (Grants.gov API + web search)
 * and deliverables are personalized from real grant requirements.
 * Called automatically by the deploy webhook on grantbot-related deploys.
 */
export async function notifyGrantBotFix(
  deploySha: string
): Promise<{ emailed: number; notified: number }> {
  const supabase = createServiceClient();
  const shortSha = deploySha.slice(0, 7);

  const { data: profiles, error } = await supabase
    .from("grantbot_profiles")
    .select("id, email")
    .neq("account_type", "deleted");

  if (error || !profiles) {
    console.error("[grantbot-fix-notify] failed to load profiles:", error);
    return { emailed: 0, notified: 0 };
  }

  let emailed = 0;
  let notified = 0;

  const emailHtml = buildNiEmailHtml({
    title: "GrantBot just got a major upgrade",
    body: `We've rebuilt GrantBot's grant search from the ground up:<br/><br/>
<strong>Live grant data:</strong> GrantBot now searches live sources — the Grants.gov API for current federal opportunities and real-time web search for foundation and private grants. No more static lists.<br/><br/>
<strong>Personalized deliverables:</strong> When you pick a grant, GrantBot now reads the actual grant page and builds your proposal around the real requirements — actual deadlines, required sections, and evaluation criteria.<br/><br/>
<strong>Your monthly submissions have been reset</strong> so you can try the new version right away.`,
    ctaLabel: "Try the new GrantBot",
    ctaHref: `${APP_URL}/grantbot`,
  });

  for (const profile of profiles) {
    const email = (profile as { email?: string }).email;
    const userId = (profile as { id: string }).id;
    if (!email) continue;

    try {
      await sendNoreplyEmail({
        to: email,
        subject: "GrantBot upgrade: live grant search is here",
        html: emailHtml,
        idempotencyKey: `grantbot-fix-${shortSha}-${userId}`,
      });
      emailed++;

      await createNotification({
        userId,
        category: "announcement",
        title: "GrantBot upgraded: live grant search",
        body: "Grant search now uses live data and deliverables are personalized from real grant requirements. Your monthly submissions have been reset.",
        link: "/grantbot",
        metadata: { kind: "grantbot-fix", sha: shortSha },
      });
      notified++;
    } catch (err) {
      console.error("[grantbot-fix-notify] failed for", userId, err);
    }
  }

  return { emailed, notified };
}

/**
 * Reset GrantBot monthly usage counts for all users.
 * Gives back submissions so users can try a fixed/upgraded version.
 * Called automatically by the deploy webhook on grantbot-related deploys.
 */
export async function resetGrantBotMonthlyUsage(): Promise<{ reset: number }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("grantbot_profiles")
    .update({
      grants_used_this_month: 0,
      searches_used_this_month: 0,
      grants_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .neq("account_type", "deleted")
    .or("grants_used_this_month.gt.0,searches_used_this_month.gt.0")
    .select("id");

  if (error) {
    console.error("[grantbot-reset] failed:", error);
    return { reset: 0 };
  }

  return { reset: data?.length ?? 0 };
}
export async function notifyDeployToAllUsers(
  deploy: DeployInfo
): Promise<{ emailed: number; notified: number }> {
  const supabase = createServiceClient();
  const changelog = formatChangelog(deploy.commitMessage);
  const shortSha = deploy.commitSha.slice(0, 7);

  // Paginate through all profiles
  let emailed = 0;
  let notified = 0;
  let page = 0;
  const pageSize = 500;

  while (true) {
    const { data: profiles, error } = await supabase
      .from("ni_portal_profiles")
      .select("id, email")
      .neq("account_type", "deleted")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !profiles || profiles.length === 0) break;

    for (const profile of profiles) {
      const email = (profile as { email?: string }).email;
      const userId = (profile as { id: string }).id;
      if (!email) continue;

      try {
        await sendNoreplyEmail({
          to: email,
          subject: `Northside Intelligence update: ${changelog.slice(0, 60)}`,
          html: buildNiEmailHtml({
            title: "We've shipped an update",
            body: `Here's what changed in this update:<br/><br/><strong>${changelog}</strong><br/><br/><span style="color:#888;font-size:12px;">Build ${shortSha} · ${deploy.projectName}</span>`,
            ctaLabel: "Open your portal",
            ctaHref: `${APP_URL}/`,
          }),
          idempotencyKey: `deploy-${shortSha}-${userId}`,
        });
        emailed++;

        await createNotification({
          userId,
          category: "announcement",
          title: "Platform update shipped",
          body: changelog,
          link: "/",
          metadata: { kind: "deploy", sha: shortSha },
        });
        notified++;
      } catch (err) {
        console.error("[deploy-notify] failed for", userId, err);
      }
    }

    if (profiles.length < pageSize) break;
    page++;
  }

  return { emailed, notified };
}
