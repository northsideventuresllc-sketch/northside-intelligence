import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/stripe'
import { normalizeUserPlan } from '@/lib/tier'

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`)
  const data = await res.json()
  return data.content.find((c: { type: string; text?: string }) => c.type === 'text')?.text ?? ''
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase
      .from('replyflow_profiles')
      .select('plan, replies_used_this_month, replies_reset_at')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const plan = normalizeUserPlan(profile.plan)
    const limit = PLAN_LIMITS[plan] ?? 10
    const resetAt = new Date(profile.replies_reset_at)
    const now = new Date()
    const monthsSince = (now.getFullYear() - resetAt.getFullYear()) * 12 + (now.getMonth() - resetAt.getMonth())
    let repliesUsed = profile.replies_used_this_month
    if (monthsSince >= 1) {
      repliesUsed = 0
      const svc = createServiceClient()
      await svc.from('replyflow_profiles').update({ replies_used_this_month: 0, replies_reset_at: now.toISOString() }).eq('id', user.id)
    }
    if (repliesUsed >= limit) return NextResponse.json({ error: `Reply limit reached (${limit}/mo on ${plan} plan).` }, { status: 429 })

    const { message, tone, scenario } = await req.json()
    if (!message || !tone || !scenario) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const systemPrompt = `You are a customer service expert. Write a ${tone} customer service reply for a ${scenario} scenario. Be concise, empathetic, and professional. Return only the reply text.`
    const reply = await callClaude(systemPrompt, message)

    const svc2 = createServiceClient()
    await svc2.from('replyflow_profiles').update({ replies_used_this_month: repliesUsed + 1 }).eq('id', user.id)

    return NextResponse.json({ reply, usage: { used: repliesUsed + 1, limit } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
