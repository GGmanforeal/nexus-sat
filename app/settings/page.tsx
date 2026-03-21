'use client'
// app/settings/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sessionStore } from '@/lib/store/session'

const ADMIN_PIN = 'nexus2025'
const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

type MsgType = 'success' | 'info' | 'error'

export default function SettingsPage() {
  const [theme, setTheme]   = useState<'dark'|'light'>('dark')
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass]   = useState('')
  const [authName, setAuthName]   = useState('')
  const [authMode, setAuthMode]   = useState<'login'|'signup'>('login')
  const [msg, setMsg]             = useState('')
  const [msgType, setMsgType]     = useState<MsgType>('info')
  const [authLoading, setAuthLoading] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<{email:string;name:string}|null>(null)
  const [creds, setCreds]   = useState<{url:string;key:string;table:string}|null>(null)

  // Hidden admin
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [pinInput, setPinInput]           = useState('')
  const [pinError, setPinError]           = useState(false)
  const [showPinField, setShowPinField]   = useState(false)

  const showMsg = (text: string, type: MsgType = 'info') => { setMsg(text); setMsgType(type) }

  useEffect(() => {
    const raw = localStorage.getItem('nexus_creds')
    if (raw) setCreds(JSON.parse(raw))
    const t = (localStorage.getItem('nexus_theme') as 'dark'|'light') || 'dark'
    setTheme(t)
    if (sessionStorage.getItem('nexus_admin')==='1') setAdminUnlocked(true)
    const u = localStorage.getItem('nexus_user')
    if (u) { try { setLoggedInUser(JSON.parse(u)) } catch {} }
    const hk = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key==='A') setShowPinField(v=>!v)
    }
    window.addEventListener('keydown', hk)
    return () => window.removeEventListener('keydown', hk)
  }, [])

  const tryPin = () => {
    if (pinInput===ADMIN_PIN) {
      setAdminUnlocked(true); sessionStorage.setItem('nexus_admin','1')
      setPinError(false); setShowPinField(false); setPinInput('')
    } else { setPinError(true); setPinInput('') }
  }

  const applyTheme = (t: 'dark'|'light') => {
    setTheme(t); document.documentElement.dataset.theme=t
    localStorage.setItem('nexus_theme',t)
  }

  const clearSession = () => {
    if (!confirm('Clear all session data (stats, saved, mistakes)?')) return
    sessionStore.clearSession(); showMsg('Session cleared.', 'success')
  }

  const loginWithGoogle = async () => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent('https://nexus-sat.vercel.app/auth/callback')}`, {
      headers: { apikey: SUPABASE_KEY },
      redirect: 'manual',
    }).catch(() => null)
    // Just redirect the browser
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent('https://nexus-sat.vercel.app/auth/callback')}`
  }

  const doAuth = async () => {
    if (!authEmail || !authPass) { showMsg('Please enter your email and password.', 'error'); return }
    if (authMode==='signup' && !authName) { showMsg('Please enter your name.', 'error'); return }
    setAuthLoading(true); setMsg('')
    const endpoint = authMode==='login' ? 'token?grant_type=password' : 'signup'
    try {
      const body: any = { email: authEmail, password: authPass }
      if (authMode==='signup') body.data = { name: authName }
      const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      const errMsg: string = data.error_description || data.error || data.msg || ''

      if (errMsg) {
        if (/already registered|user already exists|email.*taken/i.test(errMsg)) {
          showMsg('An account with this email already exists. Switch to Log in below.', 'error')
          setAuthMode('login')
        } else if (/invalid.*credentials|invalid login/i.test(errMsg)) {
          showMsg('Incorrect email or password. Please try again.', 'error')
        } else if (/email.*confirm/i.test(errMsg)) {
          showMsg('Please confirm your email first — check your inbox for the link.', 'info')
        } else {
          showMsg(errMsg, 'error')
        }
      } else if (data.access_token) {
        // Successful login
        const name = data.user?.user_metadata?.name || authEmail.split('@')[0]
        const u = { email: authEmail, name }
        localStorage.setItem('nexus_token', data.access_token)
        localStorage.setItem('nexus_user', JSON.stringify(u))
        setLoggedInUser(u)
        window.dispatchEvent(new Event('nexus_auth_change'))
        showMsg(`Welcome back, ${name}! You're logged in.`, 'success')
        // Load progress from DB
        sessionStore.loadFromDB()
        setTimeout(() => { window.location.href = '/' }, 800)
      } else {
        // Signup confirmation email sent — NOT an error
        showMsg('', 'info')
        setMsg('__confirm__') // special render below
      }
    } catch (e: any) {
      showMsg(e.message || 'Something went wrong. Please try again.', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('nexus_token')
    localStorage.removeItem('nexus_user')
    setLoggedInUser(null); setMsg('')
    window.dispatchEvent(new Event('nexus_auth_change'))
  }

  const msgColors: Record<MsgType,{bg:string;border:string;color:string}> = {
    success: {bg:'var(--g-bg)',  border:'var(--g-ln)',  color:'var(--g-tx)'},
    info:    {bg:'rgba(59,130,246,.1)', border:'rgba(59,130,246,.3)', color:'#60a5fa'},
    error:   {bg:'var(--r-bg)',  border:'var(--r-ln)',  color:'var(--r-tx)'},
  }

  return (
    <div style={{maxWidth:540,margin:'0 auto',padding:'36px 20px 80px'}}>
      <div style={{fontSize:22,fontWeight:800,letterSpacing:'-.4px',marginBottom:4}}>Settings</div>
      <div style={{fontSize:14,color:'var(--tx3)',marginBottom:28}}>Manage your account and preferences.</div>

      {/* Hidden admin PIN */}
      {showPinField && !adminUnlocked && (
        <div style={{background:'var(--sf)',border:'1px solid var(--line)',borderRadius:12,padding:'14px 16px',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--tx4)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Admin Access</div>
          <div style={{display:'flex',gap:7}}>
            <input value={pinInput} onChange={e=>{setPinInput(e.target.value);setPinError(false)}}
              onKeyDown={e=>e.key==='Enter'&&tryPin()} placeholder="PIN" type="password" autoFocus
              style={{...inp,flex:1,borderColor:pinError?'var(--r-tx)':'var(--line2)'}} />
            <SBtn onClick={tryPin} lime>Enter</SBtn>
            <SBtn onClick={()=>{setShowPinField(false);setPinInput('');setPinError(false)}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </SBtn>
          </div>
          {pinError&&<p style={{fontSize:12,color:'var(--r-tx)',marginTop:5}}>Incorrect PIN</p>}
        </div>
      )}
      {adminUnlocked && (
        <Card title="Admin Panel">
          <Row label="Supabase URL" desc={creds?.url??'Not set'} />
          <Row label="Table" desc={creds?.table??'sat_questions'} />
          <Row label="Remove credentials">
            <DBtn onClick={()=>{if(!confirm('Remove?'))return;localStorage.removeItem('nexus_creds');setCreds(null)}}>Remove</DBtn>
          </Row>
          <div style={{padding:'8px 16px'}}>
            <button onClick={()=>{sessionStorage.removeItem('nexus_admin');setAdminUnlocked(false)}}
              style={{fontSize:11,color:'var(--tx4)',border:'none',background:'none',cursor:'pointer'}}>Lock panel</button>
          </div>
        </Card>
      )}

      {/* ── ACCOUNT ── */}
      <Card title="Account">
        <div style={{padding:'18px'}}>
          {loggedInUser ? (
            <>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                <div style={{width:52,height:52,borderRadius:'50%',background:'var(--lime)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#060a0e',flexShrink:0}}>
                  {loggedInUser.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:'var(--tx)'}}>{loggedInUser.name}</div>
                  <div style={{fontSize:12.5,color:'var(--tx3)',marginTop:2}}>{loggedInUser.email}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <Link href="/profile" style={lBtn}>My Profile</Link>
                <Link href="/stats"   style={lBtn}>My Stats</Link>
                <button onClick={logout} style={{...lBtn,background:'var(--r-bg)',color:'var(--r-tx)',border:'1px solid var(--r-ln)',cursor:'pointer'}}>Log out</button>
              </div>
            </>
          ) : (
            <>
              {/* Mode toggle */}
              <div style={{display:'flex',background:'var(--sf3)',borderRadius:10,padding:3,marginBottom:18,width:'fit-content',gap:2}}>
                {(['login','signup'] as const).map(m=>(
                  <button key={m} onClick={()=>{setAuthMode(m);setMsg('')}}
                    style={{padding:'6px 18px',borderRadius:8,fontSize:13.5,fontWeight:600,cursor:'pointer',border:'none',
                      background:authMode===m?'var(--sf)':'transparent',
                      color:authMode===m?'var(--tx)':'var(--tx3)',
                      boxShadow:authMode===m?'0 1px 3px rgba(0,0,0,.2)':'none',transition:'all .15s'}}>
                    {m==='login'?'Log in':'Sign up'}
                  </button>
                ))}
              </div>

              {/* Google login */}
              <button onClick={loginWithGoogle}
                style={{width:'100%',padding:'11px 16px',borderRadius:10,border:'1px solid var(--line2)',background:'var(--sf2)',color:'var(--tx)',fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:14,transition:'background .12s'}}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{flex:1,height:1,background:'var(--line)'}}/>
                <span style={{fontSize:12,color:'var(--tx4)'}}>or with email</span>
                <div style={{flex:1,height:1,background:'var(--line)'}}/>
              </div>

              {authMode==='signup' && (
                <input value={authName} onChange={e=>setAuthName(e.target.value)}
                  placeholder="Your full name" style={{...inp,marginBottom:9}} />
              )}
              <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
                placeholder="Email address" type="email" style={{...inp,marginBottom:9}} />
              <input value={authPass} onChange={e=>setAuthPass(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&doAuth()}
                placeholder="Password (min. 6 chars)" type="password" style={inp} />

              {/* Message display */}
              {msg==='__confirm__' ? (
                <div style={{marginTop:14,borderRadius:12,border:'1px solid rgba(59,130,246,.3)',background:'rgba(59,130,246,.1)',padding:'16px 18px'}}>
                  <div style={{fontSize:15,fontWeight:700,color:'#60a5fa',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Check your email!
                  </div>
                  <div style={{fontSize:13.5,color:'var(--tx2)',lineHeight:1.65}}>
                    We sent a confirmation link to <strong>{authEmail}</strong>.<br/>
                    Click the link in the email — you'll be logged in automatically and brought to your dashboard.
                  </div>
                </div>
              ) : msg && (
                <div style={{fontSize:13,padding:'10px 13px',borderRadius:9,marginTop:12,lineHeight:1.55,
                  background:msgColors[msgType].bg,color:msgColors[msgType].color,border:`1px solid ${msgColors[msgType].border}`}}>
                  {msg}
                </div>
              )}

              <button onClick={doAuth} disabled={authLoading}
                style={{marginTop:14,width:'100%',padding:'11px',background:'var(--lime)',color:'#060a0e',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:authLoading?'default':'pointer',opacity:authLoading?.7:1}}>
                {authLoading?'Working…':authMode==='login'?'Log in →':'Create free account →'}
              </button>

              {authMode==='signup' && msg!=='__confirm__' && (
                <p style={{fontSize:12,color:'var(--tx4)',marginTop:10,lineHeight:1.55,textAlign:'center'}}>
                  After signing up, check your email for a confirmation link. Click it and you'll be logged in automatically.
                </p>
              )}
            </>
          )}
        </div>
      </Card>

      {/* ── APPEARANCE ── */}
      <Card title="Appearance">
        <Row label="Theme">
          <div style={{display:'flex',gap:6}}>
            <TBtn active={theme==='dark'}  onClick={()=>applyTheme('dark')}>Dark</TBtn>
            <TBtn active={theme==='light'} onClick={()=>applyTheme('light')}>Light</TBtn>
          </div>
        </Row>
      </Card>

      {/* ── DATA ── */}
      <Card title="Data">
        <Row label="Clear session" desc="Resets stats, saved questions, and mistakes">
          <DBtn onClick={clearSession}>Clear</DBtn>
        </Row>
      </Card>
    </div>
  )
}

function Card({title,children}:{title:string;children:React.ReactNode}) {
  return (
    <div style={{background:'var(--sf)',border:'1px solid var(--line)',borderRadius:14,marginBottom:14,overflow:'hidden'}}>
      <div style={{fontSize:11,fontWeight:700,color:'var(--tx4)',textTransform:'uppercase',letterSpacing:'.5px',padding:'11px 16px',borderBottom:'1px solid var(--line)'}}>{title}</div>
      {children}
    </div>
  )
}
function Row({label,desc,children}:{label:string;desc?:string;children?:React.ReactNode}) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',borderBottom:'1px solid var(--line)',gap:12}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13.5,color:'var(--tx)'}}>{label}</div>
        {desc&&<div style={{fontSize:12,color:'var(--tx3)',marginTop:2,wordBreak:'break-all'}}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}
function TBtn({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}) {
  return <button onClick={onClick} style={{padding:'6px 13px',borderRadius:8,fontSize:12.5,fontWeight:600,cursor:'pointer',background:active?'var(--lime)':'transparent',color:active?'#060a0e':'var(--tx2)',border:`1px solid ${active?'var(--lime)':'var(--line2)'}`}}>{children}</button>
}
function DBtn({onClick,children}:{onClick:()=>void;children:React.ReactNode}) {
  return <button onClick={onClick} style={{padding:'7px 14px',background:'var(--r-bg)',color:'var(--r-tx)',border:'1px solid var(--r-ln)',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>{children}</button>
}
function SBtn({onClick,children,lime}:{onClick:()=>void;children:React.ReactNode;lime?:boolean}) {
  return <button onClick={onClick} style={{padding:'9px 14px',background:lime?'var(--lime)':'var(--sf2)',color:lime?'#060a0e':'var(--tx2)',border:`1px solid ${lime?'var(--lime)':'var(--line2)'}`,borderRadius:8,fontSize:13,fontWeight:lime?700:500,cursor:'pointer'}}>{children}</button>
}
const inp: React.CSSProperties = {
  width:'100%',padding:'10px 13px',background:'var(--sf2)',border:'1px solid var(--line2)',
  borderRadius:9,fontSize:14,color:'var(--tx)',outline:'none',display:'block',
}
const lBtn: React.CSSProperties = {
  padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none',
  display:'inline-block',background:'var(--sf3)',color:'var(--tx2)',border:'1px solid var(--line2)',
}
