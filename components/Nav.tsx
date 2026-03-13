'use client'
// components/Nav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const LINKS = [
  { href: '/bank',     label: 'Question Bank' },
  { href: '/tests',    label: 'Full-Length Tests' },
  { href: '/stats',    label: 'My Stats' },
  { href: '/saved',    label: 'Saved' },
  { href: '/mistakes', label: 'Mistakes' },
  { href: '/score',    label: 'Score Predictor' },
  { href: '/settings', label: 'Settings' },
]

export function Nav() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('nexus_theme') as 'dark' | 'light' | null
    const t = saved || 'dark'
    setTheme(t)
    document.documentElement.dataset.theme = t
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem('nexus_theme', next)
  }

  return (
    <nav style={{
      height: 'var(--nav-h)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      borderBottom: '1px solid var(--line)',
      background: 'var(--sf)',
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 400,
      gap: 0,
    }}>
      {/* Logo */}
      <Link href="/bank" style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 8, textDecoration: 'none' }}>
        <div style={{
          width: 26, height: 26,
          background: 'var(--lime)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: '#060a0e', flexShrink: 0,
        }}>N</div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.4px' }}>Nexus</span>
      </Link>

      {/* Separator */}
      <div style={{ width: 1, height: 22, background: 'var(--line2)', margin: '0 8px', flexShrink: 0 }} />

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--lime-dk)' : 'var(--tx3)',
                background: active ? 'var(--lime-dim)' : 'none',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'background .12s, color .12s',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', flexShrink: 0 }}>
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={{
            width: 32, height: 32,
            borderRadius: 7,
            border: '1px solid var(--line2)',
            background: 'var(--sf2)',
            color: 'var(--tx3)',
            fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        <Link href="/settings" style={{
          padding: '6px 13px',
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--tx2)',
          border: '1px solid var(--line2)',
          background: 'none',
          textDecoration: 'none',
          cursor: 'pointer',
        }}>Log in</Link>
        <Link href="/settings" style={{
          padding: '6px 13px',
          borderRadius: 8,
          fontSize: 12.5,
          fontWeight: 600,
          color: '#060a0e',
          background: 'var(--lime)',
          border: 'none',
          textDecoration: 'none',
          cursor: 'pointer',
        }}>Sign up</Link>
      </div>
    </nav>
  )
}