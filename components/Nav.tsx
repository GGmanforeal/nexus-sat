'use client'
// components/Nav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

const LINKS = [
  { href: '/bank',     label: 'Question Bank', icon: '📖' },
  { href: '/tests',    label: 'Tests',          icon: '📋' },
  { href: '/stats',    label: 'Stats',          icon: '📊' },
  { href: '/saved',    label: 'Saved',          icon: '🔖' },
  { href: '/mistakes', label: 'Mistakes',       icon: '❌' },
  { href: '/score',    label: 'Score',          icon: '🎯' },
]

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

export function Nav() {
  const pathname = usePathname()
  const [theme, setTheme]       = useState<'dark' | 'light'>('dark')
  const [user, setUser]         = useState<{ email: string; name: string } | null>(null)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = (localStorage.getItem('nexus_theme') as 'dark' | 'light') || 'dark'
    setTheme(t)
    document.documentElement.dataset.theme = t

    // Check if user is logged in
    const token = localStorage.getItem('nexus_token')
    const storedUser = localStorage.getItem('nexus_user')
    if (storedUser) { setUser(JSON.parse(storedUser)); return }
    if (token) {
      // Fetch user info from Supabase
      fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(d => {
        if (d.email) {
          const name = d.user_metadata?.name || d.email.split('@')[0]
          const u = { email: d.email, name }
          setUser(u)
          localStorage.setItem('nexus_user', JSON.stringify(u))
        } else {
          // Token expired
          localStorage.removeItem('nexus_token')
          localStorage.removeItem('nexus_user')
        }
      }).catch(() => {})
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('nexus_theme', next)
  }

  const logout = () => {
    localStorage.removeItem('nexus_token')
    localStorage.removeItem('nexus_user')
    setUser(null); setDropOpen(false)
  }

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : ''

  return (
    <>
      {/* ── TOP NAV ───────────────────────────────────── */}
      <nav style={{
        height: 'var(--nav-h)', display: 'flex', alignItems: 'center',
        padding: '0 14px', borderBottom: '1px solid var(--line)',
        background: 'var(--sf)', position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 400, gap: 0,
      }}>
        {/* Logo */}
        <Link href="/bank" style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, background: 'var(--lime)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#060a0e' }}>N</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.4px' }}>Nexus</span>
        </Link>

        <div style={{ width: 1, height: 22, background: 'var(--line2)', margin: '0 8px', flexShrink: 0 }} />

        {/* Links — scrollable on mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} style={{
                padding: '5px 11px', borderRadius: 6, fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--lime-dk)' : 'var(--tx3)',
                background: active ? 'var(--lime-dim)' : 'none',
                textDecoration: 'none', whiteSpace: 'nowrap',
                transition: 'background .12s, color .12s', flexShrink: 0,
              }}>{label}</Link>
            )
          })}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 8, flexShrink: 0 }}>
          <button onClick={toggleTheme} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid var(--line2)', background: 'var(--sf2)', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          {user ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              {/* Avatar button */}
              <button onClick={() => setDropOpen(o => !o)} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--lime)', color: '#060a0e',
                border: 'none', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{initials}</button>
              {/* Dropdown */}
              {dropOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 40, width: 220,
                  background: 'var(--sf)', border: '1px solid var(--line2)',
                  borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.3)',
                  zIndex: 600, overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--tx)' }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{user.email}</div>
                  </div>
                  {[{ label: '👤 My Profile', href: '/profile' }, { label: '⚙️ Settings', href: '/settings' }, { label: '📊 My Stats', href: '/stats' }].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setDropOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 13.5, color: 'var(--tx2)', textDecoration: 'none', borderBottom: '1px solid var(--line)' }}>{item.label}</Link>
                  ))}
                  <button onClick={logout} style={{ width: '100%', padding: '10px 16px', fontSize: 13.5, color: 'var(--r-tx)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>🚪 Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/settings" style={{ padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--tx2)', border: '1px solid var(--line2)', background: 'none', textDecoration: 'none' }}>Log in</Link>
              <Link href="/settings" style={{ padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#060a0e', background: 'var(--lime)', border: 'none', textDecoration: 'none' }}>Sign up</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────── */}
      <nav className="mob-bottom-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 60, background: 'var(--sf)', borderTop: '1px solid var(--line)',
        zIndex: 400, alignItems: 'center', justifyContent: 'space-around',
        padding: '0 4px',
      }}>
        {[...LINKS, { href: '/settings', label: 'Profile', icon: user ? '👤' : '⚙️' }].map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '6px 8px', borderRadius: 8, textDecoration: 'none',
              color: active ? 'var(--lime-dk)' : 'var(--tx4)',
              background: active ? 'var(--lime-dim)' : 'none',
              minWidth: 44, flex: 1,
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
              <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}