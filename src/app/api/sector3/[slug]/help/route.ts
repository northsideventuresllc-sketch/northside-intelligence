import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { answerSector3ToolHelpQuestion } from "@/lib/sector3-tools/ai";
import {
  getSector3ToolHelpContent,
  isValidSector3HelpSlug,
} from "@/lib/sector3-tools/help-content";
import { getSector3BySlug } from "@/lib/sector3-registry";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!isValidSector3HelpSlug(slug)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { question?: string };
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  if (question.length > 500) {
    return NextResponse.json(
      { error: "Question must be 500 characters or fewer" },
      { status: 400 }
    );
  }

  const entry = getSector3BySlug(slug);
  const help = getSector3ToolHelpContent(slug)!;

  try {
    const answer = await answerSector3ToolHelpQuestion(
      entry.name,
      help.summary,
      question
    );
    return NextResponse.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not answer question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
