'use client'
// app/stats/page.tsx — clean stats with domain breakdown
import { useStats } from '@/lib/store/useSession'

export default function StatsPage() {
  const { total, correct, wrong, acc, byDomain, bySection } = useStats()

  const domainRows = Object.entries(byDomain).map(([key, v]) => {
    const [sec, domain] = key.split('|||')
    const pct = Math.round((v.correct / v.total) * 100)
    return { section: sec, domain, total: v.total, correct: v.correct, pct }
  }).sort((a, b) => a.pct - b.pct)

  const secEn   = bySection['English']
  const secMath = bySection['Math']
  const accColor = acc >= 70 ? 'var(--g-tx)' : acc >= 50 ? 'var(--a-tx)' : 'var(--r-tx)'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 4 }}>My Stats</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 28 }}>Live accuracy breakdown — updates as you answer questions.</div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Answered',         value: total,    color: 'var(--lime-dk)' },
          { label: 'Overall Accuracy', value: `${acc}%`, color: accColor },
          { label: 'Correct',          value: correct,  color: 'var(--g-tx)' },
          { label: 'Incorrect',        value: wrong,    color: 'var(--r-tx)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--mono)', lineHeight: 1, marginBottom: 5, color: c.color, letterSpacing: '-1px' }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--tx3)' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: 52, textAlign: 'center', color: 'var(--tx3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--tx4)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <p style={{ fontSize: 14, marginBottom: 16 }}>Answer questions in the Question Bank to see your breakdown here.</p>
          <a href="/bank" style={{ display: 'inline-block', padding: '9px 22px', background: 'var(--lime)', color: '#060a0e', borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Go to Question Bank →</a>
        </div>
      ) : (
        <>
          {/* Section breakdown */}
          {(secEn || secMath) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Reading & Writing', data: secEn,   color: '#a78bfa' },
                { label: 'Math',              data: secMath, color: 'var(--lime-dk)' },
              ].map(({ label, data, color }) => data ? (
                <div key={label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx3)', marginBottom: 12 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 800, color, marginBottom: 4, letterSpacing: '-1px' }}>
                    {Math.round((data.correct / data.total) * 100)}%
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--tx3)' }}>{data.correct}/{data.total} correct</div>
                  {/* Mini bar */}
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--sf3)', overflow: 'hidden', marginTop: 12 }}>
                    <div style={{ height: '100%', width: `${Math.round((data.correct/data.total)*100)}%`, background: color, borderRadius: 3, transition: 'width .6s ease' }} />
                  </div>
                </div>
              ) : null)}
            </div>
          )}

          {/* Domain rows */}
          {(['English', 'Math'] as const).map(sec => {
            const isMath = sec === 'Math'
            const rows   = domainRows.filter(r => isMath ? /math/i.test(r.section) : !/math/i.test(r.section))
            if (!rows.length) return null
            const label = isMath ? 'Math' : 'Reading & Writing'
            const color = isMath ? 'var(--lime-dk)' : '#a78bfa'
            return (
              <div key={sec} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {label}
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--tx4)', background: 'var(--sf3)', padding: '2px 8px', borderRadius: 100 }}>
                    {rows.reduce((a, r) => a + r.total, 0)} answered
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {rows.map(r => {
                    const barColor = r.pct >= 80 ? 'var(--g-tx)' : r.pct >= 60 ? color : r.pct >= 40 ? 'var(--a-tx)' : 'var(--r-tx)'
                    return (
                      <div key={r.domain} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, minWidth: 200, color: 'var(--tx)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.domain}</div>
                        <div style={{ flex: 1, height: 6, background: 'var(--sf3)', borderRadius: 4, overflow: 'hidden', maxWidth: 200 }}>
                          <div style={{ height: '100%', width: `${r.pct}%`, background: barColor, borderRadius: 4, transition: 'width .7s ease' }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--mono)', minWidth: 38, textAlign: 'right', color: barColor }}>{r.pct}%</div>
                        <div style={{ fontSize: 11.5, color: 'var(--tx4)', minWidth: 46, textAlign: 'right', fontFamily: 'var(--mono)' }}>{r.correct}/{r.total}</div>
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
