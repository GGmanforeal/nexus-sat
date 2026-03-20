'use client'
// components/Nav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

const Icons = {
  bank:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  tests:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 12h6M9 17h4"/></svg>,
  stats:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  saved:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  mistakes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  score:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  account:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  moon:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  sun:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  logout:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  settings: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  profile:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
}

// Desktop nav links (shown in top bar on large screens)
const DESKTOP_LINKS = [
  { href: '/bank',     label: 'Question Bank', icon: 'bank'     as const },
  { href: '/tests',    label: 'Tests',         icon: 'tests'    as const },
  { href: '/stats',    label: 'Stats',         icon: 'stats'    as const },
  { href: '/saved',    label: 'Saved',         icon: 'saved'    as const },
  { href: '/mistakes', label: 'Mistakes',      icon: 'mistakes' as const },
  { href: '/score',    label: 'Score',         icon: 'score'    as const },
]

// Mobile bottom nav — icon + short label only
const MOBILE_LINKS = [
  { href: '/bank',     label: 'Bank',     icon: 'bank'     as const },
  { href: '/tests',    label: 'Tests',    icon: 'tests'    as const },
  { href: '/stats',    label: 'Stats',    icon: 'stats'    as const },
  { href: '/saved',    label: 'Saved',    icon: 'saved'    as const },
  { href: '/mistakes', label: 'Mistakes', icon: 'mistakes' as const },
  { href: '/score',    label: 'Score',    icon: 'score'    as const },
]

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

const NexusLogo = () => (
  <svg width="110" height="44" viewBox="0 0 220 88" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="110" cy="28" rx="52" ry="18" stroke="#5cb85c" strokeWidth="5" fill="none" transform="rotate(-20 110 28)"/>
    <circle cx="148" cy="13" r="6" fill="#5cb85c"/>
    <text x="110" y="76" textAnchor="middle" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="700" fontSize="28" letterSpacing="8" fill="#5cb85c">NEXUS</text>
  </svg>
)

export function Nav() {
  const pathname   = usePathname()
  const [theme, setTheme]       = useState<'dark'|'light'>('dark')
  const [user, setUser]         = useState<{email:string;name:string}|null>(null)
  const [mounted, setMounted]   = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const t = (localStorage.getItem('nexus_theme') as 'dark'|'light') || 'dark'
    setTheme(t); document.documentElement.dataset.theme = t
    const stored = localStorage.getItem('nexus_user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
    const token = localStorage.getItem('nexus_token')
    if (!stored && token) {
      fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => {
          if (d.email) {
            const u = { email: d.email, name: d.user_metadata?.name || d.email.split('@')[0] }
            setUser(u); localStorage.setItem('nexus_user', JSON.stringify(u))
          }
        }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const h = () => {
      const stored = localStorage.getItem('nexus_user')
      if (stored) { try { setUser(JSON.parse(stored)) } catch {} } else setUser(null)
    }
    window.addEventListener('nexus_auth_change', h)
    return () => window.removeEventListener('nexus_auth_change', h)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next); document.documentElement.dataset.theme = next
    localStorage.setItem('nexus_theme', next)
  }

  const logout = () => {
    localStorage.removeItem('nexus_token'); localStorage.removeItem('nexus_user')
    setUser(null); setDropOpen(false)
    window.dispatchEvent(new Event('nexus_auth_change'))
  }

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : ''

  return (
    <>
      {/* ── TOP NAV (desktop) ────────────────────────────── */}
      <nav style={{ height:'var(--nav-h)', display:'flex', alignItems:'center', padding:'0 14px', borderBottom:'1px solid var(--line)', background:'var(--sf)', position:'fixed', top:0, left:0, right:0, zIndex:400 }}>

        {/* Logo */}
        <Link href="/" style={{ display:'flex', alignItems:'center', marginRight:12, textDecoration:'none', flexShrink:0 }}>
          <NexusLogo />
        </Link>

        <div className="nav-divider" style={{ width:1, height:22, background:'var(--line2)', margin:'0 4px', flexShrink:0 }} />

        {/* Desktop nav links — hidden on mobile via CSS */}
        <div className="nav-links" style={{ display:'flex', alignItems:'center', gap:1, flex:1, overflowX:'auto', scrollbarWidth:'none' } as React.CSSProperties}>
          {DESKTOP_LINKS.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:7, fontSize:13, fontWeight: active ? 600 : 500, color: active ? 'var(--lime-dk)' : 'var(--tx3)', background: active ? 'var(--lime-dim)' : 'none', textDecoration:'none', whiteSpace:'nowrap', transition:'background .12s, color .12s', flexShrink:0 }}>
                <span style={{ opacity: active ? 1 : 0.7 }}>{Icons[icon]}</span>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto', flexShrink:0 }}>
          <button onClick={toggleTheme} style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--line2)', background:'var(--sf2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--tx2)', flexShrink:0 }}>
            {theme === 'dark' ? Icons.moon : Icons.sun}
          </button>

          {mounted && (user ? (
            <div ref={dropRef} style={{ position:'relative' }}>
              <button onClick={() => setDropOpen(o => !o)} style={{ width:34, height:34, borderRadius:'50%', background:'var(--lime)', color:'#060a0e', border:'none', fontSize:12, fontWeight:900, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {initials}
              </button>
              {dropOpen && (
                <div style={{ position:'absolute', right:0, top:42, width:220, background:'var(--sf)', border:'1px solid var(--line2)', borderRadius:14, boxShadow:'0 12px 40px rgba(0,0,0,.4)', zIndex:600, overflow:'hidden' }}>
                  <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line)' }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{user.name}</div>
                    <div style={{ fontSize:12, color:'var(--tx3)', marginTop:2 }}>{user.email}</div>
                  </div>
                  {[
                    { label:'My Profile', href:'/profile',  icon: Icons.profile  },
                    { label:'Stats',      href:'/stats',    icon: Icons.stats    },
                    { label:'Settings',   href:'/settings', icon: Icons.settings },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setDropOpen(false)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', fontSize:13.5, color:'var(--tx2)', textDecoration:'none', borderBottom:'1px solid var(--line)' }}>
                      <span style={{ color:'var(--tx3)', flexShrink:0 }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                  <button onClick={logout} style={{ width:'100%', padding:'10px 16px', fontSize:13.5, color:'var(--r-tx)', background:'none', border:'none', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
                    {Icons.logout} Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth-btns" style={{ display:'flex', gap:6 }}>
              <Link href="/settings" style={{ padding:'6px 12px', borderRadius:8, fontSize:13, fontWeight:600, color:'var(--tx2)', border:'1px solid var(--line2)', background:'none', textDecoration:'none', whiteSpace:'nowrap' }}>Log in</Link>
              <Link href="/settings" style={{ padding:'6px 12px', borderRadius:8, fontSize:13, fontWeight:700, color:'#060a0e', background:'var(--lime)', border:'none', textDecoration:'none', whiteSpace:'nowrap' }}>Sign up</Link>
            </div>
          ))}
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────── */}
      {/* Only shown on mobile via CSS — completely separate from top nav */}
      <nav className="mob-bottom-nav" style={{ position:'fixed', bottom:0, left:0, right:0, height:64, background:'var(--sf)', borderTop:'1px solid var(--line)', zIndex:500, alignItems:'stretch', justifyContent:'space-around' }}>
        {[
          ...MOBILE_LINKS,
          { href: user ? '/profile' : '/settings', label: user ? (user.name?.split(' ')[0]?.slice(0,6) || 'Me') : 'Account', icon: 'account' as const },
        ].map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const isAcct = icon === 'account'
          return (
            <Link key={href} href={href} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, textDecoration:'none', flex:1, minWidth:0, color: active ? 'var(--lime-dk)' : 'var(--tx3)', background: active ? 'var(--lime-dim)' : 'transparent', borderTop: active ? '2px solid var(--lime-dk)' : '2px solid transparent', transition:'color .15s, background .15s' }}>
              {isAcct && user ? (
                <div style={{ width:22, height:22, borderRadius:'50%', background: active ? 'var(--lime)' : 'var(--sf3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color: active ? '#060a0e' : 'var(--tx3)' }}>{initials}</div>
              ) : (
                <span style={{ display:'flex' }}>{Icons[icon]}</span>
              )}
              <span style={{ fontSize:9.5, fontWeight: active ? 700 : 400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%', paddingInline:2 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
