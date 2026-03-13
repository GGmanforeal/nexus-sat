'use client'
// app/mistakes/page.tsx — with delete individual + clear all
import { useSession } from '@/lib/store/useSession'
import { sessionStore, AnswerLog } from '@/lib/store/session'
import { useState } from 'react'

const LABELS = ['A', 'B', 'C', 'D']

export default function MistakesPage() {
  const { answered } = useSession()
  const wrong = answered.filter(a => !a.isCorrect)
  const [deleted, setDeleted] = useState<Set<string>>(new Set())

  const visible = wrong.filter(q => !deleted.has(q.questionId))

  const deleteOne = (id: string) => {
    setDeleted(prev => new Set([...prev, id]))
    sessionStore.deleteMistake(id)
  }

  const clearAll = () => {
    if (!confirm(`Remove all ${visible.length} mistakes? This cannot be undone.`)) return
    visible.forEach(q => sessionStore.deleteMistake(q.questionId))
    setDeleted(new Set(wrong.map(q => q.questionId)))
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px' }}>Mistake Log</div>
          <div style={{ fontSize: 14, color: 'var(--tx3)', marginTop: 3 }}>
            Questions you answered incorrectly — review and understand them.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {visible.length > 0 && (
            <>
              <span style={{ fontSize: 12, background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)', padding: '4px 11px', borderRadius: 100, fontWeight: 600 }}>
                {visible.length} mistake{visible.length !== 1 ? 's' : ''}
              </span>
              <button onClick={clearAll}
                style={{ fontSize: 12.5, padding: '6px 13px', borderRadius: 8, background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)', cursor: 'pointer', fontWeight: 600 }}>
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 28 }} />

      {visible.length === 0 ? (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: 52, textAlign: 'center', color: 'var(--tx3)' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx2)', marginBottom: 8 }}>No mistakes</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>
            {wrong.length > 0 ? "You've cleared all your mistakes — great work!" : "Either you're doing great, or you haven't answered any questions yet."}
          </p>
          {wrong.length === 0 && (
            <a href="/bank" style={{ display: 'inline-block', marginTop: 18, padding: '9px 22px', background: 'var(--lime)', color: '#060a0e', borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Start Practicing →</a>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((q, i) => {
            const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d]
            const selIdx  = LABELS.indexOf(q.selectedAnswer)
            const corrIdx = LABELS.indexOf(q.correctAnswer)
            const isMath  = /math/i.test(q.section)

            return (
              <div key={`${q.questionId}-${i}`} style={{
                background: 'var(--sf)', border: '1px solid var(--r-ln)',
                borderLeft: '3px solid var(--r-tx)', borderRadius: 14, padding: '18px 20px',
                animation: 'fadeUp .18s ease',
              }}>
                {/* Top row: badges + delete */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 11 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                      background: isMath ? 'rgba(37,99,235,.14)' : 'rgba(124,58,237,.14)',
                      color: isMath ? '#60a5fa' : '#a78bfa' }}>
                      {isMath ? 'Math' : 'Reading & Writing'}
                    </span>
                    {q.domain && (
                      <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--sf3)', color: 'var(--tx2)' }}>{q.domain}</span>
                    )}
                    {q.difficulty && (
                      <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)' }}>{q.difficulty}</span>
                    )}
                  </div>
                  <button onClick={() => deleteOne(q.questionId)}
                    title="Remove this mistake"
                    style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 7, border: '1px solid var(--line2)', background: 'var(--sf2)', color: 'var(--tx3)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>

                {/* Question */}
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--tx)', marginBottom: 14 }}>
                  {q.question_text}
                </div>

                {/* Your answer vs correct */}
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 12 }}>
                  {selIdx >= 0 && (
                    <div style={{ padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)' }}>
                      ✗ You chose: {q.selectedAnswer}) {opts[selIdx] || ''}
                    </div>
                  )}
                  {corrIdx >= 0 && (
                    <div style={{ padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, background: 'var(--g-bg)', color: 'var(--g-tx)', border: '1px solid var(--g-ln)' }}>
                      ✓ Correct: {q.correctAnswer}) {opts[corrIdx] || ''}
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                    {q.explanation}
                  </div>
                )}

                {/* Save for review */}
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => sessionStore.toggleSaved(q)}
                    style={{ fontSize: 12, color: 'var(--lime-dk)', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--line2)', background: 'var(--sf2)' }}>
                    Bookmark
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
