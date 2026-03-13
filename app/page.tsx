'use client'
// app/page.tsx — landing page for guests, redirect to bank for logged-in users
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const FEATURES = [
  { icon: '📖', title: 'Question Bank', desc: 'Thousands of SAT questions organized by domain, skill, and difficulty.' },
  { icon: '⏱', title: 'Timed Tests', desc: 'Full-length and section-specific tests that mirror the real SAT format.' },
  { icon: '📊', title: 'Smart Analytics', desc: 'Track your accuracy by domain and watch your predicted score rise.' },
  { icon: '🔖', title: 'Review System', desc: 'Bookmark questions and review your mistakes until they stick.' },
]

export default function LandingPage() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('nexus_user')
    if (u) { router.replace('/bank'); return }
    setLoggedIn(false)
  }, [router])

  if (loggedIn === null) return null // wait for hydration

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px 100px', textAlign: 'center' }}>

      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, background: 'var(--lime)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#060a0e' }}>N</div>
        <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: 'var(--tx)' }}>Nexus</span>
      </div>

      <h1 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1.5px', marginBottom: 16, color: 'var(--tx)' }}>
        Score higher on the SAT.
        <span style={{ color: 'var(--lime-dk)' }}> Built for you.</span>
      </h1>
      <p style={{ fontSize: 16, color: 'var(--tx3)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 36px' }}>
        Adaptive practice, real SAT questions, and intelligent analytics — everything you need to crush test day.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
        <Link href="/settings" style={{ padding: '13px 30px', background: 'var(--lime)', color: '#060a0e', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', letterSpacing: '-.2px' }}>
          Get started free
        </Link>
        <Link href="/bank" style={{ padding: '13px 26px', background: 'var(--sf)', color: 'var(--tx2)', border: '1px solid var(--line2)', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
          Browse questions →
        </Link>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, textAlign: 'left', marginBottom: 48 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 18px' }}>
            <div style={{ fontSize: 26, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: 'var(--tx)' }}>{f.title}</div>
            <div style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 20, padding: '32px 24px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, letterSpacing: '-.3px' }}>Ready to start?</div>
        <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 20 }}>Free account. No credit card. Start practicing in 30 seconds.</div>
        <Link href="/settings" style={{ padding: '11px 28px', background: 'var(--lime)', color: '#060a0e', borderRadius: 11, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
          Create free account →
        </Link>
      </div>
    </div>
  )
}
