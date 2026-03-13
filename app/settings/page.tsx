'use client'
// app/settings/page.tsx
import { useEffect, useState } from 'react'
import { sessionStore } from '@/lib/store/session'

const ADMIN_PIN = 'nexus2025' // your private PIN

export default function SettingsPage() {
  const [creds, setCreds] = useState<{ url: string; key: string; table: string } | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass]   = useState('')
  const [authName, setAuthName]   = useState('')
  const [authMode, setAuthMode]   = useState<'login' | 'signup'>('login')
  const [authMsg, setAuthMsg]     = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<{ email: string; name: string } | null>(null)

  // Admin gate — invisible, Ctrl+Shift+A reveals
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [pinInput, setPinInput]           = useState('')
  const [pinError, setPinError]           = useState(false)
  const [showPinField, setShowPinField]   = useState(false)

  const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

  useEffect(() => {
    const raw = localStorage.getItem('nexus_creds')
    if (raw) setCreds(JSON.parse(raw))
    const t = (localStorage.getItem('nexus_theme') as 'dark' | 'light') || 'dark'
    setTheme(t)
    if (sessionStorage.getItem('nexus_admin') === '1') setAdminUnlocked(true)
    const u = localStorage.getItem('nexus_user')
    if (u) setLoggedInUser(JSON.parse(u))
    const hk = (e: KeyboardEvent) => { if (e.ctrlKey && e.shiftKey && e.key === 'A') setShowPinField(v => !v) }
    window.addEventListener('keydown', hk)
    return () => window.removeEventListener('keydown', hk)
  }, [])

  const tryPin = () => {
    if (pinInput === ADMIN_PIN) {
      setAdminUnlocked(true)
      sessionStorage.setItem('nexus_admin', '1')
      setPinError(false); setShowPinField(false)
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
      // Detect "already registered" and give a clear message
      const errMsg: string = data.error_description || data.error || data.msg || ''
      if (errMsg) {
        if (/already registered|user already exists|email.*taken/i.test(errMsg)) {
          setAuthMsg('⚠️ An account with this email already exists. Please log in instead.')
          setAuthMode('login')
        } else {
          setAuthMsg(errMsg)
        }
      } else {
        if (data.access_token) {
          const name = data.user?.user_metadata?.name || authEmail.split('@')[0]
          const u = { email: authEmail, name }
          localStorage.setItem('nexus_token', data.access_token)
          localStorage.setItem('nexus_user', JSON.stringify(u))
          setLoggedInUser(u)
          // Dispatch event so Nav picks up the change
          window.dispatchEvent(new Event('nexus_auth_change'))
          setAuthMsg('✓ Logged in successfully!')
        } else {
          setAuthMsg('✓ Check your email to confirm your account.')
        }
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
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '36px 28px 60px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.4px', marginBottom: 4 }}>Settings</div>
      <div style={{ fontSize: 14, color: 'var(--tx3)', marginBottom: 32 }}>Manage your Nexus preferences and account.</div>

      {/* ── DATABASE — admin only ──────────────────── */}
      {adminUnlocked ? (
        <Group title="🔒 Database Connection (Admin)">
          <Row label="Supabase Project" desc={creds?.url || 'Not connected'}>
            <a href="/bank" style={{ padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#060a0e', background: 'var(--lime)', textDecoration: 'none' }}>Reconnect</a>
          </Row>
          <Row label="Table" desc={creds?.table || 'sat_questions'} />
          <Row label="Status" desc={creds ? '🟢 Credentials saved in browser' : '🔴 Not connected'} />
          <Row label="Forget Credentials" desc="Removes stored Supabase URL and key from this browser">
            <DangerBtn onClick={forgetCreds}>Forget</DangerBtn>
          </Row>
          <div style={{ padding: '10px 18px' }}>
            <button onClick={() => { sessionStorage.removeItem('nexus_admin'); setAdminUnlocked(false) }}
              style={{ fontSize: 12, color: 'var(--tx4)', cursor: 'pointer', border: 'none', background: 'none' }}>
              🔒 Lock admin panel
            </button>
          </div>
        </Group>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {!showPinField ? (
            <button onClick={() => setShowPinField(true)} style={{
              fontSize: 12.5, color: 'var(--tx4)', cursor: 'pointer',
              border: '1px solid var(--line)', background: 'var(--sf2)',
              borderRadius: 8, padding: '7px 14px',
            }}>🔒 Admin access</button>
          ) : (
            <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 13, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.4px' }}>Admin PIN</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={pinInput}
                  onChange={e => { setPinInput(e.target.value); setPinError(false) }}
                  onKeyDown={e => e.key === 'Enter' && tryPin()}
                  placeholder="Enter PIN"
                  type="password"
                  autoFocus
                  style={{ ...inputStyle, flex: 1, borderColor: pinError ? 'var(--r-tx)' : 'var(--line2)' }}
                />
                <button onClick={tryPin} style={{ padding: '9px 16px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Unlock</button>
                <button onClick={() => { setShowPinField(false); setPinError(false); setPinInput('') }}
                  style={{ padding: '9px 10px', background: 'none', color: 'var(--tx3)', border: '1px solid var(--line2)', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>✕</button>
              </div>
              {pinError && <div style={{ fontSize: 12, color: 'var(--r-tx)', marginTop: 6 }}>Incorrect PIN</div>}
            </div>
          )}
        </div>
      )}

      {/* Auth / Profile */}
      <Group title="Account">
        <div style={{ padding: '16px 18px' }}>
          {loggedInUser ? (
            <>
              {/* Profile card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#060a0e', flexShrink: 0 }}>
                  {loggedInUser.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{loggedInUser.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 2 }}>{loggedInUser.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="/stats" style={{ padding: '8px 16px', background: 'var(--sf3)', color: 'var(--tx2)', border: '1px solid var(--line2)', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>📊 My Stats</a>
                <button onClick={logout} style={{ padding: '8px 16px', background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🚪 Log out</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {(['login', 'signup'] as const).map(m => (
                  <button key={m} onClick={() => setAuthMode(m)} style={{
                    padding: '5px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                    background: authMode === m ? 'var(--lime)' : 'var(--sf3)',
                    color: authMode === m ? '#060a0e' : 'var(--tx3)',
                    border: 'none', cursor: 'pointer',
                  }}>{m === 'login' ? 'Log in' : 'Sign up'}</button>
                ))}
              </div>
              {authMode === 'signup' && (
                <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Your name"
                  style={{ ...inputStyle, marginBottom: 8 }} />
              )}
              <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email"
                style={inputStyle} type="email" />
              <input value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder="Password"
                style={{ ...inputStyle, marginTop: 8 }} type="password" />
              {authMsg && (
                <div style={{ fontSize: 12.5, padding: '8px 12px', borderRadius: 8, marginTop: 10,
                  background: authMsg.startsWith('✓') ? 'var(--g-bg)' : 'var(--r-bg)',
                  color: authMsg.startsWith('✓') ? 'var(--g-tx)' : 'var(--r-tx)',
                  border: `1px solid ${authMsg.startsWith('✓') ? 'var(--g-ln)' : 'var(--r-ln)'}` }}>{authMsg}</div>
              )}
              <button onClick={doAuth} style={{ marginTop: 12, padding: '9px 20px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                {authLoading ? 'Working…' : authMode === 'login' ? 'Log in →' : 'Create account →'}
              </button>
            </>
          )}
        </div>
      </Group>

      {/* Appearance */}
      <Group title="Appearance">
        <Row label="Theme">
          <div style={{ display: 'flex', gap: 6 }}>
            <ThemeBtn active={theme === 'dark'} onClick={() => applyTheme('dark')}>🌙 Dark</ThemeBtn>
            <ThemeBtn active={theme === 'light'} onClick={() => applyTheme('light')}>☀️ Light</ThemeBtn>
          </div>
        </Row>
      </Group>

      {/* Danger zone */}
      <Group title="Data">
        <Row label="Clear Session" desc="Resets stats, saved questions, and mistakes for this tab">
          <DangerBtn onClick={clearSession}>Clear</DangerBtn>
        </Row>
      </Group>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 13, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
      <div>
        <div style={{ fontSize: 13.5, color: 'var(--tx)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2, fontFamily: desc.startsWith('http') ? 'var(--mono)' : 'inherit' }}>{desc}</div>}
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
    <button onClick={onClick} style={{ padding: '7px 16px', background: 'var(--r-bg)', color: 'var(--r-tx)', border: '1px solid var(--r-ln)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{children}</button>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--sf2)', border: '1px solid var(--line2)',
  borderRadius: 8, fontSize: 13, color: 'var(--tx)', outline: 'none',
}
