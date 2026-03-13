'use client'
// app/tests/run/page.tsx — full exam UI with question navigator + timer
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Question } from '@/lib/types'
import { MathText } from '@/components/MathText'
import { sessionStore } from '@/lib/store/session'

const LABELS = ['A','B','C','D']

function fmt(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

export default function TestRunPage() {
  const router = useRouter()
  const [qs, setQs]         = useState<Question[]>([])
  const [idx, setIdx]       = useState(0)
  const [title, setTitle]   = useState('Practice Test')
  const [timerSec, setTimerSec]   = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [answers, setAnswers]     = useState<Record<number, string>>({})    // idx → letter
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({})  // idx → submitted?
  const [sel, setSel]       = useState<string | null>(null)
  const [done, setDone]     = useState(false)
  const [showNav, setShowNav] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('nexus_test_qs')
    const t   = sessionStorage.getItem('nexus_test_type')
    const sec = sessionStorage.getItem('nexus_test_timer')
    if (!raw) { router.push('/tests'); return }
    const parsed = JSON.parse(raw) as Question[]
    setQs(parsed)
    if (t) setTitle(t)
    if (sec && sec !== '') {
      const s = parseInt(sec)
      setTimerSec(s)
      setRemaining(s)
    }
  }, [router])

  // Countdown
  useEffect(() => {
    if (remaining === null || done) return
    if (remaining <= 0) { setDone(true); return }
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r === null || r <= 1) { clearInterval(timerRef.current!); setDone(true); return 0 }
        return r - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [remaining === null, done]) // only re-run when timer starts or done changes

  const goTo = (i: number) => {
    setIdx(i)
    setSel(answers[i] ?? null)
    setShowNav(false)
  }

  const selectAnswer = (letter: string) => {
    if (submitted[idx]) return
    setSel(letter)
    setAnswers(prev => ({ ...prev, [idx]: letter }))
  }

  const confirmAnswer = useCallback(() => {
    if (!sel || submitted[idx] || !qs[idx]) return
    const q = qs[idx]
    const isCorrect = sel === q.correct_answer
    setSubmitted(prev => ({ ...prev, [idx]: true }))
    sessionStore.addAnswer({
      questionId: q.id, section: q.section, domain: q.domain || '',
      skill: q.skill || '', difficulty: q.difficulty || '',
      selectedAnswer: sel, correctAnswer: q.correct_answer, isCorrect,
      explanation: q.explanation || '', question_text: q.question_text,
      choice_a: q.choice_a, choice_b: q.choice_b, choice_c: q.choice_c, choice_d: q.choice_d,
    })
  }, [sel, submitted, qs, idx])

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (done) return
      const map: Record<string,string> = {a:'A',b:'B',c:'C',d:'D'}
      if (!submitted[idx] && map[e.key.toLowerCase()]) { selectAnswer(map[e.key.toLowerCase()]); return }
      if (e.key === 'Enter') {
        if (!submitted[idx] && sel) confirmAnswer()
        else if (submitted[idx] && idx < qs.length - 1) goTo(idx + 1)
      }
      if (e.key === 'ArrowRight' && submitted[idx]) goTo(Math.min(qs.length-1, idx+1))
      if (e.key === 'ArrowLeft') goTo(Math.max(0, idx-1))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [submitted, sel, idx, qs, done, confirmAnswer])

  // Compute results
  const totalAnswered  = Object.keys(submitted).length
  const totalCorrect   = Object.entries(submitted).filter(([i]) => {
    const q = qs[parseInt(i)]
    return q && answers[parseInt(i)] === q.correct_answer
  }).length
  const totalWrong     = totalAnswered - totalCorrect
  const scorePct       = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  // ── RESULTS SCREEN ──────────────────────────────────────
  if (done) {
    const elapsed = timerSec ? timerSec - (remaining ?? 0) : 0
    return (
      <div style={{ minHeight: 'calc(100dvh - var(--nav-h))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 22, padding: '44px 32px', maxWidth: 480, width: '100%', textAlign: 'center', animation: 'fadeUp .3s ease' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>
            {scorePct >= 80 ? '🎉' : scorePct >= 60 ? '💪' : '📚'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, letterSpacing: '-.5px' }}>Test complete!</div>
          <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 28 }}>{title}</div>

          {/* Score */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 64, fontWeight: 900, lineHeight: 1, marginBottom: 6, color: scorePct >= 80 ? 'var(--g-tx)' : scorePct >= 60 ? 'var(--a-tx)' : 'var(--r-tx)' }}>
            {scorePct}%
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 24, marginTop: 8 }}>
            {[
              { label: 'Correct',  value: totalCorrect,                color: 'var(--g-tx)' },
              { label: 'Wrong',    value: totalWrong,                  color: 'var(--r-tx)' },
              { label: 'Skipped',  value: qs.length - totalAnswered,   color: 'var(--tx3)'  },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--tx4)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {timerSec && elapsed > 0 && (
            <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 24 }}>Time used: {fmt(elapsed)}</div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/stats')}
              style={{ padding: '11px 24px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              View stats →
            </button>
            <button onClick={() => router.push('/tests')}
              style={{ padding: '11px 20px', background: 'var(--sf3)', color: 'var(--tx)', border: '1px solid var(--line2)', borderRadius: 11, fontSize: 14, cursor: 'pointer' }}>
              New test
            </button>
            <button onClick={() => router.push('/mistakes')}
              style={{ padding: '11px 20px', background: 'none', color: 'var(--tx3)', border: '1px solid var(--line2)', borderRadius: 11, fontSize: 14, cursor: 'pointer' }}>
              Review mistakes
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!qs.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100dvh - var(--nav-h))', flexDirection: 'column', gap: 14, color: 'var(--tx3)' }}>
      <div className="spinner" /><span style={{ fontSize: 13 }}>Loading test…</span>
    </div>
  )

  const q       = qs[idx]
  const total   = qs.length
  const opts    = [q.choice_a, q.choice_b, q.choice_c, q.choice_d]
  const corrIdx = LABELS.indexOf(q.correct_answer)
  const isSubmitted = !!submitted[idx]
  const timeWarn    = remaining !== null && remaining < 300

  const choiceStyle = (i: number): React.CSSProperties => {
    const curSel = answers[idx]
    if (!isSubmitted) {
      const isSel = curSel === LABELS[i]
      return { borderColor: isSel ? 'var(--lime)' : 'var(--line)', background: isSel ? 'var(--lime-dim)' : 'var(--sf)', opacity: 1 }
    }
    if (i === corrIdx) return { borderColor: 'var(--g-tx)', background: 'var(--g-bg)', opacity: 1 }
    if (LABELS[i] === curSel) return { borderColor: 'var(--r-tx)', background: 'var(--r-bg)', opacity: 1 }
    return { borderColor: 'var(--line)', background: 'var(--sf)', opacity: 0.25 }
  }
  const labelStyle = (i: number): React.CSSProperties => {
    const curSel = answers[idx]
    if (!isSubmitted && curSel === LABELS[i]) return { background: 'var(--lime)', color: '#060a0e', borderColor: 'var(--lime)' }
    if (isSubmitted && i === corrIdx) return { background: 'var(--g-tx)', color: '#fff', borderColor: 'var(--g-tx)' }
    if (isSubmitted && LABELS[i] === curSel) return { background: 'var(--r-tx)', color: '#fff', borderColor: 'var(--r-tx)' }
    return { background: 'transparent', color: 'var(--tx3)', borderColor: 'var(--line2)' }
  }

  // Question nav dot color
  const dotColor = (i: number) => {
    if (submitted[i]) {
      const correct = answers[i] === qs[i]?.correct_answer
      return correct ? 'var(--g-tx)' : 'var(--r-tx)'
    }
    if (answers[i]) return 'var(--a-tx)' // selected but not submitted
    return 'var(--sf3)'
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100dvh - var(--nav-h))', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── EXAM HEADER ────────────────────────────────── */}
      <div style={{ height: 50, borderBottom: '1px solid var(--line)', background: 'var(--sf)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        <button onClick={() => { if (window.confirm('Exit test? Progress will be saved to your stats.')) router.push('/tests') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--tx3)', border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Exit
        </button>

        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--tx2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>

        {/* Timer */}
        {remaining !== null && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800, color: timeWarn ? 'var(--r-tx)' : 'var(--tx)', flexShrink: 0, padding: '5px 11px', borderRadius: 8, background: timeWarn ? 'var(--r-bg)' : 'var(--sf2)', border: `1px solid ${timeWarn ? 'var(--r-ln)' : 'var(--line2)'}`, animation: timeWarn ? 'pulse 1s ease infinite' : 'none' }}>
            {fmt(remaining)}
          </div>
        )}

        {/* Question count + nav toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--tx3)' }}>{idx+1}/{total}</span>
          <button onClick={() => setShowNav(o => !o)}
            style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--line2)', background: showNav ? 'var(--lime-dim)' : 'var(--sf2)', color: showNav ? 'var(--lime-dk)' : 'var(--tx3)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            {showNav ? 'Close' : 'Navigator'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--sf3)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: 'var(--lime)', width: `${((idx+1)/total)*100}%`, transition: 'width .3s' }} />
      </div>

      {/* ── BODY ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Question navigator panel */}
        {showNav && (
          <div style={{ width: 220, borderRight: '1px solid var(--line)', background: 'var(--sf)', padding: '16px 12px', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>Questions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
              {qs.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  style={{ width: 32, height: 32, borderRadius: 7, border: `1.5px solid ${i === idx ? 'var(--lime)' : 'var(--line2)'}`, background: i === idx ? 'var(--lime-dim)' : dotColor(i) === 'var(--sf3)' ? 'var(--sf3)' : dotColor(i) + '22', color: i === idx ? 'var(--lime-dk)' : dotColor(i), fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {i+1}
                </button>
              ))}
            </div>
            {/* Legend */}
            {[
              { color: 'var(--g-tx)', label: 'Correct' },
              { color: 'var(--r-tx)', label: 'Wrong' },
              { color: 'var(--a-tx)', label: 'Selected' },
              { color: 'var(--sf3)', label: 'Unanswered' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, fontSize: 12, color: 'var(--tx3)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }} />{l.label}
              </div>
            ))}
            <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <button onClick={() => setDone(true)}
                style={{ width: '100%', padding: '9px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                Submit test
              </button>
            </div>
          </div>
        )}

        {/* Question scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div key={`${q.id}-${idx}`} style={{ maxWidth: 780, padding: '24px 22px 80px', animation: 'fadeUp .18s ease' }}>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: /math/i.test(q.section) ? 'rgba(37,99,235,.14)' : 'rgba(124,58,237,.14)', color: /math/i.test(q.section) ? '#60a5fa' : '#a78bfa' }}>
                {/math/i.test(q.section) ? 'Math' : 'Reading & Writing'}
              </span>
              {q.domain && <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--sf3)', color: 'var(--tx2)' }}>{q.domain}</span>}
              {q.difficulty && (
                <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid currentColor', background: 'transparent', color: q.difficulty === 'easy' ? 'var(--g-tx)' : q.difficulty === 'hard' ? 'var(--r-tx)' : 'var(--a-tx)' }}>
                  {q.difficulty}
                </span>
              )}
            </div>

            {/* Passage */}
            {q.passage_text && (
              <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderLeft: '3px solid var(--lime-dk)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--lime-dk)', marginBottom: 10 }}>Passage</div>
                <MathText text={q.passage_text} style={{ fontSize: 13.5, lineHeight: 1.85, color: 'var(--tx2)' }} />
              </div>
            )}

            {/* Question */}
            <MathText text={q.question_text} style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--tx)', marginBottom: 22 }} />

            {/* Choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {opts.map((opt, i) => {
                if (!opt) return null
                const cs = choiceStyle(i); const ls = labelStyle(i)
                return (
                  <div key={i} onClick={() => selectAnswer(LABELS[i])}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 15px', borderRadius: 12, border: `1.5px solid ${cs.borderColor}`, background: cs.background as string, cursor: isSubmitted ? 'default' : 'pointer', opacity: cs.opacity, transition: 'border-color .12s, background .12s' }}>
                    <div style={{ width: 27, height: 27, borderRadius: '50%', border: `1.5px solid ${ls.borderColor}`, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--mono)', background: ls.background as string, color: ls.color as string, marginTop: 1 }}>{LABELS[i]}</div>
                    <MathText text={opt} style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--tx)', flex: 1, paddingTop: 2 }} />
                  </div>
                )
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {!isSubmitted ? (
                <>
                  <button onClick={confirmAnswer} disabled={!sel}
                    style={{ padding: '10px 22px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: sel ? 'pointer' : 'default', opacity: sel ? 1 : .38 }}>
                    Confirm
                  </button>
                  <button onClick={() => goTo(Math.min(total-1, idx+1))}
                    style={{ padding: '10px 16px', background: 'none', color: 'var(--tx3)', border: '1px solid var(--line2)', borderRadius: 10, fontSize: 13.5, cursor: 'pointer' }}>
                    Skip →
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  {idx > 0 && (
                    <button onClick={() => goTo(idx-1)}
                      style={{ padding: '10px 16px', background: 'none', color: 'var(--tx3)', border: '1px solid var(--line2)', borderRadius: 10, fontSize: 13.5, cursor: 'pointer' }}>
                      ← Prev
                    </button>
                  )}
                  {idx < total-1 ? (
                    <button onClick={() => goTo(idx+1)}
                      style={{ padding: '10px 22px', background: 'var(--sf3)', color: 'var(--tx)', border: '1px solid var(--line2)', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Next →
                    </button>
                  ) : (
                    <button onClick={() => setDone(true)}
                      style={{ padding: '10px 22px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      Finish test →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Explanation */}
            {isSubmitted && (
              <div style={{ borderRadius: 13, padding: '15px 18px', marginBottom: 18, background: answers[idx] === q.correct_answer ? 'var(--g-bg)' : 'var(--r-bg)', border: `1px solid ${answers[idx] === q.correct_answer ? 'var(--g-ln)' : 'var(--r-ln)'}`, animation: 'fadeUp .2s ease' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 7, color: answers[idx] === q.correct_answer ? 'var(--g-tx)' : 'var(--r-tx)' }}>
                  {answers[idx] === q.correct_answer ? '✓ Correct!' : `✗ Incorrect — correct answer is ${q.correct_answer}`}
                </div>
                {q.explanation && <MathText text={q.explanation} style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--tx2)' }} />}
              </div>
            )}

            {/* Keyboard hints */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--tx4)' }}>
              {[['A–D','select'],['Enter','confirm'],['→','next'],['←','prev']].map(([k,v]) => (
                <span key={k}>
                  <kbd style={{ background: 'var(--sf2)', border: '1px solid var(--line2)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--mono)', fontSize: 10.5 }}>{k}</kbd> {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
