'use client'
// app/saved/page.tsx
import { useSession } from '@/lib/store/useSession'
import { sessionStore } from '@/lib/store/session'

export default function SavedPage() {
  const { saved } = useSession()
  const items = Object.values(saved)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px 60px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.4px', marginBottom: 4 }}>Saved Questions</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 32 }}>
        Questions you bookmarked while practicing. Press 🔖 or <kbd style={kbdStyle}>S</kbd> while on a question to save it.
      </div>

      {items.length === 0 ? (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 13, padding: 48, textAlign: 'center', color: 'var(--tx3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx2)', marginBottom: 8 }}>No saved questions yet</div>
          <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
            While practicing in the Question Bank, click the 🔖 button or press <kbd style={kbdStyle}>S</kbd> to bookmark a question.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(q => (
            <div key={q.questionId} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 13, padding: '18px 20px' }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                  background: /math/i.test(q.section) ? 'rgba(37,99,235,.14)' : 'rgba(124,58,237,.14)',
                  color: /math/i.test(q.section) ? '#60a5fa' : '#a78bfa' }}>
                  {/math/i.test(q.section) ? 'Math' : 'Reading & Writing'}
                </span>
                {q.domain && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--sf3)', color: 'var(--tx2)' }}>{q.domain}</span>}
                {q.difficulty && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--sf3)', color: 'var(--tx3)' }}>{q.difficulty}</span>}
              </div>

              {/* Question text */}
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--tx)', marginBottom: 12 }}>
                {q.question_text.slice(0, 200)}{q.question_text.length > 200 ? '…' : ''}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
                  Correct answer: <strong style={{ color: 'var(--lime-dk)' }}>{q.correctAnswer}</strong>
                  {q.isCorrect !== undefined && (
                    <span style={{ marginLeft: 10, color: q.isCorrect ? 'var(--g-tx)' : 'var(--r-tx)', fontWeight: 600 }}>
                      {q.isCorrect ? '✓ You got this right' : '✗ You got this wrong'}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => sessionStore.toggleSaved(q)}
                  style={{ fontSize: 12, color: 'var(--r-tx)', cursor: 'pointer', padding: '3px 8px', borderRadius: 5, border: 'none', background: 'none' }}
                >✕ Remove</button>
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--tx3)', lineHeight: 1.6, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  background: 'var(--sf2)', border: '1px solid var(--line2)', borderRadius: 4,
  padding: '1px 5px', fontFamily: 'var(--mono)', fontSize: 11,
}