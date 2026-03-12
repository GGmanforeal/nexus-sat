import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { test_type, section, domain, difficulty, count = 10 } = body

  let qQuery = supabase
    .from('sat_questions')
    .select('id,section,domain,skill,difficulty,question_text,passage_text,choice_a,choice_b,choice_c,choice_d,has_image,image_url')

  if (section && section !== 'Both') qQuery = qQuery.eq('section', section)
  if (domain)     qQuery = qQuery.eq('domain', domain)
  if (difficulty && difficulty !== 'mixed') qQuery = qQuery.eq('difficulty', difficulty)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentIds } = await supabase
    .from('user_progress')
    .select('question_id')
    .eq('user_id', user.id)
    .gte('answered_at', sevenDaysAgo)

  const excludeIds = (recentIds || []).map((r: any) => r.question_id)
  if (excludeIds.length > 0) {
    qQuery = qQuery.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data: questions, error: qErr } = await qQuery.limit(count * 3)
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  const selected = (questions || [])
    .sort(() => Math.random() - 0.5)
    .slice(0, count)

  if (selected.length === 0)
    return NextResponse.json({ error: 'No questions match your criteria' }, { status: 404 })

  const { data: test, error: tErr } = await supabase
    .from('practice_tests')
    .insert({
      user_id:         user.id,
      test_type,
      section:         section || 'Both',
      domain:          domain || null,
      difficulty:      difficulty || 'mixed',
      question_ids:    selected.map((q: any) => q.id),
      total_questions: selected.length,
      status:          'in_progress',
    })
    .select()
    .single()

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  return NextResponse.json({
    test_id:   test.id,
    questions: selected,
    total:     selected.length,
  })
}