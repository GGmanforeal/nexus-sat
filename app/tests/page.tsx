'use client'
// app/tests/page.tsx — gate full tests behind login, preview for guests
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CONFIGS = [
  {
    id: 'full', title: 'Full SAT Simulation', gated: true,
    desc: 'Both sections, timed exactly like the real exam.',
    meta: ['3 hrs', '98 questions', 'Both sections'],
    count: 98, sections: ['English','Math'], timer: 180 * 60,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 12h6M9 17h4"/>
      </svg>
    ),
  },
  {
    id: 'math', title: 'Math Only', gated: true,
    desc: '44 questions across all four math domains.',
    meta: ['70 min', '44 questions', 'Math'],
    count: 44, sections: ['Math'], timer: 70 * 60,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    id: 'rw', title: 'Reading & Writing', gated: true,
    desc: '54 questions covering all reading and writing skills.',
    meta: ['64 min', '54 questions', 'English'],
    count: 54, sections: ['English'], timer: 64 * 60,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    id: 'quick', title: 'Quick Practice', gated: false,
    desc: '5 mixed questions — free preview. No account needed.',
    meta: ['No timer', '5 questions', 'Mixed'],
    count: 5, sections: ['English','Math'], timer: null,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
]

const DEFAULT_CREDS = {
  url: 'https://cxeeqxxvuyrhlpindljk.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M',
  table: 'sat_questions',
}

export default function TestsPage() {
  const router   = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError]       = useState('')
  const [showGate, setShowGate] = useState(false)

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('nexus_user'))
    const h = () => setLoggedIn(!!localStorage.getItem('nexus_user'))
    window.addEventListener('nexus_auth_change', h)
    return () => window.removeEventListener('nexus_auth_change', h)
  }, [])

  const start = async (cfg: typeof CONFIGS[0]) => {
    if (cfg.gated && !loggedIn) { setShowGate(true); return }
    setStarting(cfg.id); setError('')
    const raw = localStorage.getItem('nexus_creds')
    const { url, key, table } = raw ? JSON.parse(raw) : DEFAULT_CREDS
    try {
      let allQs: any[] = []
      for (const secLabel of cfg.sections) {
        const params = new URLSearchParams({
          select: 'id,section,domain,skill,difficulty,question_text,passage_text,choice_a,choice_b,choice_c,choice_d,correct_answer,explanation',
          limit: '500',
        })
        const res  = await fetch(`${url}/rest/v1/${table}?${params}`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        })
        const data = await res.json()
        if (Array.isArray(data)) {
          const filtered = data.filter((q: any) =>
            secLabel === 'Math' ? /math/i.test(q.section) : !/math/i.test(q.section)
          )
          allQs = [...allQs, ...filtered]
        }
      }
      if (!allQs.length) {
        setError('No questions found in the database.')
        setStarting(null); return
      }
      const shuffled = [...allQs].sort(() => Math.random() - .5).slice(0, cfg.count)
      sessionStorage.setItem('nexus_test_qs', JSON.stringify(shuffled))
      sessionStorage.setItem('nexus_test_type', cfg.title)
      sessionStorage.setItem('nexus_test_timer', cfg.timer ? String(cfg.timer) : '')
      router.push('/tests/run')
    } catch {
      setError('Failed to load questions. Check your connection.')
      setStarting(null)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 4 }}>Practice Tests</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 28 }}>
        Choose a format and start a timed session.
        {!loggedIn && <span style={{ color: 'var(--a-tx)' }}> Full tests require a free account.</span>}
      </div>

      {error && (
        <div style={{ background: 'var(--r-bg)', border: '1px solid var(--r-ln)', borderRadius: 10, padding: '11px 16px', marginBottom: 20, fontSize: 13, color: 'var(--r-tx)' }}>{error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {CONFIGS.map(cfg => {
          const needsAuth = cfg.gated && !loggedIn
          return (
            <div key={cfg.id}
              style={{ background: 'var(--sf)', border: `1px solid ${needsAuth ? 'var(--line)' : 'var(--line)'}`, borderRadius: 16, padding: '22px 20px', position: 'relative', overflow: 'hidden', transition: 'border-color .15s, transform .15s, box-shadow .15s', cursor: 'pointer' }}
              onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'var(--lime)'; d.style.transform = 'translateY(-2px)'; d.style.boxShadow = '0 8px 28px rgba(0,0,0,.2)' }}
              onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = 'var(--line)'; d.style.transform = 'none'; d.style.boxShadow = 'none' }}>

              {/* Lock badge */}
              {needsAuth && (
                <div style={{ position: 'absolute', top: 14, right: 14, background: 'var(--a-bg)', color: 'var(--a-tx)', border: '1px solid var(--a-ln)', borderRadius: 100, fontSize: 11, fontWeight: 700, padding: '2px 9px' }}>
                  Free account
                </div>
              )}

              <div style={{ color: 'var(--lime-dk)', marginBottom: 14 }}>{cfg.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 5, letterSpacing: '-.3px' }}>{cfg.title}</div>
              <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.6, marginBottom: 14 }}>{cfg.desc}</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 18 }}>
                {cfg.meta.map(m => (
                  <span key={m} style={{ fontSize: 11.5, background: 'var(--sf3)', color: 'var(--tx3)', padding: '3px 10px', borderRadius: 100 }}>{m}</span>
                ))}
              </div>
              <button onClick={() => start(cfg)} disabled={!!starting}
                style={{
                  width: '100%', padding: '11px 0',
                  background: needsAuth ? 'var(--sf3)' : starting === cfg.id ? 'var(--lime-dk)' : 'var(--lime)',
                  color: needsAuth ? 'var(--tx2)' : '#060a0e',
                  border: needsAuth ? '1px solid var(--line2)' : 'none',
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: starting ? 'wait' : 'pointer', transition: 'background .15s',
                }}>
                {needsAuth ? 'Sign up to unlock' : starting === cfg.id ? 'Loading…' : 'Start →'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Auth gate modal */}
      {showGate && (
        <div onClick={() => setShowGate(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(5px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--sf)', border: '1px solid var(--line2)', borderRadius: 20, padding: '40px 32px', maxWidth: 380, width: '100%', textAlign: 'center', animation: 'fadeUp .25s ease' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--lime)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#060a0e' }}>N</div>
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 10, letterSpacing: '-.3px' }}>Create a free account</div>
            <div style={{ fontSize: 14, color: 'var(--tx3)', lineHeight: 1.65, marginBottom: 28 }}>
              Full-length tests require a free Nexus account to track your progress and save your results.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <a href="/settings" style={{ padding: '11px 24px', background: 'var(--lime)', color: '#060a0e', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Sign up free →
              </a>
              <button onClick={() => setShowGate(false)}
                style={{ padding: '11px 20px', background: 'none', color: 'var(--tx2)', border: '1px solid var(--line2)', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
