'use client'
// app/page.tsx — product landing page
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATS = [
  { value: '2,400+', label: 'Real SAT Questions' },
  { value: '98%',    label: 'Score Accuracy' },
  { value: '15 min', label: 'Avg. Daily Practice' },
]

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    title:  'Full Question Bank',
    desc:   'Every question organized by domain, skill, and difficulty. Filter and focus exactly where you need to improve.',
    color:  '#a78bfa',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title:  'Timed Test Mode',
    desc:   'Full-length SAT simulations with the real time limits, question navigator, and automatic scoring.',
    color:  '#60a5fa',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title:  'Smart Analytics',
    desc:   'See exactly where you\'re weak. Accuracy by domain, improvement over time, and a live score prediction.',
    color:  'var(--lime-dk)',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title:  'Mistake Review',
    desc:   'Every wrong answer is saved. Review your mistakes, bookmark tough questions, and drill them until they click.',
    color:  '#f472b6',
  },
]

const TESTIMONIALS = [
  { name: 'Aisha K.',  score: '1480', quote: 'I went from a 1280 to a 1480 in 6 weeks. The analytics showed exactly what I needed to fix.', avatar: 'AK' },
  { name: 'Marcus T.', score: '1520', quote: 'The timed tests are as close to the real thing as I\'ve found. Way better than just doing practice PDFs.', avatar: 'MT' },
  { name: 'Sofia R.',  score: '1390', quote: 'Being able to filter by skill and drill specific topics saved me so much time compared to textbooks.', avatar: 'SR' },
]

const HOW = [
  { num: '01', title: 'Create a free account',  desc: 'Sign up in 30 seconds — no credit card needed.' },
  { num: '02', title: 'Pick a topic to drill',   desc: 'Filter by section, domain, difficulty, and start practicing.' },
  { num: '03', title: 'Track your improvement',  desc: 'Watch your accuracy and predicted score rise over time.' },
]

export default function LandingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('nexus_user')) { router.replace('/bank'); return }
    setReady(true)
  }, [router])

  if (!ready) return null

  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ maxWidth: 780, margin: '0 auto', padding: '72px 24px 60px', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--lime-dim)', border: '1px solid rgba(163,230,53,.25)', borderRadius: 100, padding: '5px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--lime-dk)', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)', display: 'inline-block' }} />
          Free SAT prep — no subscriptions
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 7vw, 58px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 20, color: 'var(--tx)' }}>
          Score higher on the SAT.<br />
          <span style={{ color: 'var(--lime-dk)' }}>Smarter, faster.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--tx3)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px' }}>
          Real SAT questions, intelligent analytics, and timed tests — all in one place. Track every weak spot and watch your score climb.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
          <Link href="/settings" style={{ padding: '14px 32px', background: 'var(--lime)', color: '#060a0e', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none', letterSpacing: '-.2px', boxShadow: '0 4px 24px rgba(163,230,53,.3)' }}>
            Start for free →
          </Link>
          <Link href="/bank" style={{ padding: '14px 24px', background: 'var(--sf)', color: 'var(--tx2)', border: '1px solid var(--line2)', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Browse questions
          </Link>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 800, color: 'var(--lime-dk)', letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--tx4)', marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--tx4)', marginBottom: 10 }}>Everything you need</div>
          <h2 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, letterSpacing: '-.5px', color: 'var(--tx)' }}>Built for the digital SAT</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 18, padding: '24px 22px', transition: 'border-color .15s' }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 16 }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--tx3)', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section style={{ background: 'var(--sf)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--tx4)', marginBottom: 10 }}>Simple process</div>
            <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, letterSpacing: '-.4px', color: 'var(--tx)' }}>Start in 3 steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {HOW.map(h => (
              <div key={h.num} style={{ textAlign: 'center', padding: '0 12px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 900, color: 'var(--lime)', letterSpacing: '-2px', marginBottom: 12, lineHeight: 1 }}>{h.num}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>{h.title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--tx3)', lineHeight: 1.6 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--tx4)', marginBottom: 10 }}>Student results</div>
          <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, letterSpacing: '-.4px', color: 'var(--tx)' }}>Real scores. Real students.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 18, padding: '24px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#060a0e', flexShrink: 0 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--lime-dk)', fontWeight: 600 }}>scored {t.score}</div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.7, margin: 0 }}>"{t.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 80px', textAlign: 'center' }}>
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 24, padding: '52px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, borderRadius: '50%', background: 'var(--lime)', opacity: .05, pointerEvents: 'none' }} />
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--lime-dk)', marginBottom: 14 }}>Free forever</div>
          <h2 style={{ fontSize: 'clamp(22px,5vw,32px)', fontWeight: 800, letterSpacing: '-.4px', color: 'var(--tx)', marginBottom: 14 }}>Ready to boost your score?</h2>
          <p style={{ fontSize: 15, color: 'var(--tx3)', marginBottom: 28, lineHeight: 1.6 }}>No credit card. No subscription. Just better SAT prep.</p>
          <Link href="/settings" style={{ display: 'inline-block', padding: '14px 36px', background: 'var(--lime)', color: '#060a0e', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(163,230,53,.3)' }}>
            Create free account →
          </Link>
        </div>
      </section>
    </div>
  )
}
