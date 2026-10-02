import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export interface StylePreference {
  greetingPattern?: string;
  signoffPattern?: string;
  averageSentenceLength?: "concise" | "moderate" | "elaborate";
  bannedWords: string[];
  preferredPhrases: string[];
}

/**
 * Analyzes the edit diff between AI-generated reply and user-modified text to extract stylistic learnings.
 */
export function extractStyleDiffLearnings(params: {
  generatedReply: string;
  editedReply: string;
}): StylePreference {
  const { generatedReply, editedReply } = params;
  const learnings: StylePreference = {
    bannedWords: [],
    preferredPhrases: [],
  };

  const genWords = new Set(generatedReply.toLowerCase().split(/\s+/));
  const editWords = new Set(editedReply.toLowerCase().split(/\s+/));

  // Identify words user deleted
  for (const word of genWords) {
    if (word.length > 5 && !editWords.has(word)) {
      learnings.bannedWords.push(word);
    }
  }

  // Detect signoff preference
  const lines = editedReply.trim().split("\n").filter(Boolean);
  if (lines.length > 0) {
    const lastLine = lines[lines.length - 1].trim();
    if (lastLine.length < 40 && /(best|sincerely|cheers|thanks|regards|warmly|jb|jonny)/i.test(lastLine)) {
      learnings.signoffPattern = lastLine;
    }
  }

  // Detect sentence length preference
  const sentences = editedReply.split(/[.!?]+/).filter(Boolean);
  const avgWordsPerSentence = editedReply.split(/\s+/).length / (sentences.length || 1);
  if (avgWordsPerSentence < 12) {
    learnings.averageSentenceLength = "concise";
  } else if (avgWordsPerSentence > 22) {
    learnings.averageSentenceLength = "elaborate";
  } else {
    learnings.averageSentenceLength = "moderate";
  }

  return learnings;
}

/**
 * Persists learned style preferences to the user's ReplyFlow learning profile.
 */
export async function persistStylePreference(
  userId: string,
  learnings: StylePreference
): Promise<void> {
  const svc = createServiceClient();
  try {
    // Check if learning profile exists in Supabase
    const { data: existing } = await svc
      .from("replyflow_learning_profiles")
      .select("preferences")
      .eq("user_id", userId)
      .maybeSingle();

    const currentPreferences: StylePreference = existing?.preferences || {
      bannedWords: [],
      preferredPhrases: [],
    };

    // Merge preferences
    const mergedBanned = Array.from(
      new Set([...(currentPreferences.bannedWords || []), ...learnings.bannedWords])
    ).slice(0, 50);

    const updated: StylePreference = {
      ...currentPreferences,
      ...learnings,
      bannedWords: mergedBanned,
    };

    await svc.from("replyflow_learning_profiles").upsert({
      user_id: userId,
      preferences: updated,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-fatal background learning error logging
    console.warn("[ReplyFlow Learning] Could not persist style preference:", err);
  }
}
