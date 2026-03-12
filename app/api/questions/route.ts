import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const section    = searchParams.get('section')
  const domain     = searchParams.get('domain')
  const skill      = searchParams.get('skill')
  const difficulty = searchParams.get('difficulty')
  const limit      = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const exclude    = searchParams.get('exclude')?.split(',').filter(Boolean) || []

  let query = supabase
    .from('sat_questions')
    .select('id,section,domain,skill,difficulty,question_text,passage_text,choice_a,choice_b,choice_c,choice_d,has_image,image_url')

  if (section)    query = query.eq('section', section)
  if (domain)     query = query.eq('domain', domain)
  if (skill)      query = query.eq('skill', skill)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (exclude.length > 0) query = query.not('id', 'in', `(${exclude.join(',')})`)

  const { data, error } = await query.limit(limit * 3)

  if (error) {
    console.error('[GET /api/questions]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, limit)

  return NextResponse.json({ questions: shuffled, count: shuffled.length })
}