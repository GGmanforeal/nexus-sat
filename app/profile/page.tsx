'use client'
// app/profile/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sessionStore } from '@/lib/store/session'

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

interface User { email: string; name: string }

/* ── SVG Icon set ── */
const Ic = {
  check:   <svg width="9"  height="9"  viewBox="0 0 24 24" fill="none" stroke="#fff"           strokeWidth="3"   strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  edit:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  close:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"    strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  calendar:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  user:    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--tx4)"      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  stats:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  saved:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  mistake: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  score:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  settings:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  overview:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"    strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  breakdown:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"   strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  strong:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--g-tx)"     strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round"><polyline points="22 4 12 14.01 9 11.01"/><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/></svg>,
  target:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--r-tx)"     strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  inbox:   <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--tx4)"      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
}

function RingChart({ pct, size = 90, stroke = 8, color = 'var(--lime)' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--sf3)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 18px', flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent || 'var(--tx)', letterSpacing: '-.4px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function Bar({ pct, color = 'var(--lime)' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 6, borderRadius: 4, background: 'var(--sf3)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width .5s ease' }} />
    </div>
  )
}

export default function ProfilePage() {
  const [user, setUser]             = useState<User | null>(null)
  const [loading, setLoading]       = useState(true)
  const [editName, setEditName]     = useState(false)
  const [nameInput, setNameInput]   = useState('')
  const [savingName, setSavingName] = useState(false)
  const [stats, setStats]   = useState(sessionStore.getStats())
  const [score, setScore]   = useState(sessionStore.getPredictedScore())
  const [joinDate, setJoinDate] = useState('')
  const [tab, setTab] = useState<'overview' | 'breakdown'>('overview')

  useEffect(() => {
    const stored = localStorage.getItem('nexus_user')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      setNameInput(u.name)
    }
    const jd = localStorage.getItem('nexus_join_date')
    if (!jd) {
      const now = new Date().toISOString()
      localStorage.setItem('nexus_join_date', now)
      setJoinDate(now)
    } else {
      setJoinDate(jd)
    }
    setLoading(false)
    const unsub = sessionStore.subscribe(() => {
      setStats(sessionStore.getStats())
      setScore(sessionStore.getPredictedScore())
    })
    return () => unsub()
  }, [])

  const saveName = async () => {
    if (!nameInput.trim() || !user) return
    setSavingName(true)
    const token = localStorage.getItem('nexus_token')
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          method: 'PUT',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { name: nameInput.trim() } }),
        })
      } catch {}
    }
    const updated = { ...user, name: nameInput.trim() }
    localStorage.setItem('nexus_user', JSON.stringify(updated))
    setUser(updated)
    setEditName(false)
    setSavingName(false)
  }

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
    catch { return '' }
  }

  const domainRows = Object.entries(stats.byDomain).map(([key, v]) => {
    const [sec, domain] = key.split('|||')
    const pct = Math.round((v.correct / v.total) * 100)
    return { section: /math/i.test(sec) ? 'Math' : 'English', domain, total: v.total, correct: v.correct, pct }
  }).sort((a, b) => a.section.localeCompare(b.section) || a.pct - b.pct)

  const bestDomain  = [...domainRows].sort((a, b) => b.pct - a.pct)[0]
  const worstDomain = [...domainRows].sort((a, b) => a.pct - b.pct)[0]
  const initials    = user?.name ? user.name.slice(0, 2).toUpperCase() : '?'
  const totalScore  = score.total
  const scoreColor  = totalScore ? (totalScore >= 1400 ? 'var(--g-tx)' : totalScore >= 1100 ? 'var(--a-tx)' : 'var(--r-tx)') : 'var(--tx3)'
  const savedCount  = Object.keys(sessionStore.get().saved).length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--nav-h))' }}>
      <div className="spinner" />
    </div>
  )

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--nav-h))', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--sf)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Ic.user}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx)' }}>Not logged in</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', maxWidth: 300 }}>Create an account to save your progress and view your profile.</div>
      <Link href="/settings" style={{ marginTop: 8, padding: '10px 24px', background: 'var(--lime)', color: '#060a0e', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
        Sign up / Log in
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 16px 80px' }}>

      {/* ── HERO ── */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 18, padding: '24px 22px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'var(--lime)', opacity: .035, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#060a0e' }}>
              {initials}
            </div>
            {stats.total > 0 && (
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 18, height: 18, borderRadius: '50%', background: 'var(--g-tx)', border: '2px solid var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Ic.check}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 140 }}>
            {editName ? (
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false) }}
                  autoFocus
                  style={{ fontSize: 17, fontWeight: 700, background: 'var(--sf2)', border: '1px solid var(--lime)', borderRadius: 8, padding: '4px 10px', color: 'var(--tx)', outline: 'none', width: 160 }} />
                <button onClick={saveName} disabled={savingName}
                  style={{ padding: '4px 12px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {savingName ? '…' : 'Save'}
                </button>
                <button onClick={() => setEditName(false)}
                  style={{ padding: '4px 10px', background: 'none', color: 'var(--tx3)', border: '1px solid var(--line2)', borderRadius: 7, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {Ic.close}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx)', letterSpacing: '-.4px' }}>{user.name}</div>
                <button onClick={() => setEditName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx4)', padding: 2, display: 'flex', alignItems: 'center' }}>
                  {Ic.edit}
                </button>
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 5 }}>{user.email}</div>
            {joinDate && (
              <div style={{ fontSize: 11, color: 'var(--tx4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {Ic.calendar}
                Member since {fmtDate(joinDate)}
              </div>
            )}
          </div>

          {/* Score badge */}
          <div style={{ textAlign: 'center', background: 'var(--sf2)', border: '1px solid var(--line2)', borderRadius: 14, padding: '12px 18px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Predicted SAT</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor, letterSpacing: '-1px' }}>{totalScore ?? '—'}</div>
            {(score.rw || score.math) ? (
              <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>
                {score.rw ? `R&W ${score.rw}` : ''}{score.rw && score.math ? ' · ' : ''}{score.math ? `Math ${score.math}` : ''}
              </div>
            ) : (
              <div style={{ fontSize: 10, color: 'var(--tx4)', marginTop: 2 }}>Answer 10+ per section</div>
            )}
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <StatCard label="Answered" value={stats.total}  sub="questions" />
        <StatCard label="Correct"  value={stats.correct} sub="answers" accent="var(--g-tx)" />
        <StatCard label="Accuracy" value={stats.total ? `${stats.acc}%` : '—'}
          sub={stats.total ? `${stats.wrong} wrong` : 'no data'}
          accent={stats.acc >= 70 ? 'var(--g-tx)' : stats.acc >= 50 ? 'var(--a-tx)' : stats.total ? 'var(--r-tx)' : 'var(--tx3)'} />
        <StatCard label="Saved"    value={savedCount} sub="bookmarks" accent="var(--lime-dk)" />
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['overview', 'breakdown'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: tab === t ? 'var(--lime)' : 'var(--sf2)',
            color: tab === t ? '#060a0e' : 'var(--tx3)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {t === 'overview' ? Ic.overview : Ic.breakdown}
            {t === 'overview' ? 'Overview' : 'Breakdown'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          {/* Section rings */}
          <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 22px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 16 }}>Performance by Section</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {(['English', 'Math'] as const).map(sec => {
                const s = stats.bySection[sec]
                const pct = s ? Math.round((s.correct / s.total) * 100) : 0
                const color = sec === 'Math' ? '#818cf8' : 'var(--lime)'
                return (
                  <div key={sec} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RingChart pct={s ? pct : 0} size={88} stroke={8} color={color} />
                      <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)' }}>{s ? `${pct}%` : '—'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{sec}</div>
                      <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{s ? `${s.correct}/${s.total} correct` : 'No data yet'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Highlights */}
          {domainRows.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              {bestDomain && (
                <div style={{ flex: 1, minWidth: 140, background: 'var(--g-bg)', border: '1px solid var(--g-ln)', borderRadius: 13, padding: '13px 15px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--g-tx)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {Ic.strong} Strongest
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{bestDomain.domain}</div>
                  <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{bestDomain.section} · {bestDomain.pct}%</div>
                </div>
              )}
              {worstDomain && worstDomain.domain !== bestDomain?.domain && (
                <div style={{ flex: 1, minWidth: 140, background: 'var(--r-bg)', border: '1px solid var(--r-ln)', borderRadius: 13, padding: '13px 15px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--r-tx)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {Ic.target} Needs Work
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{worstDomain.domain}</div>
                  <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{worstDomain.section} · {worstDomain.pct}%</div>
                </div>
              )}
            </div>
          )}

          {/* Quick links */}
          <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>Quick Access</div>
            {[
              { href: '/stats',    icon: Ic.stats,    label: 'Full Stats',        desc: 'Domain & skill breakdown' },
              { href: '/saved',    icon: Ic.saved,    label: 'Saved Questions',   desc: `${savedCount} bookmarked` },
              { href: '/mistakes', icon: Ic.mistake,  label: 'Mistake Review',    desc: `${stats.wrong} to review` },
              { href: '/score',    icon: Ic.score,    label: 'Score Predictor',   desc: 'Estimate your SAT score' },
              { href: '/settings', icon: Ic.settings, label: 'Account Settings',  desc: 'Theme, auth, credentials' },
            ].map(({ href, icon, label, desc }) => (
              <Link key={href} href={href}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px', borderBottom: '1px solid var(--line)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--sf2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--sf3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tx)' }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 1 }}>{desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tx4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── BREAKDOWN ── */}
      {tab === 'breakdown' && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
          {domainRows.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--tx3)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>{Ic.inbox}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx2)', marginBottom: 6 }}>No data yet</div>
              <div style={{ fontSize: 13 }}>Answer questions in the bank to see your breakdown here.</div>
              <Link href="/bank" style={{ display: 'inline-block', marginTop: 16, padding: '9px 20px', background: 'var(--lime)', color: '#060a0e', borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Go to Question Bank</Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>Domain Accuracy</div>
              {domainRows.map((row, i) => {
                const isMath = row.section === 'Math'
                const barColor = isMath ? '#818cf8' : 'var(--lime)'
                const accColor = row.pct >= 70 ? 'var(--g-tx)' : row.pct >= 50 ? 'var(--a-tx)' : 'var(--r-tx)'
                return (
                  <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: isMath ? 'rgba(129,140,248,.15)' : 'var(--lime-dim)',
                          color: isMath ? '#818cf8' : 'var(--lime-dk)' }}>{row.section}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tx)' }}>{row.domain}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{row.correct}/{row.total}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: accColor, minWidth: 36, textAlign: 'right' }}>{row.pct}%</span>
                      </div>
                    </div>
                    <Bar pct={row.pct} color={barColor} />
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
