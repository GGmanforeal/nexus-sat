'use client'
// app/auth/callback/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

type Status = 'loading' | 'success' | 'error' | 'confirm'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [name, setName]     = useState('')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    const hash   = window.location.hash.slice(1)
    const hParams = new URLSearchParams(hash)
    const token  = hParams.get('access_token')
    const type   = hParams.get('type') // 'signup' | 'recovery' | 'magiclink'
    const errorDesc = hParams.get('error_description')

    if (errorDesc) {
      setErrMsg(decodeURIComponent(errorDesc.replace(/\+/g,' ')))
      setStatus('error'); return
    }

    if (token) {
      // If it's a signup confirmation, show "confirmed!" then redirect
      if (type === 'signup') {
        fetchUserAndSave(token, true)
      } else {
        fetchUserAndSave(token, false)
      }
      return
    }

    // PKCE code flow
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
          if (data.access_token) fetchUserAndSave(data.access_token, false)
          else handleError('Could not verify your account. Please try logging in.')
        })
        .catch(() => handleError('Network error. Please try again.'))
      return
    }

    handleError('No confirmation token found. The link may have expired.')

    function fetchUserAndSave(tk: string, isConfirmation: boolean) {
      fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${tk}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data?.email) {
            const n = data.user_metadata?.name || data.email.split('@')[0]
            setName(n)
            const u = { email: data.email, name: n }
            localStorage.setItem('nexus_token', tk)
            localStorage.setItem('nexus_user', JSON.stringify(u))
            window.dispatchEvent(new Event('nexus_auth_change'))

            if (isConfirmation) {
              // Show "email confirmed" screen briefly, then go to bank
              setStatus('confirm')
              setTimeout(() => router.push('/bank'), 2500)
            } else {
              setStatus('success')
              setTimeout(() => router.push('/bank'), 1500)
            }
          } else {
            handleError('Could not verify your account. Please log in manually.')
          }
        })
        .catch(() => handleError('Something went wrong. Please log in manually.'))
    }

    function handleError(m: string) {
      setErrMsg(m); setStatus('error')
    }
  }, [router])

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'calc(100dvh - var(--nav-h))',padding:24}}>
      <div style={{
        background:'var(--sf)',border:'1px solid var(--line)',
        borderRadius:22,padding:'52px 36px',maxWidth:420,width:'100%',
        textAlign:'center',animation:'fadeUp .3s ease',
      }}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:28}}>
          <div style={{width:36,height:36,background:'var(--lime)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:900,color:'#060a0e'}}>N</div>
          <span style={{fontSize:20,fontWeight:800,letterSpacing:'-.4px',color:'var(--tx)'}}>Nexus</span>
        </div>

        {status==='loading' && (
          <>
            <div className="spinner" style={{margin:'0 auto 20px'}}/>
            <div style={{fontSize:17,fontWeight:700,color:'var(--tx)',marginBottom:8}}>Verifying your account…</div>
            <div style={{fontSize:13.5,color:'var(--tx3)'}}>Just a moment</div>
          </>
        )}

        {status==='confirm' && (
          <>
            <div style={{width:64,height:64,borderRadius:'50%',background:'var(--lime)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28}}>
              ✓
            </div>
            <div style={{fontSize:20,fontWeight:800,color:'var(--tx)',marginBottom:10,letterSpacing:'-.3px'}}>Email confirmed!</div>
            <div style={{fontSize:14,color:'var(--tx3)',lineHeight:1.7,marginBottom:8}}>
              Welcome to Nexus, <strong style={{color:'var(--tx)'}}>{name}</strong>! 🎉
            </div>
            <div style={{fontSize:13,color:'var(--tx4)'}}>Taking you to your dashboard…</div>
            <div style={{marginTop:20,height:3,background:'var(--sf3)',borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',background:'var(--lime)',animation:'progress 2.5s linear forwards',borderRadius:3}}/>
            </div>
          </>
        )}

        {status==='success' && (
          <>
            <div style={{width:64,height:64,borderRadius:'50%',background:'var(--lime)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28}}>
              ✓
            </div>
            <div style={{fontSize:20,fontWeight:800,color:'var(--tx)',marginBottom:10}}>You're in!</div>
            <div style={{fontSize:13.5,color:'var(--tx3)'}}>Redirecting to your dashboard…</div>
          </>
        )}

        {status==='error' && (
          <>
            <div style={{width:64,height:64,borderRadius:'50%',background:'var(--r-bg)',border:'1px solid var(--r-ln)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:26,color:'var(--r-tx)'}}>
              ✕
            </div>
            <div style={{fontSize:18,fontWeight:700,color:'var(--tx)',marginBottom:10}}>Verification failed</div>
            <div style={{fontSize:13.5,color:'var(--tx3)',lineHeight:1.65,marginBottom:24}}>{errMsg}</div>
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              <Link href="/settings" style={{padding:'10px 22px',background:'var(--lime)',color:'#060a0e',borderRadius:10,fontSize:14,fontWeight:700,textDecoration:'none'}}>
                Log in →
              </Link>
              <Link href="/bank" style={{padding:'10px 18px',background:'var(--sf2)',color:'var(--tx2)',border:'1px solid var(--line2)',borderRadius:10,fontSize:14,textDecoration:'none'}}>
                Go home
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Progress bar animation for confirm screen */}
      <style>{`
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  )
}
