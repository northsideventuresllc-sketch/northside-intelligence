/**
 * Gemini image generation for Content Machine posts (CM4).
 * Uses Gemini 2.0 Flash image generation when GEMINI_API_KEY is set.
 */
export async function generatePostImage(args: {
  visualPrompt: string;
  brandSlug: string;
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_BACKUP;
  if (!apiKey) {
    console.warn("[content-machine/image-gen] GEMINI_API_KEY not set — skipping");
    return null;
  }

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation";
  const prompt = [
    args.visualPrompt,
    "Match Fit brand: dark backdrop #07080C with orange #FF7E00 accents.",
    "Social media marketing image, scroll-stopping, professional fitness aesthetic.",
    "No watermarks, no stock photo feel.",
  ].join(" ");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Gemini image gen failed: ${response.status} ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
    }>;
  };

  const inlineData = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
    ?.inlineData;

  if (!inlineData?.data) return null;

  const uploaded = await uploadImageToStorage({
    base64: inlineData.data,
    mimeType: inlineData.mimeType ?? "image/png",
    brandSlug: args.brandSlug,
  });

  return uploaded;
}

async function uploadImageToStorage(args: {
  base64: string;
  mimeType: string;
  brandSlug: string;
}): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  const ext = args.mimeType.includes("png") ? "png" : "jpg";
  const path = `content-machine/${args.brandSlug}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(args.base64, "base64");

  const uploadUrl = `${supabaseUrl}/storage/v1/object/content-images/${path}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": args.mimeType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    console.warn("[content-machine/image-gen] storage upload failed:", res.status);
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/content-images/${path}`;
}
