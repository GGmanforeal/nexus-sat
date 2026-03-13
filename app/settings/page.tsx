'use client'
// app/settings/page.tsx
import { useEffect, useState } from 'react'
import { sessionStore } from '@/lib/store/session'

const ADMIN_PIN = 'nexus2025'

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

export default function SettingsPage() {
  const [creds, setCreds]   = useState<{ url: string; key: string; table: string } | null>(null)
  const [theme, setTheme]   = useState<'dark' | 'light'>('dark')
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass]   = useState('')
  const [authName, setAuthName]   = useState('')
  const [authMode, setAuthMode]   = useState<'login' | 'signup'>('login')
  const [authMsg, setAuthMsg]     = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<{ email: string; name: string } | null>(null)

  // Admin — completely invisible. Press Ctrl+Shift+A to reveal.
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [pinInput, setPinInput]           = useState('')
  const [pinError, setPinError]           = useState(false)
  const [showPinField, setShowPinField]   = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('nexus_creds')
    if (raw) setCreds(JSON.parse(raw))
    const t = (localStorage.getItem('nexus_theme') as 'dark' | 'light') || 'dark'
    setTheme(t)
    if (sessionStorage.getItem('nexus_admin') === '1') setAdminUnlocked(true)
    const u = localStorage.getItem('nexus_user')
    if (u) { try { setLoggedInUser(JSON.parse(u)) } catch {} }
    // Secret keyboard shortcut — Ctrl+Shift+A toggles admin PIN field
    const hk = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') setShowPinField(v => !v)
    }
    window.addEventListener('keydown', hk)
    return () => window.removeEventListener('keydown', hk)
  }, [])

  const tryPin = () => {
    if (pinInput === ADMIN_PIN) {
      setAdminUnlocked(true)
      sessionStorage.setItem('nexus_admin', '1')
      setPinError(false); setShowPinField(false); setPinInput('')
    } else {
      setPinError(true); setPinInput('')
    }
  }

  const applyTheme = (t: 'dark' | 'light') => {
    setTheme(t)
    document.documentElement.dataset.theme = t
    localStorage.setItem('nexus_theme', t)
  }

  const forgetCreds = () => {
    if (!confirm('Remove saved database credentials?')) return
    localStorage.removeItem('nexus_creds')
    setCreds(null)
  }

  const clearSession = () => {
    if (!confirm('Clear all session data (stats, saved, mistakes)?')) return
    sessionStore.clearSession()
    alert('Session cleared.')
  }

  const doAuth = async () => {
    if (!authEmail || !authPass) { setAuthMsg('Enter email and password.'); return }
    if (authMode === 'signup' && !authName) { setAuthMsg('Enter your name.'); return }
    setAuthLoading(true); setAuthMsg('')
    const endpoint = authMode === 'login' ? 'token?grant_type=password' : 'signup'
    try {
      const body: any = { email: authEmail, password: authPass }
      if (authMode === 'signup') body.data = { name: authName }
      const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      const errMsg: string = data.error_description || data.error || data.msg || ''
      if (errMsg) {
        if (/already registered|user already exists|email.*taken/i.test(errMsg)) {
          setAuthMsg('An account with this email already exists. Please log in instead.')
          setAuthMode('login')
        } else if (/invalid.*credentials|invalid login/i.test(errMsg)) {
          setAuthMsg('Incorrect email or password.')
        } else if (/email.*confirm/i.test(errMsg)) {
          setAuthMsg('Please confirm your email first — check your inbox.')
        } else {
          setAuthMsg(errMsg)
        }
      } else if (data.access_token) {
        const name = data.user?.user_metadata?.name || authEmail.split('@')[0]
        const u = { email: authEmail, name }
        localStorage.setItem('nexus_token', data.access_token)
        localStorage.setItem('nexus_user', JSON.stringify(u))
        setLoggedInUser(u)
        window.dispatchEvent(new Event('nexus_auth_change'))
        setAuthMsg('Logged in!')
      } else {
        setAuthMsg('Check your email to confirm your account, then come back to log in.')
      }
    } catch (e: any) {
      setAuthMsg(e.message || 'Auth failed.')
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('nexus_token')
    localStorage.removeItem('nexus_user')
    setLoggedInUser(null)
    setAuthMsg('')
    window.dispatchEvent(new Event('nexus_auth_change'))
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '36px 20px 80px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 4 }}>Settings</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 28 }}>Manage your Nexus account and preferences.</div>

      {/* ── ADMIN — invisible, Ctrl+Shift+A reveals ── */}
      {showPinField && !adminUnlocked && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Admin Access</div>
          <div style={{ display: 'flex', gap: 7 }}>
            <input value={pinInput} onChange={e => { setPinInput(e.target.value); setPinError(false) }}
              onKeyDown={e => e.key === 'Enter' && tryPin()}
              placeholder="PIN" type="password" autoFocus
              style={{ ...inp, flex: 1, borderColor: pinError ? 'var(--r-tx)' : 'var(--line2)' }} />
            <Btn onClick={tryPin} lime>Enter</Btn>
            <Btn onClick={() => { setShowPinField(false); setPinInput(''); setPinError(false) }}>✕</Btn>
          </div>
          {pinError && <p style={{ fontSize: 12, color: 'var(--r-tx)', marginTop: 5 }}>Incorrect PIN</p>}
        </div>
      )}
      {adminUnlocked && (
        <Group title="Admin Panel">
          <Row label="Supabase URL" desc={creds?.url ?? 'Not set'} />
          <Row label="Table" desc={creds?.table ?? 'sat_questions'} />
          <Row label="Status" desc={creds ? 'Connected' : 'Not connected'} />
          <Row label="Forget credentials">
            <DangerBtn onClick={forgetCreds}>Forget</DangerBtn>
          </Row>
          <div style={{ padding: '8px 16px' }}>
            <button onClick={() => { sessionStorage.removeItem('nexus_admin'); setAdminUnlocked(false) }}
              style={{ fontSize: 11, color: 'var(--tx4)', border: 'none', background: 'none', cursor: 'pointer' }}>
              Lock panel
            </button>
          </div>
        </Group>
      )}

      {/* ── ACCOUNT ── */}
      <Group title="Account">
        <div style={{ padding: '16px' }}>
          {loggedInUser ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#060a0e', flexShrink: 0 }}>
                  {loggedInUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)' }}>{loggedInUser.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--tx3)', marginTop: 2 }}>{loggedInUser.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a href="/profile" style={{ ...linkBtn, background: 'var(--sf3)', color: 'var(--tx2)', border: '1px solid var(--line2)' }}>My Profile</a>
                <a href="/stats" style={{ ...linkBtn, background: 'var(--sf3)', color: 'var(--tx2)', border: '1px solid var(--line2)' }}>My Stats</a>
                <button onClick={logout} style={{ ...linkBtn, background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)', cursor: 'pointer' }}>Log out</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {(['login', 'signup'] as const).map(m => (
                  <button key={m} onClick={() => { setAuthMode(m); setAuthMsg('') }}
                    style={{ padding: '5px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: authMode === m ? 'var(--lime)' : 'var(--sf3)',
                      color: authMode === m ? '#060a0e' : 'var(--tx3)', border: 'none' }}>
                    {m === 'login' ? 'Log in' : 'Sign up'}
                  </button>
                ))}
              </div>
              {authMode === 'signup' && (
                <input value={authName} onChange={e => setAuthName(e.target.value)}
                  placeholder="Your full name" style={{ ...inp, marginBottom: 8 }} />
              )}
              <input value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                placeholder="Email address" type="email" style={{ ...inp, marginBottom: 8 }} />
              <input value={authPass} onChange={e => setAuthPass(e.target.value)}
                placeholder="Password (min. 6 chars)" type="password" style={inp} />
              {authMsg && (
                <div style={{ fontSize: 13, padding: '9px 13px', borderRadius: 8, marginTop: 10,
                  background: authMsg.startsWith('Logged') ? 'var(--g-bg)' : 'var(--r-bg)',
                  color: authMsg.startsWith('Logged') ? 'var(--g-tx)' : 'var(--r-tx)',
                  border: `1px solid ${authMsg.startsWith('Logged') ? 'var(--g-ln)' : 'var(--r-ln)'}`,
                  lineHeight: 1.55 }}>
                  {authMsg}
                </div>
              )}
              <button onClick={doAuth} disabled={authLoading}
                style={{ marginTop: 12, padding: '10px 20px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: authLoading ? 'default' : 'pointer', opacity: authLoading ? .7 : 1 }}>
                {authLoading ? 'Working…' : authMode === 'login' ? 'Log in' : 'Create account'}
              </button>
              {authMode === 'signup' && (
                <p style={{ fontSize: 12, color: 'var(--tx4)', marginTop: 10, lineHeight: 1.5 }}>
                  After signing up, check your email for a confirmation link. Click it and you'll be logged in automatically.
                </p>
              )}
            </>
          )}
        </div>
      </Group>

      {/* ── APPEARANCE ── */}
      <Group title="Appearance">
        <Row label="Theme">
          <div style={{ display: 'flex', gap: 6 }}>
            <ThemeBtn active={theme === 'dark'}  onClick={() => applyTheme('dark')}>Dark</ThemeBtn>
            <ThemeBtn active={theme === 'light'} onClick={() => applyTheme('light')}>Light</ThemeBtn>
          </div>
        </Row>
      </Group>

      {/* ── DATA ── */}
      <Group title="Data">
        <Row label="Clear session" desc="Resets stats, saved questions, and mistakes">
          <DangerBtn onClick={clearSession}>Clear</DangerBtn>
        </Row>
      </Group>
    </div>
  )
}

/* ── Small helper components ── */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>{title}</div>
      {children}
    </div>
  )
}
function Row({ label, desc, children }: { label: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--line)', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: 'var(--tx)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2, wordBreak: 'break-all' }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}
function ThemeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: active ? 'var(--lime)' : 'none', color: active ? '#060a0e' : 'var(--tx2)', border: `1px solid ${active ? 'var(--lime)' : 'var(--line2)'}` }}>{children}</button>
  )
}
function DangerBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 14px', background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{children}</button>
  )
}
function Btn({ onClick, children, lime }: { onClick: () => void; children: React.ReactNode; lime?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '9px 14px', background: lime ? 'var(--lime)' : 'var(--sf2)', color: lime ? '#060a0e' : 'var(--tx2)', border: `1px solid ${lime ? 'var(--lime)' : 'var(--line2)'}`, borderRadius: 8, fontSize: 13, fontWeight: lime ? 700 : 500, cursor: 'pointer' }}>{children}</button>
  )
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: 'var(--sf2)', border: '1px solid var(--line2)',
  borderRadius: 9, fontSize: 13.5, color: 'var(--tx)', outline: 'none', display: 'block',
}
const linkBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block',
}
