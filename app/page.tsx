'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sessionStore } from '@/lib/store/session'

/* ─── Quick action cards ─────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    href: '/bank',
    label: 'Question Bank',
    desc: 'Browse all topics and practice by domain, skill or difficulty.',
    color: '#a78bfa',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    href: '/tests',
    label: 'Take a Test',
    desc: 'Full-length SAT simulations with timer and auto-scoring.',
    color: '#60a5fa',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 12h6M9 17h4"/>
      </svg>
    ),
  },
  {
    href: '/stats',
    label: 'My Stats',
    desc: 'See your accuracy by domain and track your progress over time.',
    color: '#34d399',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/mistakes',
    label: 'Review Mistakes',
    desc: 'Every wrong answer saved in one place. Drill until it clicks.',
    color: '#f87171',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    href: '/saved',
    label: 'Saved Questions',
    desc: 'Bookmarked questions you want to revisit later.',
    color: '#fbbf24',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/score',
    label: 'Score Predictor',
    desc: 'See your estimated SAT score based on your practice data.',
    color: '#f472b6',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
]

/* ─── Guest landing features ─────────────────────────────── */
const FEATURES = [
  { icon: '📖', title: 'Full Question Bank',   desc: 'Thousands of SAT questions sorted by domain, skill, and difficulty.' },
  { icon: '⏱',  title: 'Timed Tests',          desc: 'Full digital SAT simulations with automatic scoring.' },
  { icon: '📊', title: 'Smart Analytics',      desc: 'Accuracy breakdowns and a live predicted score.' },
  { icon: '🔖', title: 'Review System',        desc: 'Save questions, track mistakes, drill until perfect.' },
]

export default function HomePage() {
  const router = useRouter()
  const [user, setUser]       = useState<{name:string;email:string}|null>(null)
  const [ready, setReady]     = useState(false)
  const [stats, setStats]     = useState({ total: 0, correct: 0, acc: 0 })

  useEffect(() => {
    const u = localStorage.getItem('nexus_user')
    if (u) {
      try { setUser(JSON.parse(u)) } catch {}
      // Load stats
      const s = sessionStore.getStats()
      setStats({ total: s.total, correct: s.correct, acc: s.acc })
    }
    setReady(true)

    const h = () => {
      const stored = localStorage.getItem('nexus_user')
      if (stored) { try { setUser(JSON.parse(stored)) } catch {} } else setUser(null)
    }
    window.addEventListener('nexus_auth_change', h)
    return () => window.removeEventListener('nexus_auth_change', h)
  }, [])

  if (!ready) return null

  /* ── Logged-in dashboard ── */
  if (user) {
    const firstName = user.name?.split(' ')[0] || 'there'
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero greeting */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 4 }}>
            {greeting}, {firstName} 👋
          </div>
          <div style={{ fontSize: 14, color: 'var(--tx3)' }}>
            What do you want to work on today?
          </div>
        </div>

        {/* Stats strip */}
        {stats.total > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Questions answered', val: stats.total,   color: 'var(--lime-dk)' },
              { label: 'Correct answers',    val: stats.correct, color: 'var(--g-tx)'    },
              { label: 'Accuracy',           val: `${stats.acc}%`, color: stats.acc >= 70 ? 'var(--g-tx)' : stats.acc >= 50 ? 'var(--a-tx)' : 'var(--r-tx)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px', flex: 1, minWidth: 120 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {QUICK_ACTIONS.map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 18px', cursor: 'pointer', transition: 'border-color .15s, background .15s', height: '100%' }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, marginBottom: 14 }}>
                  {a.icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 6 }}>{a.label}</div>
                <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.6 }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Start practicing CTA if no activity yet */}
        {stats.total === 0 && (
          <div style={{ marginTop: 28, background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Ready to start?</div>
            <div style={{ fontSize: 13.5, color: 'var(--tx3)', marginBottom: 20 }}>Pick a topic from the Question Bank and answer your first questions.</div>
            <Link href="/bank" style={{ display: 'inline-block', padding: '11px 28px', background: 'var(--lime)', color: '#060a0e', borderRadius: 11, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Open Question Bank →
            </Link>
          </div>
        )}
      </div>
    )
  }

  /* ── Guest landing page ── */
  return (
    <div>
      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--lime-dim)', border: '1px solid rgba(163,230,53,.25)', borderRadius: 100, padding: '5px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--lime-dk)', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)', display: 'inline-block' }} />
          Free SAT prep — no subscription needed
        </div>
        <h1 style={{ fontSize: 'clamp(30px,7vw,56px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 18, color: 'var(--tx)' }}>
          Score higher on the SAT.<br/>
          <span style={{ color: 'var(--lime-dk)' }}>Practice smarter.</span>
        </h1>
        <p style={{ fontSize: 'clamp(15px,2.5vw,18px)', color: 'var(--tx3)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 36px' }}>
          Real SAT questions, adaptive analytics, and full-length timed tests — all in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/settings" style={{ padding: '13px 30px', background: 'var(--lime)', color: '#060a0e', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(163,230,53,.28)' }}>
            Get started free →
          </Link>
          <Link href="/bank" style={{ padding: '13px 24px', background: 'var(--sf)', color: 'var(--tx2)', border: '1px solid var(--line2)', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Browse questions
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: 14 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 18px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
