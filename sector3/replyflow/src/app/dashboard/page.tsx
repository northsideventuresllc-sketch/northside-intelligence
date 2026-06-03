import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, PLAN_LABELS } from '@/lib/stripe'
import { normalizeUserPlan } from '@/lib/tier'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('replyflow_profiles').select('plan, replies_used_this_month').eq('id', user.id).single()
  const plan = normalizeUserPlan(profile?.plan)
  const used = profile?.replies_used_this_month || 0
  const limit = PLAN_LIMITS[plan] || 10
  const planLabel = PLAN_LABELS[plan] || 'Free'
  return <DashboardClient email={user.email ?? ''} plan={plan} planLabel={planLabel} repliesUsed={used} repliesLimit={limit} />
}
