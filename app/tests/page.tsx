'use client'
// app/tests/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CONFIGS = [
  { id: 'full',  icon: '📋', title: 'Full SAT Simulation', desc: 'Both sections, exactly like the real exam. Timed at 3 hours.', meta: ['3 hrs', '98 questions', 'Both sections'], count: 98, sections: ['English','Math'], timer: 180 * 60 },
  { id: 'math',  icon: '📐', title: 'Math Only', desc: '44 math questions across all four domains.', meta: ['70 min', '44 questions', 'Math only'], count: 44, sections: ['Math'], timer: 70 * 60 },
  { id: 'rw',    icon: '📖', title: 'Reading & Writing', desc: '54 questions covering all reading and writing skills.', meta: ['64 min', '54 questions', 'English only'], count: 54, sections: ['English'], timer: 64 * 60 },
  { id: 'quick', icon: '⚡', title: 'Quick Practice', desc: '20 mixed questions, no timer. Great for a fast session.', meta: ['No timer', '20 questions', 'Mixed'], count: 20, sections: ['English','Math'], timer: null },
]

export default function TestsPage() {
  const router = useRouter()
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState('')

  const start = async (cfg: typeof CONFIGS[0]) => {
    setStarting(cfg.id); setError('')
    const raw = localStorage.getItem('nexus_creds')
    if (!raw) { setError('Connect your database first — go to Question Bank and click Connect.'); setStarting(null); return }
    const { url, key, table } = JSON.parse(raw)
    try {
      let allQs: any[] = []
      for (const secLabel of cfg.sections) {
        const params = new URLSearchParams({
          select: 'id,section,domain,skill,difficulty,question_text,passage_text,choice_a,choice_b,choice_c,choice_d,correct_answer,explanation',
          limit: '500',
        })
        const res = await fetch(`${url}/rest/v1/${table}?${params}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
        const data = await res.json()
        if (Array.isArray(data)) {
          // filter by section client-side
          const filtered = data.filter((q: any) => secLabel === 'Math' ? /math/i.test(q.section) : !/math/i.test(q.section))
          allQs = [...allQs, ...filtered]
        }
      }
      if (!allQs.length) { setError('No questions found. Make sure your database has questions imported.'); setStarting(null); return }
      const shuffled = [...allQs].sort(() => Math.random() - .5).slice(0, cfg.count)
      sessionStorage.setItem('nexus_test_qs', JSON.stringify(shuffled))
      sessionStorage.setItem('nexus_test_type', cfg.title)
      sessionStorage.setItem('nexus_test_timer', cfg.timer ? String(cfg.timer) : '')
      router.push('/tests/run')
    } catch {
      setError('Failed to load questions. Check your Supabase connection.')
      setStarting(null)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px 60px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.4px', marginBottom: 4 }}>Full-Length Tests</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: error ? 16 : 32 }}>Choose a format and start a timed practice session.</div>

      {error && (
        <div style={{ background: 'var(--r-bg)', border: '1px solid var(--r-ln)', borderRadius: 10, padding: '11px 16px', marginBottom: 20, fontSize: 13, color: 'var(--r-tx)' }}>⚠ {error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {CONFIGS.map(cfg => (
          <div key={cfg.id}
            style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, padding: 24, transition: 'border-color .15s, transform .15s, box-shadow .15s', cursor: 'pointer' }}
            onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'var(--lime)'; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 8px 24px rgba(0,0,0,.18)' }}
            onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'var(--line)'; d.style.transform = 'none'; d.style.boxShadow = 'none' }}>
            <div style={{ fontSize: 30, marginBottom: 14 }}>{cfg.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{cfg.title}</div>
            <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.6, marginBottom: 16 }}>{cfg.desc}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
              {cfg.meta.map(m => (
                <span key={m} style={{ fontSize: 11.5, background: 'var(--sf3)', color: 'var(--tx3)', padding: '3px 10px', borderRadius: 100 }}>{m}</span>
              ))}
            </div>
            <button onClick={() => start(cfg)} disabled={!!starting}
              style={{ width: '100%', padding: '11px 0', background: starting === cfg.id ? 'var(--lime-dk)' : 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: starting ? 'wait' : 'pointer', transition: 'background .15s' }}>
              {starting === cfg.id ? 'Loading questions…' : 'Start →'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}