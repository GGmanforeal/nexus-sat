'use client'
// app/score/page.tsx — score predictor
import { useScore, useStats } from '@/lib/store/useSession'
import Link from 'next/link'

const THRESHOLD = 10

function ScoreBar({ score, count, color }: { score: number | null; count: number; color: string }) {
  const fill = score
    ? ((score - 200) / 600) * 100
    : Math.min(100, (count / THRESHOLD) * 100)
  return (
    <div style={{ height: 8, background: 'var(--sf3)', borderRadius: 5, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 5, width: `${fill}%`,
        background: score ? color : 'var(--tx4)',
        transition: 'width .8s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  )
}

export default function ScorePage() {
  const { rw, math, total } = useScore()
  const { bySection } = useStats()
  const secEn   = bySection['English']
  const secMath = bySection['Math']
  const enCount   = secEn?.total   || 0
  const mathCount = secMath?.total || 0

  const totalColor = total
    ? total >= 1400 ? 'var(--g-tx)' : total >= 1100 ? 'var(--a-tx)' : 'var(--r-tx)'
    : 'var(--tx4)'

  const sectionData = [
    { label: 'Reading & Writing', score: rw,   count: enCount,   color: '#a78bfa', accPct: secEn   ? Math.round((secEn.correct   / secEn.total)   * 100) : null },
    { label: 'Math',              score: math, count: mathCount, color: 'var(--lime-dk)', accPct: secMath ? Math.round((secMath.correct / secMath.total) * 100) : null },
  ]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 4 }}>Score Predictor</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 28 }}>
        Estimated SAT score based on your practice performance. Answer {THRESHOLD}+ questions per section to activate.
      </div>

      {/* Total score card */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 20, padding: '36px 28px', textAlign: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        {/* BG glow */}
        {total && <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: totalColor, opacity: .06, pointerEvents: 'none' }} />}

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--tx4)', marginBottom: 16 }}>Predicted Total Score</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 80, fontWeight: 900, lineHeight: 1, color: totalColor, letterSpacing: '-3px', marginBottom: 8 }}>
          {total || '—'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--tx4)', marginBottom: total ? 12 : 0 }}>
          {total
            ? `out of 1600 · estimated range ${Math.max(400, total - 70)}–${Math.min(1600, total + 70)}`
            : `Answer ${THRESHOLD}+ questions in each section to see your score`}
        </div>
        {total && (
          <div style={{
            display: 'inline-block', marginTop: 4,
            padding: '5px 14px', borderRadius: 100, fontSize: 12.5, fontWeight: 700,
            background: total >= 1400 ? 'var(--g-bg)' : total >= 1100 ? 'var(--a-bg)' : 'var(--r-bg)',
            color:      total >= 1400 ? 'var(--g-tx)' : total >= 1100 ? 'var(--a-tx)' : 'var(--r-tx)',
            border:     `1px solid ${total >= 1400 ? 'var(--g-ln)' : total >= 1100 ? 'var(--a-ln)' : 'var(--r-ln)'}`,
          }}>
            {total >= 1400 ? '🏆 Top 10%' : total >= 1200 ? '⭐ Above average' : total >= 1000 ? 'On track' : '📚 Keep practicing'}
          </div>
        )}
      </div>

      {/* Section cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {sectionData.map(({ label, score, count, color, accPct }) => (
          <div key={label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--tx3)' }}>
                  {count < THRESHOLD
                    ? `${count} / ${THRESHOLD} questions answered`
                    : `${count} questions · ${accPct}% accuracy`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 900, color: score ? color : 'var(--tx4)', letterSpacing: '-1px', lineHeight: 1 }}>
                  {score || '—'}
                </div>
                {score && <div style={{ fontSize: 11, color: 'var(--tx4)', marginTop: 2 }}>/ 800</div>}
              </div>
            </div>
            <ScoreBar score={score} count={count} color={color} />
            {count < THRESHOLD && count > 0 && (
              <div style={{ fontSize: 12, color: 'var(--tx4)', marginTop: 8 }}>
                {THRESHOLD - count} more question{THRESHOLD - count !== 1 ? 's' : ''} needed
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Call to action */}
      {(!rw || !math) && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 3 }}>Keep practicing!</div>
            <div style={{ fontSize: 13, color: 'var(--tx3)' }}>Answer more questions to improve your prediction accuracy.</div>
          </div>
          <Link href="/bank" style={{ padding: '9px 18px', background: 'var(--lime)', color: '#060a0e', borderRadius: 9, fontWeight: 700, fontSize: 13.5, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Practice now →
          </Link>
        </div>
      )}

      {/* Methodology */}
      <div style={{ background: 'var(--sf2)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', fontSize: 12.5, color: 'var(--tx3)', lineHeight: 1.65 }}>
        <span style={{ fontWeight: 700, color: 'var(--tx2)' }}>How it works: </span>
        Each section is scored on a 200–800 scale using your practice accuracy. 0% accuracy = 200, 100% = 800. The total is the sum of both sections. This is an approximation — the real SAT uses adaptive difficulty and item response theory.
      </div>
    </div>
  )
}
