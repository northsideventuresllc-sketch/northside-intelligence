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
 * Notify every account holder about a deployed fix/change.
 * Standing process: called by the Vercel deploy webhook on every
 * successful production deployment.
 */
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
