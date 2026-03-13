'use client'
// app/auth/callback/page.tsx
// Handles Supabase email-confirmation redirect.
// Supabase sends user to /auth/callback#access_token=...&type=signup
// We read the token, save session, redirect home — user is logged in.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [msg, setMsg] = useState('Confirming your account…')

  useEffect(() => {
    const hash   = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const token  = params.get('access_token')
    const errorDesc = params.get('error_description')

    if (errorDesc) {
      setStatus('error')
      setMsg(decodeURIComponent(errorDesc.replace(/\+/g, ' ')))
      return
    }

    // Hash-based token (default Supabase behaviour)
    if (token) {
      fetchUserAndSave(token)
      return
    }

    // PKCE / code-based flow (query string ?code=xxx)
    const qp   = new URLSearchParams(window.location.search)
    const code = qp.get('code')
    if (code) {
      fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_code: code }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.access_token) fetchUserAndSave(data.access_token)
          else handleError('Could not exchange code. Please try logging in.')
        })
        .catch(() => handleError('Network error. Please try logging in.'))
      return
    }

    handleError('No confirmation token found. The link may have expired.')

    function fetchUserAndSave(tk: string) {
      fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${tk}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data?.email) {
            const name = data.user_metadata?.name || data.email.split('@')[0]
            const u = { email: data.email, name }
            localStorage.setItem('nexus_token', tk)
            localStorage.setItem('nexus_user', JSON.stringify(u))
            window.dispatchEvent(new Event('nexus_auth_change'))
            setStatus('success')
            setMsg(`Welcome to Nexus, ${name}! Taking you to your dashboard…`)
            setTimeout(() => router.push('/bank'), 1600)
          } else {
            handleError('Could not verify your account. Please log in manually.')
          }
        })
        .catch(() => handleError('Something went wrong. Please log in manually.'))
    }

    function handleError(m: string) {
      setStatus('error')
      setMsg(m)
    }
  }, [router])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - var(--nav-h))', padding: 24,
    }}>
      <div style={{
        background: status === 'success' ? 'var(--g-bg)' : status === 'error' ? 'var(--r-bg)' : 'var(--sf)',
        border: `1px solid ${status === 'success' ? 'var(--g-ln)' : status === 'error' ? 'var(--r-ln)' : 'var(--line)'}`,
        borderRadius: 20, padding: '48px 36px', maxWidth: 420, width: '100%',
        textAlign: 'center', animation: 'fadeUp .3s ease',
      }}>
        {/* Icon */}
        {status === 'loading' ? (
          <div className="spinner" style={{ margin: '0 auto 24px' }} />
        ) : (
          <div style={{
            width: 60, height: 60, borderRadius: '50%', margin: '0 auto 24px',
            background: status === 'success' ? 'var(--g-tx)' : 'var(--r-tx)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 900, color: '#fff',
          }}>
            {status === 'success' ? '✓' : '✕'}
          </div>
        )}

        {/* Nexus logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, background: 'var(--lime)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#060a0e' }}>N</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx)', letterSpacing: '-.3px' }}>Nexus</span>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx)', marginBottom: 10, letterSpacing: '-.3px' }}>
          {status === 'loading' ? 'Verifying your account' : status === 'success' ? 'Email confirmed!' : 'Verification failed'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--tx3)', lineHeight: 1.65 }}>{msg}</div>

        {status === 'error' && (
          <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/settings" style={{ padding: '10px 22px', background: 'var(--lime)', color: '#060a0e', borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Log in →
            </a>
            <a href="/bank" style={{ padding: '10px 18px', background: 'var(--sf2)', color: 'var(--tx2)', border: '1px solid var(--line2)', borderRadius: 9, fontSize: 14, textDecoration: 'none' }}>
              Go home
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
