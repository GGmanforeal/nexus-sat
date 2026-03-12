'use client'
// components/QuestionCard.tsx
import { useState, useEffect, useCallback } from 'react'
import { Question } from '@/lib/types'
import { sessionStore } from '@/lib/store/session'

interface Props {
  question: Question
  testId?: string          // if present, submits to /api/tests/[id]/submit
  onNext?: () => void
  onSaveToggle?: (saved: boolean) => void
  showNav?: boolean
  idx?: number
  total?: number
  onPrev?: () => void
}

const LABELS = ['A', 'B', 'C', 'D']

export function QuestionCard({ question: q, testId, onNext, onPrev, idx = 0, total = 1 }: Props) {
  const [sel, setSel]           = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult]     = useState<{ isCorrect: boolean; explanation: string; correct: string } | null>(null)
  const [loading, setLoading]   = useState(false)
  const [saved, setSaved]       = useState(() => sessionStore.isSaved(q.id))

  // Reset when question changes
  useEffect(() => {
    setSel(null); setSubmitted(false); setResult(null)
    setSaved(sessionStore.isSaved(q.id))
  }, [q.id])

  const confirm = useCallback(async () => {
    if (!sel || submitted || loading) return
    setLoading(true)

    let isCorrect = false
    let explanation = q.explanation || ''
    let correct = q.correct_answer

    if (testId) {
      // Authenticated flow — submit to API
      try {
        const res = await fetch(`/api/tests/${testId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_id: q.id, selected_answer: sel }),
        })
        const data = await res.json()
        isCorrect   = data.is_correct
        explanation = data.explanation || explanation
        correct     = data.correct_answer || correct
      } catch { /* fall through */ }
    } else {
      // Guest flow — check locally
      isCorrect = sel === q.correct_answer
      correct   = q.correct_answer
    }

    setResult({ isCorrect, explanation, correct })
    setSubmitted(true)
    setLoading(false)

    // Record in session store for Stats / Mistakes / Score pages
    sessionStore.addAnswer({
      questionId:     q.id,
      section:        q.section,
      domain:         q.domain,
      skill:          q.skill,
      difficulty:     q.difficulty,
      selectedAnswer: sel,
      correctAnswer:  correct,
      isCorrect,
      explanation,
      question_text:  q.question_text,
      choice_a: q.choice_a, choice_b: q.choice_b,
      choice_c: q.choice_c, choice_d: q.choice_d,
    })
  }, [sel, submitted, loading, testId, q])

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const map: Record<string, string> = { a:'A', b:'B', c:'C', d:'D', '1':'A', '2':'B', '3':'C', '4':'D' }
      if (!submitted && map[e.key.toLowerCase()]) { setSel(map[e.key.toLowerCase()]); return }
      if (e.key === 'Enter') {
        if (!submitted && sel) confirm()
        else if (submitted && onNext) onNext()
      }
      if (e.key === 'ArrowRight' && submitted && onNext) onNext()
      if (e.key === 'ArrowLeft' && onPrev) onPrev()
      if (e.key.toLowerCase() === 's') toggleSave()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [submitted, sel, confirm, onNext, onPrev])

  const toggleSave = () => {
    const next = !saved
    setSaved(next)
    const log = sessionStore.get().answered.find(a => a.questionId === q.id)
    if (log) sessionStore.toggleSaved(log)
    else sessionStore.toggleSaved({
      questionId: q.id, section: q.section, domain: q.domain,
      skill: q.skill, difficulty: q.difficulty,
      selectedAnswer: '', correctAnswer: q.correct_answer, isCorrect: false,
      explanation: q.explanation, question_text: q.question_text,
      choice_a: q.choice_a, choice_b: q.choice_b,
      choice_c: q.choice_c, choice_d: q.choice_d,
    })
  }

  const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d]
  const corrIdx = LABELS.indexOf(result?.correct || q.correct_answer)

  const choiceCls = (i: number) => {
    if (!submitted) return sel === LABELS[i] ? 'choice-selected' : 'choice-default'
    if (i === corrIdx) return 'choice-correct'
    if (LABELS[i] === sel && !result?.isCorrect) return 'choice-wrong'
    return 'choice-dim'
  }

  const sectionLabel = /math/i.test(q.section) ? 'Math' : 'Reading & Writing'
  const diffColor = { easy: 'var(--g-tx)', medium: 'var(--a-tx)', hard: 'var(--r-tx)' }[q.difficulty] || 'var(--tx3)'

  return (
    <div style={{ maxWidth: 740, padding: '28px 30px 60px', animation: 'fadeUp .2s ease' }}>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
          background: /math/i.test(q.section) ? 'rgba(37,99,235,.14)' : 'rgba(124,58,237,.14)',
          color: /math/i.test(q.section) ? '#60a5fa' : '#a78bfa' }}>{sectionLabel}</span>
        {q.domain && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
          background: 'var(--sf3)', color: 'var(--tx2)' }}>{q.domain}</span>}
        {q.difficulty && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
          background: 'transparent', color: diffColor, border: `1px solid ${diffColor}` }}>{q.difficulty}</span>}
      </div>

      {/* Passage */}
      {q.passage_text && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderLeft: '3px solid var(--lime-dk)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
            color: 'var(--lime-dk)', marginBottom: 8 }}>Passage</div>
          <div style={{ fontSize: 14, lineHeight: 1.82, color: 'var(--tx2)' }}>{q.passage_text}</div>
        </div>
      )}

      {/* Question */}
      <div style={{ fontSize: 15, lineHeight: 1.72, color: 'var(--tx)', marginBottom: 22 }}>{q.question_text}</div>

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        {opts.map((opt, i) => {
          if (!opt) return null
          const cls = choiceCls(i)
          return (
            <div
              key={i}
              onClick={() => !submitted && setSel(LABELS[i])}
              className={cls}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 11,
                padding: '12px 15px', borderRadius: 12, border: '1.5px solid',
                cursor: submitted ? 'default' : 'pointer',
                transition: 'border-color .13s, background .13s',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                border: '1.5px solid var(--line2)',
                fontSize: 12, fontWeight: 700, color: 'var(--tx3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontFamily: 'var(--mono)',
                ...(cls === 'choice-selected' ? { background: 'var(--lime)', borderColor: 'var(--lime)', color: '#060a0e' } : {}),
                ...(cls === 'choice-correct'  ? { background: 'var(--g-tx)', borderColor: 'var(--g-tx)', color: '#fff' } : {}),
                ...(cls === 'choice-wrong'    ? { background: 'var(--r-tx)', borderColor: 'var(--r-tx)', color: '#fff' } : {}),
              }}>{LABELS[i]}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--tx)', flex: 1 }}>{opt}</div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
        {!submitted ? (
          <>
            <button
              onClick={confirm}
              disabled={!sel || loading}
              style={{
                padding: '9px 20px', background: 'var(--lime)', color: '#060a0e',
                border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700,
                cursor: sel ? 'pointer' : 'default', opacity: sel ? 1 : .4,
                transition: 'opacity .13s, background .13s',
              }}
            >{loading ? 'Checking…' : 'Confirm'}</button>
            {onNext && (
              <button onClick={onNext} style={{
                padding: '9px 16px', background: 'none', color: 'var(--tx3)',
                border: '1px solid var(--line2)', borderRadius: 8, fontSize: 13.5,
                fontWeight: 500, cursor: 'pointer',
              }}>Skip</button>
            )}
          </>
        ) : onNext ? (
          <button onClick={onNext} style={{
            padding: '9px 20px', background: 'var(--sf3)', color: 'var(--tx)',
            border: '1px solid var(--line2)', borderRadius: 8, fontSize: 13.5,
            fontWeight: 600, cursor: 'pointer',
          }}>{idx + 1 < total ? 'Next →' : 'See Results'}</button>
        ) : null}

        {/* Save */}
        <button
          onClick={toggleSave}
          title="Bookmark (S)"
          style={{
            width: 34, height: 34, borderRadius: 7, fontSize: 15,
            border: `1px solid ${saved ? 'var(--lime)' : 'var(--line2)'}`,
            background: saved ? 'var(--lime-dim)' : 'var(--sf2)',
            color: saved ? 'var(--lime-dk)' : 'var(--tx3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >🔖</button>
      </div>

      {/* Result */}
      {submitted && result && (
        <div style={{
          borderRadius: 12, padding: '14px 17px', marginBottom: 18,
          background: result.isCorrect ? 'var(--g-bg)' : 'var(--r-bg)',
          border: `1px solid ${result.isCorrect ? 'var(--g-ln)' : 'var(--r-ln)'}`,
          animation: 'fadeUp .22s ease',
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 7,
            color: result.isCorrect ? 'var(--g-tx)' : 'var(--r-tx)',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{result.isCorrect ? '✓' : '✗'}</span>
            {result.isCorrect ? 'Correct!' : `Incorrect — correct answer is ${result.correct}`}
          </div>
          {result.explanation && (
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--tx2)' }}>{result.explanation}</div>
          )}
        </div>
      )}

      {/* Keyboard hints */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--tx4)' }}>
        <span>Shortcuts:</span>
        <span><kbd style={kbdStyle}>A</kbd>–<kbd style={kbdStyle}>D</kbd> select</span>
        <span><kbd style={kbdStyle}>Enter</kbd> confirm/next</span>
        {onNext && <span><kbd style={kbdStyle}>→</kbd> skip/next</span>}
        {onPrev && <span><kbd style={kbdStyle}>←</kbd> prev</span>}
        <span><kbd style={kbdStyle}>S</kbd> save</span>
      </div>
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  background: 'var(--sf2)', border: '1px solid var(--line2)',
  borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--mono)', fontSize: 11,
}