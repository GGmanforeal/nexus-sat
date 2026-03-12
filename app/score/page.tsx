'use client'
// app/score/page.tsx
import { useScore, useStats } from '@/lib/store/useSession'

export default function ScorePage() {
  const { rw, math, total } = useScore()
  const { bySection } = useStats()
  const secEn   = bySection['English']
  const secMath = bySection['Math']
  const enCount   = secEn?.total   || 0
  const mathCount = secMath?.total || 0
  const THRESHOLD = 10

  const barW = (score: number | null) => score ? `${((score - 200) / 600) * 100}%` : '0%'

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '36px 28px 60px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.4px', marginBottom: 4 }}>Score Predictor</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 32 }}>Estimated SAT score based on your practice accuracy. Answer {THRESHOLD}+ questions per section to unlock.</div>

      {/* Big score */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 20, padding: 36, textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 72, fontWeight: 700, lineHeight: 1, color: total ? 'var(--lime)' : 'var(--tx4)' }}>{total || '—'}</div>
        <div style={{ fontSize: 14, color: 'var(--tx3)', marginTop: 6 }}>
          {total ? `Estimated range: ${Math.max(400, total - 60)}–${Math.min(1600, total + 60)}` : `Answer ${THRESHOLD}+ questions per section for a prediction`}
        </div>
      </div>

      {/* Section bars */}
      {[
        { label: 'Reading & Writing', score: rw, count: enCount },
        { label: 'Math',              score: math, count: mathCount },
      ].map(({ label, score, count }) => (
        <div key={label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 13, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--tx3)', marginBottom: 10 }}>
            <span>{label}</span>
            <span style={{ fontFamily: 'var(--mono)' }}>{score ? `${score} / 800` : `${count}/${THRESHOLD} questions`}</span>
          </div>
          <div style={{ height: 10, background: 'var(--sf3)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 5, background: score ? 'linear-gradient(90deg, var(--lime-dim), var(--lime))' : 'var(--sf3)', width: score ? barW(score) : `${(count / THRESHOLD) * 100}%`, transition: 'width .8s ease' }} />
          </div>
          {!score && count > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--tx4)', marginTop: 6 }}>{THRESHOLD - count} more questions needed</div>
          )}
        </div>
      ))}

      {/* Methodology note */}
      <div style={{ background: 'var(--sf2)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', fontSize: 12.5, color: 'var(--tx3)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--tx2)' }}>How this works:</strong> Each section uses a linear model mapping 0% accuracy → 200 points and 100% accuracy → 800 points. This is an approximation — your actual score depends on question difficulty and the adaptive algorithm.
      </div>
    </div>
  )
}