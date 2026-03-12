'use client'
// app/mistakes/page.tsx
import { useSession } from '@/lib/store/useSession'
import { sessionStore } from '@/lib/store/session'

const LABELS = ['A', 'B', 'C', 'D']

export default function MistakesPage() {
  const { answered } = useSession()
  const wrong = answered.filter(a => !a.isCorrect)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.4px' }}>Mistake Log</div>
        {wrong.length > 0 && (
          <span style={{ fontSize: 12.5, background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)', padding: '4px 12px', borderRadius: 100, fontWeight: 600 }}>
            {wrong.length} mistake{wrong.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 32 }}>Questions you answered incorrectly. Review them and understand why.</div>

      {wrong.length === 0 ? (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 13, padding: 48, textAlign: 'center', color: 'var(--tx3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx2)', marginBottom: 8 }}>No mistakes yet</div>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>Either you're doing great, or you haven't answered any questions yet.</p>
        </div>
      ) : wrong.map((q, i) => {
        const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d]
        const selIdx  = LABELS.indexOf(q.selectedAnswer)
        const corrIdx = LABELS.indexOf(q.correctAnswer)

        return (
          <div key={`${q.questionId}-${i}`} style={{ background: 'var(--sf)', border: '1px solid var(--r-ln)', borderLeft: '3px solid var(--r-tx)', borderRadius: 13, padding: '18px 20px', marginBottom: 10 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                background: /math/i.test(q.section) ? 'rgba(37,99,235,.14)' : 'rgba(124,58,237,.14)',
                color: /math/i.test(q.section) ? '#60a5fa' : '#a78bfa' }}>
                {/math/i.test(q.section) ? 'Math' : 'Reading & Writing'}
              </span>
              {q.domain && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--sf3)', color: 'var(--tx2)' }}>{q.domain}</span>}
              {q.difficulty && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)' }}>{q.difficulty}</span>}
            </div>

            {/* Question */}
            <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--tx)', marginBottom: 14 }}>{q.question_text}</div>

            {/* Your vs correct */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {selIdx >= 0 && (
                <div style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)' }}>
                  ✗ You chose: {q.selectedAnswer}) {opts[selIdx] || ''}
                </div>
              )}
              {corrIdx >= 0 && (
                <div style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, background: 'var(--g-bg)', color: 'var(--g-tx)', border: '1px solid var(--g-ln)' }}>
                  ✓ Correct: {q.correctAnswer}) {opts[corrIdx] || ''}
                </div>
              )}
            </div>

            {/* Explanation */}
            {q.explanation && (
              <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.65, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                {q.explanation}
              </div>
            )}

            {/* Save button */}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => sessionStore.toggleSaved(q)}
                style={{ fontSize: 12, color: 'var(--tx3)', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--line2)', background: 'var(--sf2)' }}>
                🔖 Save for review
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}