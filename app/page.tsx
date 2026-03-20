'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sessionStore } from '@/lib/store/session'

/* ─── Icons ─────────────────────────────────────────────── */
const BankIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
const TestIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 12h6M9 17h4"/></svg>
const StatsIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const MistakeIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
const SavedIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
const ScoreIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const CheckIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--lime-dk)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const ArrowIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>

/* ─── Dashboard quick actions ────────────────────────────── */
const QUICK_ACTIONS = [
  { href: '/bank',     label: 'Question Bank',    color: '#a78bfa', desc: 'Practice by domain, skill or difficulty.',    Icon: BankIcon    },
  { href: '/tests',    label: 'Take a Test',       color: '#60a5fa', desc: 'Full-length SAT simulations with scoring.',    Icon: TestIcon    },
  { href: '/stats',    label: 'My Stats',          color: '#34d399', desc: 'Track accuracy across every domain.',          Icon: StatsIcon   },
  { href: '/mistakes', label: 'Review Mistakes',   color: '#f87171', desc: 'Every wrong answer in one place.',             Icon: MistakeIcon },
  { href: '/saved',    label: 'Saved Questions',   color: '#fbbf24', desc: 'Bookmarked questions to revisit.',             Icon: SavedIcon   },
  { href: '/score',    label: 'Score Predictor',   color: '#f472b6', desc: 'Estimate your SAT score right now.',           Icon: ScoreIcon   },
]

/* ─── Landing feature cards ──────────────────────────────── */
const FEATURES = [
  { color: '#a78bfa', Icon: BankIcon,    title: 'Real SAT Questions',   desc: 'PSAT 8/9, PSAT 10, and Digital SAT questions — sorted by domain, skill, and difficulty.' },
  { color: '#60a5fa', Icon: TestIcon,    title: 'Full-Length Tests',     desc: 'Timed simulations that match the real exam format with automatic scoring.' },
  { color: '#34d399', Icon: StatsIcon,   title: 'Smart Score Predictor', desc: 'After 10 questions your predicted SAT score updates live based on your accuracy.' },
  { color: '#f87171', Icon: MistakeIcon, title: 'Mistake Tracker',       desc: 'Every wrong answer is saved automatically so you can drill your weak spots.' },
]

/* ─── Testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Amir T.',  score: '1480', prev: '1210', text: 'The score predictor kept me motivated. Watched my number climb from 1210 to 1480 over six weeks.' },
  { name: 'Sofia K.', score: '1540', prev: '1350', text: 'The domain breakdown showed exactly which skills I was weak in. No other free platform does that.' },
  { name: 'James R.', score: '1420', prev: '1280', text: 'I used Nexus every day for a month. The question bank is huge and the mistake review is a game changer.' },
]

export default function HomePage() {
  const [user, setUser]   = useState<{name:string;email:string}|null>(null)
  const [ready, setReady] = useState(false)
  const [stats, setStats] = useState({ total: 0, correct: 0, acc: 0 })

  useEffect(() => {
    const u = localStorage.getItem('nexus_user')
    if (u) {
      try { setUser(JSON.parse(u)) } catch {}
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

  /* ══════════════════════════════════════════════════════════
     DASHBOARD — logged-in users
  ══════════════════════════════════════════════════════════ */
  if (user) {
    const firstName = user.name?.split(' ')[0] || 'there'
    const hour      = new Date().getHours()
    const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    return (
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>
            {greeting}, {firstName}
          </div>
          <div style={{ fontSize: 14, color: 'var(--tx3)' }}>What do you want to work on today?</div>
        </div>

        {/* Stats strip */}
        {stats.total > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Questions answered', val: stats.total,       color: 'var(--lime-dk)' },
              { label: 'Correct answers',    val: stats.correct,     color: 'var(--g-tx)'    },
              { label: 'Accuracy',           val: `${stats.acc}%`,   color: stats.acc >= 70 ? 'var(--g-tx)' : stats.acc >= 50 ? 'var(--a-tx)' : 'var(--r-tx)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px', flex: 1, minWidth: 120 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {QUICK_ACTIONS.map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 18px', height: '100%', transition: 'border-color .15s' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, marginBottom: 14 }}>
                  <a.Icon />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 5 }}>{a.label}</div>
                <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.6 }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* First-time CTA */}
        {stats.total === 0 && (
          <div style={{ marginTop: 28, background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Ready to start?</div>
            <div style={{ fontSize: 13.5, color: 'var(--tx3)', marginBottom: 20 }}>Pick a topic from the Question Bank and answer your first questions.</div>
            <Link href="/bank" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'var(--lime)', color: '#060a0e', borderRadius: 11, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Open Question Bank <ArrowIcon />
            </Link>
          </div>
        )}
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════
     GUEST LANDING PAGE
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(56px,10vw,100px) 24px clamp(40px,6vw,64px)', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--lime-dim)', border: '1px solid rgba(163,230,53,.3)', borderRadius: 100, padding: '5px 16px', fontSize: 12.5, fontWeight: 600, color: 'var(--lime-dk)', marginBottom: 32 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)' }} />
          100% free — no credit card required
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(36px,7vw,64px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2.5px', color: 'var(--tx)', marginBottom: 22 }}>
          The SAT prep tool<br />
          <span style={{ color: 'var(--lime-dk)' }}>that actually works.</span>
        </h1>

        {/* Sub */}
        <p style={{ fontSize: 'clamp(15px,2.5vw,18px)', color: 'var(--tx3)', lineHeight: 1.75, maxWidth: 520, margin: '0 auto 14px' }}>
          Real SAT questions, live score prediction, and targeted mistake review — all in one place. Used by students aiming for 1400+.
        </p>

        {/* Social proof pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--tx3)', marginBottom: 40 }}>
          <div style={{ display: 'flex' }}>
            {['#a78bfa','#60a5fa','#34d399','#f87171','#fbbf24'].map((c, i) => (
              <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '2px solid var(--bg)', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#060a0e' }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span>Join students already practicing</span>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'var(--lime)', color: '#060a0e', borderRadius: 13, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(163,230,53,.3)' }}>
            Start for free <ArrowIcon />
          </Link>
          <Link href="/bank" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: 'var(--sf)', color: 'var(--tx2)', border: '1px solid var(--line2)', borderRadius: 13, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Browse questions
          </Link>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--sf)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'clamp(24px,6vw,72px)', flexWrap: 'wrap' }}>
          {[
            { val: '2,400+', label: 'SAT questions' },
            { val: '3',      label: 'difficulty levels' },
            { val: '15+',    label: 'skill domains' },
            { val: '1400+',  label: 'avg target score' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, color: 'var(--lime-dk)', letterSpacing: '-1px', fontFamily: 'var(--mono)' }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(48px,8vw,80px) 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime-dk)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Everything you need</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, letterSpacing: '-1px', color: 'var(--tx)' }}>Built for the digital SAT</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 18, padding: '24px 20px' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 16 }}>
                <f.Icon />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCORE PREDICTOR TEASER ───────────────────────── */}
      <section style={{ background: 'var(--sf)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: 'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* Left: text */}
          <div style={{ flex: '1 1 300px', maxWidth: 440 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Score Predictor</div>
            <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900, letterSpacing: '-.8px', color: 'var(--tx)', marginBottom: 16, lineHeight: 1.2 }}>
              Know your score<br/>before test day.
            </h2>
            <p style={{ fontSize: 14, color: 'var(--tx3)', lineHeight: 1.75, marginBottom: 24 }}>
              After answering just 10 questions per section, Nexus calculates your predicted SAT score in real time — broken down by Reading &amp; Writing and Math. Watch it climb as you practice.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['Updates live after every answer', 'Separate R&W and Math scores', 'Based on real SAT scoring curves'].map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--tx2)' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--lime-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon /></span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'var(--lime)', color: '#060a0e', borderRadius: 11, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Try it free <ArrowIcon />
            </Link>
          </div>

          {/* Right: mock score card */}
          <div style={{ flex: '0 0 auto', width: 260 }}>
            <div style={{ background: 'var(--sf2)', border: '1px solid var(--line2)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Your predicted score</div>
              <div style={{ fontSize: 64, fontWeight: 900, color: 'var(--g-tx)', letterSpacing: '-3px', lineHeight: 1.1, marginBottom: 4 }}>1480</div>
              <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 20 }}>R&amp;W 740 · Math 740</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {[
                  { label: 'R&W', pct: 88, color: 'var(--lime)' },
                  { label: 'Math', pct: 74, color: '#818cf8' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.pct}%</div>
                    <div style={{ fontSize: 10, color: 'var(--tx4)', marginTop: 2 }}>{s.label} acc.</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--lime-dim)', border: '1px solid rgba(163,230,53,.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--lime-dk)', fontWeight: 600 }}>
                Based on 47 questions answered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(48px,8vw,80px) 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime-dk)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Student results</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-.8px', color: 'var(--tx)' }}>Real scores. Real students.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 18, padding: '22px 20px' }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--lime)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ))}
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--tx2)', lineHeight: 1.7, marginBottom: 16 }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx4)', marginTop: 1 }}>Digital SAT</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--g-tx)', letterSpacing: '-.5px' }}>{t.score}</div>
                  <div style={{ fontSize: 10, color: 'var(--tx4)' }}>from {t.prev}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{ background: 'var(--sf)', borderTop: '1px solid var(--line)', padding: 'clamp(48px,8vw,80px) 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px,5vw,42px)', fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--tx)', marginBottom: 16, lineHeight: 1.1 }}>
            Start raising your<br/>SAT score today.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--tx3)', lineHeight: 1.7, marginBottom: 32 }}>
            Free forever. No ads. No subscriptions. Just the best SAT prep you can find.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'var(--lime)', color: '#060a0e', borderRadius: 13, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(163,230,53,.25)' }}>
              Create free account <ArrowIcon />
            </Link>
            <Link href="/bank" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 22px', background: 'transparent', color: 'var(--tx3)', border: '1px solid var(--line2)', borderRadius: 13, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
              Browse without signing up
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
