'use client'
// app/stats/page.tsx — full analytics: XP, streaks, time, mistake patterns, weak topics
import Link from 'next/link'
import { useStats, useGamification, useTimeStats, useMistakePatterns, useWeakSkills } from '@/lib/store/useSession'
import { getLevelInfo, LEVELS } from '@/lib/store/session'

/* ── tiny icon set ── */
const Ic = {
  bar:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  clock:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  fire:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>,
  target: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  brain:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 014.76-1.4M14.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 004.96-.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-4.76-1.4"/></svg>,
  zap:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  check:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  star:   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

function fmt(secs: number | null) {
  if (secs === null) return '—'
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

export default function StatsPage() {
  const { total, correct, wrong, acc, byDomain, bySection } = useStats()
  const gamification = useGamification()
  const timeStats     = useTimeStats()
  const mistakes      = useMistakePatterns()
  const weakSkills    = useWeakSkills(5)
  const levelInfo     = getLevelInfo(gamification.xp)

  const domainRows = Object.entries(byDomain).map(([key, v]) => {
    const [sec, domain] = key.split('|||')
    const pct = Math.round((v.correct / v.total) * 100)
    return { section: sec, domain, total: v.total, correct: v.correct, pct }
  }).sort((a, b) => a.pct - b.pct)

  const secEn   = bySection['English']
  const secMath = bySection['Math']
  const accColor = acc >= 70 ? 'var(--g-tx)' : acc >= 50 ? 'var(--a-tx)' : 'var(--r-tx)'

  // Streak display
  const streakActive = gamification.lastPracticed === new Date().toISOString().split('T')[0]

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 20px 100px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 2 }}>My Analytics</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 24 }}>Live performance breakdown — updated after every answer.</div>

      {/* ── XP + Level banner ── */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 18, padding: '20px 22px', marginBottom: 16, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Level badge */}
        <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--lime-dk), #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#060a0e', fontFamily: 'var(--mono)' }}>
          {levelInfo.current.level}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{levelInfo.current.name}</span>
            {!levelInfo.isMax && <span style={{ fontSize: 11, color: 'var(--tx4)', fontFamily: 'var(--mono)' }}>→ {levelInfo.next.name}</span>}
          </div>
          {/* XP bar */}
          <div style={{ height: 7, background: 'var(--sf3)', borderRadius: 4, overflow: 'hidden', marginBottom: 5 }}>
            <div style={{ height: '100%', width: `${levelInfo.pct}%`, background: 'linear-gradient(90deg, var(--lime-dk), #22d3ee)', borderRadius: 4, transition: 'width .8s ease' }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)', fontFamily: 'var(--mono)' }}>
            {levelInfo.isMax ? `${gamification.xp.toLocaleString()} XP — MAX LEVEL` : `${levelInfo.progressXp} / ${levelInfo.neededXp} XP to next level`}
          </div>
        </div>
        {/* Streak pill */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: streakActive ? 'rgba(251,146,60,.12)' : 'var(--sf2)', border: `1px solid ${streakActive ? 'rgba(251,146,60,.3)' : 'var(--line)'}` }}>
            <span style={{ color: streakActive ? '#fb923c' : 'var(--tx4)' }}>{Ic.fire}</span>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--mono)', color: streakActive ? '#fb923c' : 'var(--tx3)' }}>{gamification.streak}</span>
            <span style={{ fontSize: 11, color: 'var(--tx4)' }}>day streak</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'var(--sf2)', border: '1px solid var(--line)' }}>
            <span style={{ color: '#fbbf24' }}>{Ic.star}</span>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--tx)' }}>{gamification.xp.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: 'var(--tx4)' }}>XP</span>
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Answered',   value: total,    color: 'var(--lime-dk)' },
          { label: 'Accuracy',   value: `${acc}%`, color: accColor },
          { label: 'Correct',    value: correct,  color: 'var(--g-tx)' },
          { label: 'Incorrect',  value: wrong,    color: 'var(--r-tx)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 14px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--mono)', lineHeight: 1, marginBottom: 5, color: c.color, letterSpacing: '-1px' }}>{c.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: 52, textAlign: 'center', color: 'var(--tx3)' }}>
          <p style={{ fontSize: 14, marginBottom: 16 }}>Answer questions in the Question Bank to see your full breakdown here.</p>
          <Link href="/bank" style={{ display: 'inline-block', padding: '9px 22px', background: 'var(--lime)', color: '#060a0e', borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Open Question Bank →</Link>
        </div>
      ) : (
        <>
          {/* ── Row: Time + Mistake patterns ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

            {/* Time per question */}
            <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <span style={{ color: '#60a5fa' }}>{Ic.clock}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Time per Question</span>
              </div>
              {timeStats.avg === null ? (
                <div style={{ fontSize: 13, color: 'var(--tx4)' }}>Timing data will appear after answering questions in timed mode.</div>
              ) : (
                <>
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--mono)', color: '#60a5fa', letterSpacing: '-1px', marginBottom: 12 }}>{fmt(timeStats.avg)}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--tx4)', marginBottom: 12 }}>average per question</div>
                  {(['easy','medium','hard'] as const).map(d => {
                    const t = timeStats.byDifficulty[d]
                    if (!t) return null
                    const color = d === 'easy' ? 'var(--g-tx)' : d === 'medium' ? 'var(--a-tx)' : 'var(--r-tx)'
                    return (
                      <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--tx3)', flex: 1, textTransform: 'capitalize' }}>{d}</span>
                        <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color }}>{fmt(t)}</span>
                      </div>
                    )
                  })}
                </>
              )}
            </div>

            {/* Mistake patterns */}
            <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <span style={{ color: '#f87171' }}>{Ic.target}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Mistake Patterns</span>
              </div>
              {mistakes.total === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--tx4)' }}>No mistakes yet. Keep practicing!</div>
              ) : (
                <>
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--mono)', color: 'var(--r-tx)', letterSpacing: '-1px', marginBottom: 3 }}>{mistakes.total}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--tx4)', marginBottom: 16 }}>total mistakes</div>
                  {[
                    { label: 'Concept gap', val: mistakes.concept, color: '#f87171', desc: 'Didn\'t know the material', icon: Ic.brain },
                    { label: 'Careless error', val: mistakes.careless, color: '#fbbf24', desc: 'Knew it but rushed', icon: Ic.zap },
                  ].map(m => (
                    <div key={m.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: m.color }}>{m.icon}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx)' }}>{m.label}</span>
                        </div>
                        <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: m.color }}>{m.val}</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--sf3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${mistakes.total ? Math.round((m.val / mistakes.total) * 100) : 0}%`, background: m.color, borderRadius: 3, transition: 'width .6s ease' }} />
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--tx4)', marginTop: 3 }}>{m.desc}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--sf2)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--tx3)', lineHeight: 1.6 }}>
                    {mistakes.concept > mistakes.careless
                      ? '📚 Focus on understanding core concepts — review explanations after each miss.'
                      : '⏱ Slow down slightly — you\'re losing points to careless mistakes, not ignorance.'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Weak Topics ── */}
          {weakSkills.length > 0 && (
            <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <span style={{ color: '#f472b6' }}>{Ic.target}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Weak Topics — Focus Here First</span>
                <span style={{ fontSize: 11, color: 'var(--tx4)', marginLeft: 'auto', fontFamily: 'var(--mono)' }}>sorted by accuracy</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {weakSkills.map((sk, idx) => {
                  const barColor = sk.acc >= 70 ? 'var(--g-tx)' : sk.acc >= 50 ? 'var(--a-tx)' : 'var(--r-tx)'
                  return (
                    <div key={sk.skill} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--sf2)', borderRadius: 10, border: idx === 0 ? '1px solid rgba(244,114,182,.3)' : '1px solid var(--line)' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: idx === 0 ? 'rgba(244,114,182,.2)' : 'var(--sf3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: idx === 0 ? '#f472b6' : 'var(--tx4)', flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: 13, flex: 1, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sk.skill}</span>
                      <div style={{ width: 100, height: 5, background: 'var(--sf3)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', width: `${sk.acc}%`, background: barColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 800, color: barColor, minWidth: 36, textAlign: 'right' }}>{sk.acc}%</span>
                      <span style={{ fontSize: 11, color: 'var(--tx4)', minWidth: 44, textAlign: 'right', fontFamily: 'var(--mono)' }}>{sk.correct}/{sk.total}</span>
                      <Link href={`/bank?skill=${encodeURIComponent(sk.skill)}`} style={{ fontSize: 11.5, color: 'var(--lime-dk)', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>Practice →</Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Section breakdown ── */}
          {(secEn || secMath) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Reading & Writing', data: secEn,   color: '#a78bfa' },
                { label: 'Math',              data: secMath, color: 'var(--lime-dk)' },
              ].map(({ label, data, color }) => data ? (
                <div key={label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx3)', marginBottom: 10 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 800, color, marginBottom: 4, letterSpacing: '-1px' }}>
                    {Math.round((data.correct / data.total) * 100)}%
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--tx3)', marginBottom: 10 }}>{data.correct}/{data.total} correct</div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--sf3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((data.correct/data.total)*100)}%`, background: color, borderRadius: 3, transition: 'width .6s ease' }} />
                  </div>
                </div>
              ) : null)}
            </div>
          )}

          {/* ── Domain accuracy rows ── */}
          {(['English', 'Math'] as const).map(sec => {
            const isMath = sec === 'Math'
            const rows   = domainRows.filter(r => isMath ? /math/i.test(r.section) : !/math/i.test(r.section))
            if (!rows.length) return null
            const label = isMath ? 'Math' : 'Reading & Writing'
            const color = isMath ? 'var(--lime-dk)' : '#a78bfa'
            return (
              <div key={sec} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {label}
                  <span style={{ fontSize: 11, color: 'var(--tx4)', background: 'var(--sf3)', padding: '2px 8px', borderRadius: 100, fontWeight: 500 }}>
                    {rows.reduce((a, r) => a + r.total, 0)} answered
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {rows.map(r => {
                    const barColor = r.pct >= 80 ? 'var(--g-tx)' : r.pct >= 60 ? color : r.pct >= 40 ? 'var(--a-tx)' : 'var(--r-tx)'
                    const tag      = r.pct < 50 ? '⚠ Weak' : r.pct >= 85 ? '✓ Strong' : ''
                    return (
                      <div key={r.domain} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.domain}</div>
                        {tag && <span style={{ fontSize: 10, fontWeight: 700, color: r.pct < 50 ? 'var(--r-tx)' : 'var(--g-tx)', flexShrink: 0 }}>{tag}</span>}
                        <div style={{ flex: 1, height: 5, background: 'var(--sf3)', borderRadius: 4, overflow: 'hidden', maxWidth: 180 }}>
                          <div style={{ height: '100%', width: `${r.pct}%`, background: barColor, borderRadius: 4, transition: 'width .7s ease' }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--mono)', minWidth: 36, textAlign: 'right', color: barColor }}>{r.pct}%</div>
                        <div style={{ fontSize: 11, color: 'var(--tx4)', minWidth: 44, textAlign: 'right', fontFamily: 'var(--mono)' }}>{r.correct}/{r.total}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
