import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createServerClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/tier'

const REPLYFLOW_MODEL = 'anthropic/claude-haiku-4.5'

async function generateReply(systemPrompt: string, userMessage: string): Promise<string> {
  const { text } = await generateText({
    model: REPLYFLOW_MODEL,
    system: systemPrompt,
    prompt: userMessage,
    maxOutputTokens: 1024,
  })
  return text.trim()
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('replyflow_profiles')
      .select('plan, replies_used_this_month, replies_reset_at')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const limit = PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS] ?? 10
    const resetAt = new Date(profile.replies_reset_at)
    const now = new Date()
    const monthsSince = (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth())
    let repliesUsed = profile.replies_used_this_month
    if (monthsSince >= 1) {
      repliesUsed = 0
      await supabase.from('replyflow_profiles').update({ replies_used_this_month: 0, replies_reset_at: now.toISOString() }).eq('id', user.id)
    }
    if (repliesUsed >= limit) {
      return NextResponse.json({ error: `Reply limit reached (${limit}/mo on ${profile.plan} plan).` }, { status: 429 })
    }

    const { message, tone, scenario } = await req.json()
    if (!message || !tone || !scenario) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const systemPrompt = `You are a customer service expert. Write a ${tone} customer service reply for a ${scenario} scenario. Be concise, empathetic, and professional. Return only the reply text.`
    const reply = await generateReply(systemPrompt, message)

    await supabase.from('replyflow_profiles').update({ replies_used_this_month: repliesUsed + 1 }).eq('id', user.id)

    return NextResponse.json({ reply, usage: { used: repliesUsed + 1, limit } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
