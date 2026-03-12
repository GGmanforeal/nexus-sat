import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [domainRes, testsRes, userRes] = await Promise.all([
    supabase
      .from('domain_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('accuracy_pct', { ascending: true }),

    supabase
      .from('practice_tests')
      .select('id,test_type,section,total_questions,correct_count,score_pct,started_at,completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10),

    supabase
      .from('users')
      .select('total_answered,total_correct,streak_days,math_score,ebrw_score')
      .eq('id', user.id)
      .single(),
  ])

  return NextResponse.json({
    domain_stats:  domainRes.data  || [],
    recent_tests:  testsRes.data   || [],
    user_summary:  userRes.data    || {},
  })
}