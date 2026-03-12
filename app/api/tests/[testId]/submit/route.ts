import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question_id, selected_answer, time_spent_secs, is_flagged = false } = await req.json()

  const { data: test } = await supabase
    .from('practice_tests')
    .select('id,status,question_ids')
    .eq('id', params.testId)
    .eq('user_id', user.id)
    .single()

  if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })
  if (test.status !== 'in_progress')
    return NextResponse.json({ error: 'Test already completed' }, { status: 400 })

  const { data: question } = await supabase
    .from('sat_questions')
    .select('correct_answer,explanation,choice_a,choice_b,choice_c,choice_d')
    .eq('id', question_id)
    .single()

  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  const is_correct = selected_answer === question.correct_answer

  const { error: progErr } = await supabase
    .from('user_progress')
    .insert({
      user_id:         user.id,
      test_id:         params.testId,
      question_id,
      selected_answer,
      is_correct,
      time_spent_secs: time_spent_secs || null,
      is_flagged,
    })

  if (progErr) return NextResponse.json({ error: progErr.message }, { status: 500 })

  const { count: answeredCount } = await supabase
    .from('user_progress')
    .select('id', { count: 'exact', head: true })
    .eq('test_id', params.testId)

  if (answeredCount === test.question_ids.length) {
    await supabase
      .from('practice_tests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', params.testId)
  }

  return NextResponse.json({
    is_correct,
    correct_answer: question.correct_answer,
    explanation:    question.explanation,
    choices: {
      A: question.choice_a,
      B: question.choice_b,
      C: question.choice_c,
      D: question.choice_d,
    },
  })
}