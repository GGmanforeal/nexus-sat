'use client'
// app/login/page.tsx — Clean dedicated sign in / sign up page
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { sessionStore } from '@/lib/store/session'

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

const NexusLogo = () => (
  <svg width="90" height="36" viewBox="0 0 220 88" fill="none">
    <ellipse cx="110" cy="28" rx="52" ry="18" stroke="#84cc16" strokeWidth="5" fill="none" transform="rotate(-20 110 28)"/>
    <circle cx="148" cy="13" r="6" fill="#84cc16"/>
    <text x="110" y="76" textAnchor="middle" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="700" fontSize="28" letterSpacing="8" fill="#84cc16">NEXUS</text>
  </svg>
)

export default function LoginPage() {
  const [mode,    setMode]    = useState<'login'|'signup'>('login')
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState<{text:string;type:'ok'|'err'|'info'|'confirm'}>({text:'',type:'info'})

  useEffect(() => {
    if (localStorage.getItem('nexus_user')) window.location.href = '/'
    // Pre-select signup mode if ?signup=1
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('signup')) setMode('signup')
  }, [])

  const googleLogin = () => {
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent('https://nexus-sat.vercel.app/auth/callback')}`
  }

  const submit = async () => {
    if (!email || !pass) { setMsg({text:'Please fill in all fields.', type:'err'}); return }
    if (mode === 'signup' && !name) { setMsg({text:'Please enter your name.', type:'err'}); return }
    setLoading(true); setMsg({text:'', type:'info'})
    try {
      const body: any = { email, password: pass }
      if (mode === 'signup') body.data = { name }
      const endpoint = mode === 'login' ? 'token?grant_type=password' : 'signup'
      const res  = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      const err: string = data.error_description || data.error || data.msg || ''
      if (err) {
        if (/already registered|already exists|email.*taken/i.test(err)) {
          setMode('login'); setMsg({text:'Account exists — please log in instead.', type:'err'})
        } else if (/invalid.*credentials|invalid login/i.test(err)) {
          setMsg({text:'Wrong email or password.', type:'err'})
        } else if (/email.*confirm/i.test(err)) {
          setMsg({text:'Please confirm your email first — check your inbox.', type:'info'})
        } else setMsg({text: err, type:'err'})
      } else if (data.access_token) {
        const n = data.user?.user_metadata?.name || email.split('@')[0]
        const u = { email, name: n }
        localStorage.setItem('nexus_token', data.access_token)
        localStorage.setItem('nexus_user', JSON.stringify(u))
        window.dispatchEvent(new Event('nexus_auth_change'))
        sessionStore.loadFromDB()
        window.location.href = '/'
      } else {
        setMsg({text: '', type: 'confirm'})
      }
    } catch (e: any) {
      setMsg({text: e.message || 'Something went wrong.', type:'err'})
    } finally { setLoading(false) }
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'13px 16px', background:'var(--sf2)', border:'1.5px solid var(--line2)',
    borderRadius:11, fontSize:15, color:'var(--tx)', outline:'none', display:'block',
    fontFamily:'var(--font)', transition:'border-color .15s',
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <Link href="/" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', textDecoration:'none', gap:8 }}>
            <NexusLogo />
          </Link>
          <p style={{ fontSize:13.5, color:'var(--tx4)', marginTop:10 }}>The SAT prep system that guarantees improvement</p>
        </div>

        {/* Card */}
        <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:20, padding:'28px 28px', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>

          {/* Tab switcher */}
          <div style={{ display:'flex', background:'var(--sf3)', borderRadius:11, padding:3, marginBottom:24, gap:3 }}>
            {(['login','signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setMsg({text:'',type:'info'}) }}
                style={{ flex:1, padding:'9px', borderRadius:9, fontSize:14, fontWeight:600, cursor:'pointer', border:'none', transition:'all .15s',
                  background: mode===m ? 'var(--sf)' : 'transparent',
                  color:      mode===m ? 'var(--tx)' : 'var(--tx4)',
                  boxShadow:  mode===m ? '0 1px 4px rgba(0,0,0,.2)' : 'none' }}>
                {m === 'login' ? 'Log in' : 'Sign up free'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button onClick={googleLogin}
            style={{ width:'100%', padding:'12px 16px', borderRadius:11, border:'1.5px solid var(--line2)', background:'var(--sf2)', color:'var(--tx)', fontSize:14.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:18 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
            <div style={{ flex:1, height:1, background:'var(--line)' }}/>
            <span style={{ fontSize:12, color:'var(--tx4)', whiteSpace:'nowrap' }}>or with email</span>
            <div style={{ flex:1, height:1, background:'var(--line)' }}/>
          </div>

          {/* Fields */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {mode === 'signup' && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={inp}/>
            )}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
            <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Password (min. 6 chars)" type="password"
              onKeyDown={e => e.key === 'Enter' && submit()} style={inp}/>
          </div>

          {/* Message */}
          {msg.type === 'confirm' ? (
            <div style={{ marginTop:16, borderRadius:12, border:'1px solid rgba(59,130,246,.3)', background:'rgba(59,130,246,.08)', padding:'16px 18px' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#60a5fa', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Check your email!
              </div>
              <div style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.65 }}>
                We sent a confirmation link to <strong>{email}</strong>. Click it and you&apos;ll be logged in automatically.
              </div>
            </div>
          ) : msg.text ? (
            <div style={{ marginTop:12, padding:'11px 14px', borderRadius:10, fontSize:13,
              background: msg.type==='ok' ? 'var(--g-bg)' : msg.type==='err' ? 'var(--r-bg)' : 'rgba(59,130,246,.08)',
              color:      msg.type==='ok' ? 'var(--g-tx)' : msg.type==='err' ? 'var(--r-tx)' : '#60a5fa',
              border:     `1px solid ${msg.type==='ok' ? 'var(--g-ln)' : msg.type==='err' ? 'var(--r-ln)' : 'rgba(59,130,246,.3)'}` }}>
              {msg.text}
            </div>
          ) : null}

          {/* Submit */}
          <button onClick={submit} disabled={loading}
            style={{ marginTop:16, width:'100%', padding:'14px', background:'var(--lime)', color:'#060a0e', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor:loading?'default':'pointer', opacity:loading?0.7:1, letterSpacing:'-.2px' }}>
            {loading ? 'Working…' : mode === 'login' ? 'Log in →' : 'Create free account →'}
          </button>

          {mode === 'signup' && msg.type !== 'confirm' && (
            <p style={{ fontSize:12, color:'var(--tx4)', marginTop:12, textAlign:'center', lineHeight:1.55 }}>
              Free forever. No credit card. After signing up, confirm your email to get started.
            </p>
          )}
        </div>

        {/* Back */}
        <div style={{ textAlign:'center', marginTop:20 }}>
          <Link href="/" style={{ fontSize:13, color:'var(--tx4)', textDecoration:'none' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
