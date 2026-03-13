'use client'
// app/saved/page.tsx
import { useSession } from '@/lib/store/useSession'
import { sessionStore } from '@/lib/store/session'

const LABELS = ['A','B','C','D']

export default function SavedPage() {
  const { saved } = useSession()
  const items = Object.values(saved)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px' }}>Saved Questions</div>
          <div style={{ fontSize: 14, color: 'var(--tx3)', marginTop: 3 }}>
            Questions you bookmarked while practicing.
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
              Press <kbd style={kbdStyle}>S</kbd> while on a question to save it.
            </span>
          </div>
        </div>
        {items.length > 0 && (
          <span style={{ fontSize: 12, background: 'var(--lime-dim)', color: 'var(--lime-dk)', border: '1px solid rgba(163,230,53,.25)', padding: '4px 11px', borderRadius: 100, fontWeight: 600, flexShrink: 0 }}>
            {items.length} saved
          </span>
        )}
      </div>

      <div style={{ marginBottom: 28 }} />

      {items.length === 0 ? (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: 52, textAlign: 'center', color: 'var(--tx3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--tx4)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx2)', marginBottom: 8 }}>No saved questions</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.65, maxWidth: 280, margin: '0 auto 20px' }}>
            While practicing, click the bookmark icon or press <kbd style={kbdStyle}>S</kbd> after answering to save a question.
          </p>
          <a href="/bank" style={{ display: 'inline-block', padding: '9px 22px', background: 'var(--lime)', color: '#060a0e', borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Start Practicing →
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(q => {
            const isMath = /math/i.test(q.section)
            const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d]
            const corrIdx = LABELS.indexOf(q.correctAnswer)
            return (
              <div key={q.questionId} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px' }}>
                {/* Badges */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 11 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                    background: isMath ? 'rgba(37,99,235,.14)' : 'rgba(124,58,237,.14)',
                    color: isMath ? '#60a5fa' : '#a78bfa' }}>
                    {isMath ? 'Math' : 'Reading & Writing'}
                  </span>
                  {q.domain && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--sf3)', color: 'var(--tx2)' }}>{q.domain}</span>}
                  {q.difficulty && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--sf3)', color: 'var(--tx3)' }}>{q.difficulty}</span>}
                </div>

                {/* Question text */}
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--tx)', marginBottom: 12 }}>
                  {q.question_text.length > 240 ? q.question_text.slice(0, 240) + '…' : q.question_text}
                </div>

                {/* Correct answer */}
                {corrIdx >= 0 && opts[corrIdx] && (
                  <div style={{ fontSize: 12.5, color: 'var(--g-tx)', background: 'var(--g-bg)', border: '1px solid var(--g-ln)', borderRadius: 8, padding: '6px 12px', marginBottom: 12, display: 'inline-block' }}>
                    ✓ {q.correctAnswer}) {opts[corrIdx]}
                  </div>
                )}

                {/* Your result */}
                {q.isCorrect !== undefined && (
                  <div style={{ fontSize: 12, color: q.isCorrect ? 'var(--g-tx)' : 'var(--r-tx)', fontWeight: 600, marginBottom: 10 }}>
                    {q.isCorrect ? 'You answered this correctly' : `You answered ${q.selectedAnswer} — was wrong`}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.65, borderTop: '1px solid var(--line)', paddingTop: 11, marginBottom: 12 }}>
                    {q.explanation}
                  </div>
                )}

                {/* Remove */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => sessionStore.toggleSaved(q)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--r-tx)', cursor: 'pointer', padding: '5px 12px', borderRadius: 7, border: '1px solid var(--r-ln)', background: 'var(--r-bg)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Remove
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

const kbdStyle: React.CSSProperties = {
  background: 'var(--sf2)', border: '1px solid var(--line2)', borderRadius: 4,
  padding: '1px 6px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tx2)',
}
