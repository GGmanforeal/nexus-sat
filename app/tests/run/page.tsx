'use client'
// app/tests/run/page.tsx — with KaTeX math + countdown timer
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Question } from '@/lib/types'
import { MathText } from '@/components/MathText'

const LABELS = ['A','B','C','D']

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function TestRunPage() {
  const router = useRouter()
  const [qs, setQs]         = useState<Question[]>([])
  const [idx, setIdx]       = useState(0)
  const [title, setTitle]   = useState('Practice Test')
  const [timerSec, setTimerSec] = useState<number | null>(null)
  const [elapsed, setElapsed]   = useState(0)
  const [sel, setSel]       = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect]   = useState(0)
  const [wrong, setWrong]       = useState(0)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('nexus_test_qs')
    const t   = sessionStorage.getItem('nexus_test_type')
    const sec = sessionStorage.getItem('nexus_test_timer')
    if (!raw) { router.push('/tests'); return }
    setQs(JSON.parse(raw))
    if (t) setTitle(t)
    if (sec) setTimerSec(parseInt(sec))
  }, [router])

  // Countdown timer
  useEffect(() => {
    if (!timerSec) return
    const id = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= timerSec) { clearInterval(id); setDone(true); return timerSec }
        return e + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerSec])

  const goTo = (i: number) => { setIdx(i); setSel(null); setSubmitted(false) }

  const confirm = useCallback(() => {
    if (!sel || submitted || !qs[idx]) return
    const isCorrect = sel === qs[idx].correct_answer
    setSubmitted(true)
    if (isCorrect) setCorrect(c => c + 1); else setWrong(c => c + 1)
  }, [sel, submitted, qs, idx])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const map: Record<string,string> = {a:'A',b:'B',c:'C',d:'D'}
      if (!submitted && map[e.key.toLowerCase()]) { setSel(map[e.key.toLowerCase()]); return }
      if (e.key === 'Enter') { if (!submitted && sel) confirm(); else if (submitted) { if (idx + 1 < qs.length) goTo(idx + 1); else setDone(true) } }
      if (e.key === 'ArrowRight' && submitted) { if (idx + 1 < qs.length) goTo(idx + 1); else setDone(true) }
      if (e.key === 'ArrowLeft' && idx > 0) goTo(idx - 1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [submitted, sel, idx, qs, confirm])

  if (!qs.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--nav-h))', flexDirection: 'column', gap: 14, color: 'var(--tx3)' }}>
      <div className="spinner" /><span>Loading test…</span>
    </div>
  )

  if (done) {
    const total = qs.length
    const answered = correct + wrong
    const pct = answered ? Math.round((correct / answered) * 100) : 0
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--nav-h))' }}>
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 20, padding: '44px 40px', textAlign: 'center', maxWidth: 420, width: '100%', animation: 'fadeUp .3s ease' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{pct >= 80 ? '🎉' : pct >= 60 ? '📚' : '💪'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Test Complete!</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
            <Stat label="Score" value={`${pct}%`} color={pct >= 80 ? 'var(--g-tx)' : pct >= 60 ? 'var(--a-tx)' : 'var(--r-tx)'} />
            <Stat label="Correct" value={String(correct)} color="var(--g-tx)" />
            <Stat label="Wrong" value={String(wrong)} color="var(--r-tx)" />
            <Stat label="Skipped" value={String(total - answered)} color="var(--tx3)" />
          </div>
          {timerSec && <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 24 }}>Time: {fmt(elapsed)}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => router.push('/stats')} style={{ padding: '11px 22px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>View Stats →</button>
            <button onClick={() => router.push('/tests')} style={{ padding: '11px 22px', background: 'var(--sf3)', color: 'var(--tx)', border: '1px solid var(--line2)', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>New Test</button>
          </div>
        </div>
      </div>
    )
  }

  const q = qs[idx]
  const total = qs.length
  const pct = Math.round((idx / total) * 100)
  const opts = [q.choice_a, q.choice_b, q.choice_c, q.choice_d]
  const corrIdx = LABELS.indexOf(q.correct_answer)
  const timeLeft = timerSec ? timerSec - elapsed : null
  const timeWarn = timeLeft !== null && timeLeft < 300 // < 5 min

  const choiceStyle = (i: number): React.CSSProperties => {
    if (!submitted) {
      const isSel = sel === LABELS[i]
      return { borderColor: isSel ? 'var(--lime)' : 'var(--line)', background: isSel ? 'var(--lime-dim)' : 'var(--sf)', opacity: 1 }
    }
    if (i === corrIdx) return { borderColor: 'var(--g-tx)', background: 'var(--g-bg)', opacity: 1 }
    if (LABELS[i] === sel) return { borderColor: 'var(--r-tx)', background: 'var(--r-bg)', opacity: 1 }
    return { borderColor: 'var(--line)', background: 'var(--sf)', opacity: 0.28 }
  }
  const labelStyle = (i: number): React.CSSProperties => {
    if (!submitted && sel === LABELS[i]) return { background: 'var(--lime)', color: '#060a0e', borderColor: 'var(--lime)' }
    if (submitted && i === corrIdx) return { background: 'var(--g-tx)', color: '#fff', borderColor: 'var(--g-tx)' }
    if (submitted && LABELS[i] === sel) return { background: 'var(--r-tx)', color: '#fff', borderColor: 'var(--r-tx)' }
    return { background: 'transparent', color: 'var(--tx3)', borderColor: 'var(--line2)' }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--line)', background: 'var(--sf)', padding: '0 24px', height: 46, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => { const ok = window.confirm('Exit test? Progress will be lost.'); if (ok) router.push('/tests') }}
          style={{ fontSize: 12, color: 'var(--tx3)', border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>← Exit</button>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--tx2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {timeLeft !== null && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: timeWarn ? 'var(--r-tx)' : 'var(--tx2)', flexShrink: 0, padding: '4px 10px', borderRadius: 7, background: timeWarn ? 'var(--r-bg)' : 'var(--sf2)', border: `1px solid ${timeWarn ? 'var(--r-ln)' : 'var(--line2)'}` }}>
            {fmt(timeLeft)}
          </div>
        )}
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--tx3)', flexShrink: 0 }}>{idx + 1} / {total}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--sf3)' }}>
        <div style={{ height: '100%', background: 'var(--lime)', width: `${pct}%`, transition: 'width .35s' }} />
      </div>

      {/* Question body */}
      <div style={{ padding: '28px 30px 60px', animation: 'fadeUp .2s ease' }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: /math/i.test(q.section) ? 'rgba(37,99,235,.14)' : 'rgba(124,58,237,.14)', color: /math/i.test(q.section) ? '#60a5fa' : '#a78bfa' }}>
            {/math/i.test(q.section) ? 'Math' : 'Reading & Writing'}
          </span>
          {q.domain && <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--sf3)', color: 'var(--tx2)' }}>{q.domain}</span>}
          {q.difficulty && <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'transparent', border: '1px solid currentColor', color: q.difficulty === 'easy' ? 'var(--g-tx)' : q.difficulty === 'hard' ? 'var(--r-tx)' : 'var(--a-tx)' }}>{q.difficulty}</span>}
        </div>

        {/* Passage */}
        {q.passage_text && (
          <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderLeft: '3px solid var(--lime-dk)', borderRadius: 12, padding: '16px 20px', marginBottom: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--lime-dk)', marginBottom: 10 }}>Passage</div>
            <MathText text={q.passage_text} style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--tx2)' }} />
          </div>
        )}

        {/* Question */}
        <MathText text={q.question_text} style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--tx)', marginBottom: 24 }} />

        {/* Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
          {opts.map((opt, i) => {
            if (!opt) return null
            const cs = choiceStyle(i)
            const ls = labelStyle(i)
            return (
              <div key={i} onClick={() => !submitted && setSel(LABELS[i])}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${cs.borderColor}`, background: cs.background as string, cursor: submitted ? 'default' : 'pointer', opacity: cs.opacity, transition: 'border-color .13s, background .13s' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${ls.borderColor}`, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--mono)', background: ls.background as string, color: ls.color as string, marginTop: 1 }}>{LABELS[i]}</div>
                <MathText text={opt} style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--tx)', flex: 1, paddingTop: 3 }} />
              </div>
            )
          })}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {!submitted ? (
            <>
              <button onClick={confirm} disabled={!sel}
                style={{ padding: '10px 22px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: sel ? 'pointer' : 'default', opacity: sel ? 1 : .4 }}>
                Confirm
              </button>
              <button onClick={() => { if (idx + 1 < total) goTo(idx + 1); else setDone(true) }}
                style={{ padding: '10px 18px', background: 'none', color: 'var(--tx3)', border: '1px solid var(--line2)', borderRadius: 9, fontSize: 14, cursor: 'pointer' }}>
                Skip
              </button>
            </>
          ) : (
            <button onClick={() => { if (idx + 1 < total) goTo(idx + 1); else setDone(true) }}
              style={{ padding: '10px 22px', background: 'var(--sf3)', color: 'var(--tx)', border: '1px solid var(--line2)', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {idx + 1 < total ? 'Next →' : 'See Results →'}
            </button>
          )}
        </div>

        {/* Result */}
        {submitted && (
          <div style={{ borderRadius: 13, padding: '16px 19px', marginBottom: 20, background: sel === q.correct_answer ? 'var(--g-bg)' : 'var(--r-bg)', border: `1px solid ${sel === q.correct_answer ? 'var(--g-ln)' : 'var(--r-ln)'}`, animation: 'fadeUp .22s ease' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: sel === q.correct_answer ? 'var(--g-tx)' : 'var(--r-tx)' }}>
              {sel === q.correct_answer ? '✓  Correct!' : `✗  Incorrect — correct answer is ${q.correct_answer}`}
            </div>
            {q.explanation && <MathText text={q.explanation} style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--tx2)' }} />}
          </div>
        )}

        {/* Keyboard hints */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--tx4)' }}>
          {[['A–D','select'],['Enter','confirm/next'],['→','next'],['←','prev']].map(([k,v]) => (
            <span key={k}><kbd style={{ background: 'var(--sf2)', border: '1px solid var(--line2)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--mono)', fontSize: 11 }}>{k}</kbd> {v}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>{label}</div>
    </div>
  )
}