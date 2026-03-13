'use client'
// app/profile/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sessionStore } from '@/lib/store/session'

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

interface User { email: string; name: string }

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
  const [user, setUser]           = useState<User | null>(null)
  const [loading, setLoading]     = useState(true)
  const [editName, setEditName]   = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [stats, setStats]   = useState(sessionStore.getStats())
  const [score, setScore]   = useState(sessionStore.getPredictedScore())
  const [joinDate, setJoinDate] = useState('')
  const [tab, setTab]       = useState<'overview' | 'breakdown'>('overview')

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
      <div style={{ fontSize: 56 }}>👤</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx)' }}>Not logged in</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', maxWidth: 300 }}>Create an account to save your progress and view your profile.</div>
      <Link href="/settings" style={{ marginTop: 8, padding: '10px 24px', background: 'var(--lime)', color: '#060a0e', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
        Sign up / Log in →
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 16px 80px' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 18, padding: '24px 22px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'var(--lime)', opacity: .035, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#060a0e' }}>
              {initials}
            </div>
            {stats.total > 0 && (
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 18, height: 18, borderRadius: '50%', background: 'var(--g-tx)', border: '2px solid var(--sf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>✓</div>
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
                  style={{ padding: '4px 10px', background: 'none', color: 'var(--tx3)', border: '1px solid var(--line2)', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx)', letterSpacing: '-.4px' }}>{user.name}</div>
                <button onClick={() => setEditName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--tx4)', padding: 2 }}>✏️</button>
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 5 }}>{user.email}</div>
            {joinDate && <div style={{ fontSize: 11, color: 'var(--tx4)' }}>📅 Member since {fmtDate(joinDate)}</div>}
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

      {/* ── STAT CARDS ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <StatCard label="Answered" value={stats.total} sub="questions" />
        <StatCard label="Correct" value={stats.correct} sub="answers" accent="var(--g-tx)" />
        <StatCard label="Accuracy" value={stats.total ? `${stats.acc}%` : '—'}
          sub={stats.total ? `${stats.wrong} wrong` : 'no data'}
          accent={stats.acc >= 70 ? 'var(--g-tx)' : stats.acc >= 50 ? 'var(--a-tx)' : stats.total ? 'var(--r-tx)' : 'var(--tx3)'} />
        <StatCard label="Saved" value={savedCount} sub="bookmarks" accent="var(--lime-dk)" />
      </div>

      {/* ── TABS ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['overview', 'breakdown'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
            background: tab === t ? 'var(--lime)' : 'var(--sf2)',
            color: tab === t ? '#060a0e' : 'var(--tx3)',
          }}>{t === 'overview' ? '📊 Overview' : '🗂 Breakdown'}</button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────── */}
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
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--g-tx)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>💪 Strongest</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{bestDomain.domain}</div>
                  <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{bestDomain.section} · {bestDomain.pct}%</div>
                </div>
              )}
              {worstDomain && worstDomain.domain !== bestDomain?.domain && (
                <div style={{ flex: 1, minWidth: 140, background: 'var(--r-bg)', border: '1px solid var(--r-ln)', borderRadius: 13, padding: '13px 15px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--r-tx)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>🎯 Needs Work</div>
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
              { href: '/stats',    icon: '📊', label: 'Full Stats',        desc: 'Domain & skill breakdown' },
              { href: '/saved',    icon: '🔖', label: 'Saved Questions',   desc: `${savedCount} bookmarked` },
              { href: '/mistakes', icon: '❌', label: 'Mistake Review',    desc: `${stats.wrong} to review` },
              { href: '/score',    icon: '🎯', label: 'Score Predictor',   desc: 'Estimate your SAT score' },
              { href: '/settings', icon: '⚙️', label: 'Account Settings', desc: 'Theme, auth, credentials' },
            ].map(({ href, icon, label, desc }) => (
              <Link key={href} href={href}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 20px', borderBottom: '1px solid var(--line)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--sf2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tx)' }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 1 }}>{desc}</div>
                </div>
                <span style={{ color: 'var(--tx4)', fontSize: 18 }}>›</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── BREAKDOWN ────────────────────────────────────── */}
      {tab === 'breakdown' && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
          {domainRows.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--tx3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx2)', marginBottom: 6 }}>No data yet</div>
              <div style={{ fontSize: 13 }}>Answer questions in the bank to see your breakdown here.</div>
              <Link href="/bank" style={{ display: 'inline-block', marginTop: 16, padding: '9px 20px', background: 'var(--lime)', color: '#060a0e', borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Go to Question Bank →</Link>
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