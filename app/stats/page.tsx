'use client'
// app/stats/page.tsx
import { useStats } from '@/lib/store/useSession'

export default function StatsPage() {
  const { total, correct, wrong, acc, byDomain, bySection } = useStats()

  const domainRows = Object.entries(byDomain).map(([key, v]) => {
    const [sec, domain] = key.split('|||')
    const pct = Math.round((v.correct / v.total) * 100)
    return { section: sec, domain, ...v, pct }
  }).sort((a, b) => a.pct - b.pct)

  const secEn   = bySection['English']
  const secMath = bySection['Math']

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px 60px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.4px', marginBottom: 4 }}>My Stats</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 32 }}>Live accuracy breakdown — updates as you answer questions.</div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 36 }}>
        {[
          { label: 'Questions Answered', value: total, color: 'var(--lime)' },
          { label: 'Overall Accuracy',   value: `${acc}%`, color: acc >= 70 ? 'var(--g-tx)' : acc >= 50 ? 'var(--a-tx)' : 'var(--r-tx)' },
          { label: 'Correct',            value: correct, color: 'var(--g-tx)' },
          { label: 'Incorrect',          value: wrong,   color: 'var(--r-tx)' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 13, padding: '20px 18px' }}>
            <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1, marginBottom: 5, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12.5, color: 'var(--tx3)' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 13, padding: 40, textAlign: 'center', color: 'var(--tx3)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 14 }}>Answer questions in the Question Bank to see your breakdown here.</p>
        </div>
      ) : (
        <>
          {/* Section breakdown */}
          {(secEn || secMath) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 32 }}>
              {[{ label: 'Reading & Writing', data: secEn }, { label: 'Math', data: secMath }].map(({ label, data }) => data ? (
                <div key={label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 13, padding: '20px 18px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx2)', marginBottom: 12 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: 'var(--lime)', marginBottom: 4 }}>{Math.round(data.correct / data.total * 100)}%</div>
                  <div style={{ fontSize: 12.5, color: 'var(--tx3)' }}>{data.correct}/{data.total} correct</div>
                </div>
              ) : null)}
            </div>
          )}

          {/* Domain rows */}
          {['English', 'Math'].map(sec => {
            const rows = domainRows.filter(r => /math/i.test(sec) ? /math/i.test(r.section) : !/math/i.test(r.section))
            if (!rows.length) return null
            const label = sec === 'Math' ? 'Math' : 'Reading & Writing'
            return (
              <div key={sec} style={{ marginBottom: 30 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx2)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {label}
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--tx4)', background: 'var(--sf3)', padding: '2px 8px', borderRadius: 100 }}>
                    {rows.reduce((a, r) => a + r.total, 0)} answered
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {rows.map(r => {
                    const barColor = r.pct >= 80 ? 'var(--g-tx)' : r.pct >= 60 ? 'var(--a-tx)' : 'var(--r-tx)'
                    return (
                      <div key={r.domain} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, minWidth: 220, color: 'var(--tx)' }}>{r.domain}</div>
                        <div style={{ flex: 1, height: 7, background: 'var(--sf3)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.pct}%`, background: barColor, borderRadius: 4, transition: 'width .8s ease' }} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', minWidth: 38, textAlign: 'right', color: barColor }}>{r.pct}%</div>
                        <div style={{ fontSize: 11.5, color: 'var(--tx4)', minWidth: 52, textAlign: 'right', fontFamily: 'var(--mono)' }}>{r.correct}/{r.total}</div>
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