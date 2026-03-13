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
  // null = not yet checked, false = not logged in, object = logged in
  const [user, setUser]         = useState<{ email: string; name: string } | null | false>(false)
  const [mounted, setMounted]   = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const t = (localStorage.getItem('nexus_theme') as 'dark' | 'light') || 'dark'
    setTheme(t)
    document.documentElement.dataset.theme = t

    const storedUser = localStorage.getItem('nexus_user')
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)) } catch { setUser(null) }
      return
    }
    const token = localStorage.getItem('nexus_token')
    if (token) {
      fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(d => {
        if (d.email) {
          const name = d.user_metadata?.name || d.email.split('@')[0]
          const u = { email: d.email, name }
          setUser(u)
          localStorage.setItem('nexus_user', JSON.stringify(u))
        } else {
          localStorage.removeItem('nexus_token')
          localStorage.removeItem('nexus_user')
          setUser(null)
        }
      }).catch(() => setUser(null))
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Listen for login/logout events from settings page
  useEffect(() => {
    const h = () => {
      const stored = localStorage.getItem('nexus_user')
      if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
      else setUser(null)
    }
    window.addEventListener('nexus_auth_change', h)
    return () => window.removeEventListener('nexus_auth_change', h)
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

  const userObj = user && user !== false ? user : null
  const initials = userObj?.name ? userObj.name.slice(0, 2).toUpperCase() : ''

  return (
    <>
      {/* ── TOP NAV ───────────────────────────────────── */}
      <nav style={{
        height: 'var(--nav-h)', display: 'flex', alignItems: 'center',
        padding: '0 14px', borderBottom: '1px solid var(--line)',
        background: 'var(--sf)', position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 400,
      }}>
        {/* Logo */}
        <Link href="/bank" style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, background: 'var(--lime)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#060a0e' }}>N</div>
          <span className="nav-wordmark" style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.4px' }}>Nexus</span>
        </Link>

        <div className="nav-divider" style={{ width: 1, height: 22, background: 'var(--line2)', margin: '0 8px', flexShrink: 0 }} />

        {/* Links — hidden on mobile (bottom nav used instead) */}
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' } as React.CSSProperties}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', flexShrink: 0 }}>
          <button onClick={toggleTheme} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid var(--line2)', background: 'var(--sf2)', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          {/* Only render auth UI after mount to avoid hydration flicker */}
          {mounted && (
            userObj ? (
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button onClick={() => setDropOpen(o => !o)} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--lime)', color: '#060a0e',
                  border: 'none', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{initials}</button>
                {dropOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 40, width: 220,
                    background: 'var(--sf)', border: '1px solid var(--line2)',
                    borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.35)',
                    zIndex: 600, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--tx)' }}>{userObj.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{userObj.email}</div>
                    </div>
                    {[{ label: '👤 My Profile', href: '/profile' }, { label: '⚙️ Settings', href: '/settings' }, { label: '📊 My Stats', href: '/stats' }].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setDropOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 13.5, color: 'var(--tx2)', textDecoration: 'none', borderBottom: '1px solid var(--line)' }}>{item.label}</Link>
                    ))}
                    <button onClick={logout} style={{ width: '100%', padding: '10px 16px', fontSize: 13.5, color: 'var(--r-tx)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>🚪 Log out</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-btns" style={{ display: 'flex', gap: 6 }}>
                <Link href="/settings" style={{ padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--tx2)', border: '1px solid var(--line2)', background: 'none', textDecoration: 'none', whiteSpace: 'nowrap' }}>Log in</Link>
                <Link href="/settings" style={{ padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#060a0e', background: 'var(--lime)', border: 'none', textDecoration: 'none', whiteSpace: 'nowrap' }}>Sign up</Link>
              </div>
            )
          )}
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────── */}
      <nav className="mob-bottom-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 62, background: 'var(--sf)', borderTop: '1px solid var(--line)',
        zIndex: 500, alignItems: 'stretch', justifyContent: 'space-around',
        padding: '0',
      }}>
        {[...LINKS, { href: userObj ? '/profile' : '/settings', label: userObj ? userObj.name.split(' ')[0] : 'Account', icon: userObj ? initials : '👤' }].map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const isProfile = href === '/profile' || href === '/settings'
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, textDecoration: 'none', flex: 1,
              color: active ? 'var(--lime-dk)' : 'var(--tx3)',
              background: active ? 'var(--lime-dim)' : 'transparent',
              borderTop: active ? '2px solid var(--lime-dk)' : '2px solid transparent',
              transition: 'color .15s, background .15s',
            }}>
              {isProfile && userObj ? (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: active ? 'var(--lime)' : 'var(--sf3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: active ? '#060a0e' : 'var(--tx3)' }}>{initials}</div>
              ) : (
                <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
              )}
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap', letterSpacing: '.2px' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}