'use client'
// app/bank/page.tsx — v5: stopwatch timer, question picker, answer persistence
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Question, TreeData, TreeDomain } from '@/lib/types'
import { MathText } from '@/components/MathText'
import { sessionStore } from '@/lib/store/session'
import Link from 'next/link'

/* ─── Supabase ──────────────────────────────────────────────── */
const DEFAULT_CREDS = {
  url:   'https://cxeeqxxvuyrhlpindljk.supabase.co',
  key:   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M',
  table: 'sat_questions',
}
interface Creds { url: string; key: string; table: string }

function supaFetch(c: Creds, opts: { select?: string; filters?: {col:string;op:string;val:string}[]; limit?: number }) {
  const p = new URLSearchParams()
  p.set('select', opts.select || '*')
  if (opts.limit) p.set('limit', String(opts.limit))
  ;(opts.filters || []).forEach(f => p.append(f.col, `${f.op}.${f.val}`))
  return fetch(`${c.url}/rest/v1/${c.table}?${p}`, {
    headers: { apikey: c.key, Authorization: `Bearer ${c.key}` },
  }).then(r => r.json())
}

const LABELS = ['A','B','C','D']
const MATH_ONLY_DOMAINS = ['problem-solving and data analysis','problem solving and data analysis','data analysis']
function isMathDomain(domain: string) { return MATH_ONLY_DOMAINS.includes(domain.toLowerCase()) }

/* ─── Stopwatch (counts UP from 0) ─────────────────────────── */
function Stopwatch({ running, onStop }: { running: boolean; onStop: (ms: number) => void }) {
  const [secs, setSecs] = useState(0)
  const startRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (running) {
      setSecs(0)
      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        setSecs(Math.floor((Date.now() - startRef.current) / 1000))
      }, 500)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (startRef.current > 0) {
        onStop(Date.now() - startRef.current)
        startRef.current = 0
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const m = Math.floor(secs / 60)
  const s = secs % 60
  const display = m > 0 ? `${m}:${String(s).padStart(2,'0')}` : `${s}s`
  // Color: green < 60s, yellow 60-90s, red > 90s
  const color = secs < 60 ? 'var(--g-tx)' : secs < 90 ? 'var(--a-tx)' : 'var(--r-tx)'

  if (!running && secs === 0) return null
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:8,
      background: secs >= 90 ? 'var(--r-bg)' : 'var(--sf2)',
      border: `1px solid ${secs >= 90 ? 'var(--r-ln)' : 'var(--line2)'}`,
      flexShrink:0 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color, minWidth:26 }}>{display}</span>
    </div>
  )
}

/* ─── Clock ─────────────────────────────────────────────────── */
function Clock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}))
    tick(); const id = setInterval(tick,30000); return () => clearInterval(id)
  }, [])
  return <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--tx4)'}}>{t}</span>
}

/* ─── Nav button ────────────────────────────────────────────── */
function NavBtn({onClick,disabled,children}:{onClick:()=>void;disabled:boolean;children:React.ReactNode}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{width:30,height:30,borderRadius:7,border:'1px solid var(--line2)',background:'var(--sf2)',fontSize:14,color:'var(--tx3)',cursor:disabled?'default':'pointer',opacity:disabled?0.25:1,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      {children}
    </button>
  )
}

/* ─── Question Picker Modal ─────────────────────────────────── */
function QuestionPicker({ total, current, answered, onGo, onClose }: {
  total: number; current: number;
  answered: Set<number>; // indices already answered
  onGo: (i: number) => void; onClose: () => void
}) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',zIndex:700,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--sf)',border:'1px solid var(--line2)',borderRadius:18,padding:22,maxWidth:480,width:'100%',maxHeight:'70vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:800}}>Jump to question</div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:'1px solid var(--line2)',background:'var(--sf2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--tx3)'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{fontSize:12,color:'var(--tx3)',marginBottom:14,display:'flex',gap:14}}>
          <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:'var(--lime)',display:'inline-block'}}/> Current</span>
          <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:'var(--g-bg)',border:'1px solid var(--g-ln)',display:'inline-block'}}/> Answered</span>
          <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,borderRadius:2,background:'var(--sf3)',display:'inline-block'}}/> Not answered</span>
        </div>
        <div style={{overflowY:'auto',flex:1}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(44px,1fr))',gap:6}}>
            {Array.from({length:total}).map((_,i) => {
              const isCurrent  = i === current
              const isAnswered = answered.has(i)
              return (
                <button key={i} onClick={() => { onGo(i); onClose() }}
                  style={{
                    height:40, borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                    border: isCurrent ? '2px solid var(--lime-dk)' : isAnswered ? '1px solid var(--g-ln)' : '1px solid var(--line2)',
                    background: isCurrent ? 'var(--lime)' : isAnswered ? 'var(--g-bg)' : 'var(--sf2)',
                    color: isCurrent ? '#060a0e' : isAnswered ? 'var(--g-tx)' : 'var(--tx2)',
                  }}>
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{marginTop:14,fontSize:12,color:'var(--tx4)',textAlign:'center'}}>{answered.size} of {total} answered</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function BankPage() {
  const [isAdmin, setIsAdmin]     = useState(false)
  const [loggedIn, setLoggedIn]   = useState(false)
  const [creds, setCreds]         = useState<Creds | null>(null)
  const [connected, setConnected] = useState<'off'|'checking'|'live'|'err'>('off')
  const [tree, setTree]           = useState<TreeData>({ English: [], Math: [] })
  const [sec, setSec]             = useState<'English'|'Math'>('English')
  const [actDom, setActDom]       = useState<string|null>(null)
  const [actSk, setActSk]         = useState<string|null>(null)
  const [diff, setDiff]           = useState('all')
  const [shuffle, setShuffle]     = useState(false)
  const [sideOpen, setSideOpen]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const diffRef    = useRef(diff)
  const shuffleRef = useRef(shuffle)
  const credsRef   = useRef<Creds|null>(null)
  const secRef     = useRef(sec)
  const actDomRef  = useRef<string|null>(null)
  const actSkRef   = useRef<string|null>(null)

  useEffect(() => { diffRef.current    = diff    }, [diff])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { secRef.current     = sec     }, [sec])
  useEffect(() => { actDomRef.current  = actDom  }, [actDom])
  useEffect(() => { actSkRef.current   = actSk   }, [actSk])

  const [qs, setQs]               = useState<Question[]>([])
  const [idx, setIdx]             = useState(0)
  const [loadingQs, setLoadingQs] = useState(false)
  const [sel, setSel]             = useState<string|null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved]         = useState<Set<string>>(new Set())
  const [correct, setCorrect]     = useState(0)
  const [wrong, setWrong]         = useState(0)
  const [sessionDone, setSessionDone] = useState(false)
  const [flagged, setFlagged]     = useState<Set<number>>(new Set())
  const [timerRunning, setTimerRunning] = useState(false)
  // Track which question indices have been answered this session
  const [answeredIdxs, setAnsweredIdxs] = useState<Set<number>>(new Set())
  // Store per-question elapsed ms
  const elapsedMsRef = useRef<number>(0)

  useEffect(() => {
    setSaved(new Set(Object.keys(sessionStore.get().saved)))
    return sessionStore.subscribe(() => setSaved(new Set(Object.keys(sessionStore.get().saved))))
  }, [])

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem('nexus_admin') === '1')
    setLoggedIn(!!localStorage.getItem('nexus_user'))
    const h = () => setLoggedIn(!!localStorage.getItem('nexus_user'))
    window.addEventListener('nexus_auth_change', h)
    const raw = localStorage.getItem('nexus_creds')
    const c: Creds = raw ? JSON.parse(raw) : DEFAULT_CREDS
    if (!raw) localStorage.setItem('nexus_creds', JSON.stringify(DEFAULT_CREDS))
    setCreds(c); credsRef.current = c; setConnected('checking')
    supaFetch(c, {select:'id',limit:1})
      .then(d => { if (Array.isArray(d)) { setConnected('live'); buildTree(c) } else setConnected('err') })
      .catch(() => setConnected('err'))
    return () => window.removeEventListener('nexus_auth_change', h)
  }, [])

  const buildTree = useCallback(async (c: Creds) => {
    let allData: any[] = []
    let offset = 0
    while (true) {
      const p = new URLSearchParams()
      p.set('select', 'section,domain,skill')
      p.set('limit', '1000')
      p.set('offset', String(offset))
      const batch = await fetch(`${c.url}/rest/v1/${c.table}?${p}`, {
        headers: { apikey: c.key, Authorization: `Bearer ${c.key}` },
      }).then(r => r.json()).catch(() => [])
      if (!Array.isArray(batch) || batch.length === 0) break
      allData = allData.concat(batch)
      if (batch.length < 1000) break
      offset += 1000
    }
    if (allData.length === 0) return
    const map: Record<string,Record<string,Record<string,number>>> = {English:{},Math:{}}
    allData.forEach((r: any) => {
      const sNorm = (r.section || '').trim().toLowerCase()
      const rawSec = sNorm === 'math' ? 'Math' : 'English'
      const domain = (r.domain || 'Other').trim()
      const skill  = (r.skill  || '').trim()
      const s = rawSec === 'English' && isMathDomain(domain) ? 'Math' : rawSec
      if (!map[s][domain]) map[s][domain] = { _total: 0 }
      map[s][domain]._total = (map[s][domain]._total || 0) + 1
      if (skill) map[s][domain][skill] = (map[s][domain][skill] || 0) + 1
    })
    const toArr = (obj: Record<string,Record<string,number>>): TreeDomain[] =>
      Object.keys(obj).sort().map(d => ({
        name: d, count: obj[d]._total || 0,
        children: Object.keys(obj[d]).filter(k => k !== '_total').sort().map(sk => ({ name: sk, count: obj[d][sk] }))
      }))
    setTree({ English: toArr(map.English), Math: toArr(map.Math) })
  }, [])

  const loadQs = useCallback(async (dom: string, sk: string|null, overrideSec?: string) => {
    const c = credsRef.current
    if (!c) return
    const useSec     = overrideSec ?? secRef.current
    const useDiff    = diffRef.current
    const useShuffle = shuffleRef.current

    setLoadingQs(true); setQs([]); setIdx(0); setSel(null); setSubmitted(false)
    setCorrect(0); setWrong(0); setSessionDone(false); setFlagged(new Set())
    setAnsweredIdxs(new Set()); setTimerRunning(false)

    const filters: {col:string;op:string;val:string}[] = []
    if (dom) filters.push({col:'domain',op:'eq',val:dom})
    if (sk)  filters.push({col:'skill', op:'eq',val:sk})
    if (useDiff !== 'all') filters.push({col:'difficulty',op:'eq',val:useDiff})

    const data = await supaFetch(c, {
      select:'id,section,domain,skill,difficulty,question_text,passage_text,choice_a,choice_b,choice_c,choice_d,correct_answer,explanation',
      filters, limit:500,
    })
    let items: Question[] = Array.isArray(data) ? data : []
    items = items.filter(q => {
      const sNorm = (q.section||'').toLowerCase()
      const qSec = isMathDomain(q.domain||'') ? 'Math' : sNorm === 'math' ? 'Math' : 'English'
      return qSec === useSec
    })
    const sorted = useShuffle ? [...items].sort(()=>Math.random()-.5) : items
    setQs(sorted); setLoadingQs(false)
    if (sorted.length > 0) {
      if (window.innerWidth < 700) setSideOpen(false)
      setTimerRunning(true)
    }
  }, [])

  const tryConnect = async (url: string, key: string, table: string) => {
    setConnected('checking')
    const c = {url,key,table}
    const d = await supaFetch(c,{select:'id',limit:1}).catch(()=>null)
    if (Array.isArray(d)) {
      setCreds(c); credsRef.current = c; setConnected('live')
      localStorage.setItem('nexus_creds',JSON.stringify(c)); setShowModal(false); buildTree(c)
    } else setConnected('err')
  }

  const handleDiffChange = (d: string) => {
    setDiff(d); diffRef.current = d
    if (actDomRef.current) loadQs(actDomRef.current, actSkRef.current)
  }
  const handleShuffleChange = () => {
    const next = !shuffleRef.current
    setShuffle(next); shuffleRef.current = next
    if (actDomRef.current) loadQs(actDomRef.current, actSkRef.current)
  }

  const goTo = (i: number) => {
    setIdx(i)
    const prevAnswer = sessionStore.get().answered.find(a => a.questionId === qs[i]?.id)
    if (prevAnswer) {
      // Restore previous answer
      setSel(prevAnswer.selectedAnswer)
      setSubmitted(true)
      setTimerRunning(false)
    } else {
      setSel(null); setSubmitted(false); setTimerRunning(true)
    }
  }

  const confirmAnswer = useCallback((forceAnswer?: string) => {
    const answer = typeof forceAnswer === 'string' ? forceAnswer : sel
    if (!answer || submitted || !qs[idx]) return
    const q = qs[idx]
    const isCorrect = answer === q.correct_answer
    const timeMs = elapsedMsRef.current
    setSubmitted(true)
    setTimerRunning(false)
    if (isCorrect) setCorrect(c=>c+1); else setWrong(c=>c+1)
    setAnsweredIdxs(prev => { const n = new Set(prev); n.add(idx); return n })
    sessionStore.addAnswer({
      questionId:q.id, section:q.section, domain:q.domain||'',
      skill:q.skill||'', difficulty:q.difficulty||'',
      selectedAnswer:answer, correctAnswer:q.correct_answer, isCorrect,
      explanation:q.explanation||'', question_text:q.question_text,
      choice_a:q.choice_a, choice_b:q.choice_b, choice_c:q.choice_c, choice_d:q.choice_d,
      timeMs,
    })
    if (idx === qs.length-1) setTimeout(()=>setSessionDone(true), 700)
  }, [sel, submitted, qs, idx])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName==='INPUT') return
      if (sessionDone) return
      const map: Record<string,string> = {a:'A',b:'B',c:'C',d:'D'}
      if (!submitted && map[e.key.toLowerCase()]) { setSel(map[e.key.toLowerCase()]); return }
      if (e.key==='Enter') {
        if (!submitted && sel) confirmAnswer()
        else if (submitted && idx<qs.length-1) goTo(idx+1)
      }
      if (e.key==='ArrowRight' && submitted) goTo(Math.min(qs.length-1,idx+1))
      if (e.key==='ArrowLeft') goTo(Math.max(0,idx-1))
      if (e.key.toLowerCase()==='f') setFlagged(prev=>{const n=new Set(prev);n.has(idx)?n.delete(idx):n.add(idx);return n})
    }
    window.addEventListener('keydown',h)
    return ()=>window.removeEventListener('keydown',h)
  }, [submitted,sel,idx,qs,confirmAnswer,sessionDone])

  // When navigating to next question, restore if already answered
  const goNext = () => {
    const nextIdx = Math.min(qs.length-1, idx+1)
    goTo(nextIdx)
  }
  const goPrev = () => {
    const prevIdx = Math.max(0, idx-1)
    goTo(prevIdx)
  }

  const q       = qs[idx]
  const total   = qs.length
  const done    = correct+wrong
  const pct     = total ? Math.round((done/total)*100) : 0
  const opts    = q ? [q.choice_a,q.choice_b,q.choice_c,q.choice_d] : []
  const corrIdx = q ? LABELS.indexOf(q.correct_answer) : -1

  const choiceStyle = (i: number): React.CSSProperties => {
    if (!submitted) {
      return sel===LABELS[i]
        ? {borderColor:'var(--lime-dk)',background:'var(--lime-dim)',opacity:1}
        : {borderColor:'var(--line2)',background:'var(--sf)',opacity:1}
    }
    if (i===corrIdx) return {borderColor:'var(--g-tx)',background:'var(--g-bg)',opacity:1}
    if (LABELS[i]===sel) return {borderColor:'var(--r-tx)',background:'var(--r-bg)',opacity:1}
    return {borderColor:'var(--line)',background:'var(--sf)',opacity:0.3}
  }
  const labelStyle = (i: number): React.CSSProperties => {
    if (!submitted && sel===LABELS[i]) return {background:'var(--lime-dk)',color:'#fff',borderColor:'var(--lime-dk)'}
    if (submitted && i===corrIdx) return {background:'var(--g-tx)',color:'#fff',borderColor:'var(--g-tx)'}
    if (submitted && LABELS[i]===sel) return {background:'var(--r-tx)',color:'#fff',borderColor:'var(--r-tx)'}
    return {background:'transparent',color:'var(--tx3)',borderColor:'var(--line2)'}
  }

  // ── Guest gate ─────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100dvh - var(--nav-h))',padding:24}}>
        <div style={{background:'var(--sf)',border:'1px solid var(--line)',borderRadius:22,padding:'48px 32px',maxWidth:400,width:'100%',textAlign:'center',animation:'fadeUp .3s ease'}}>
          <div style={{width:60,height:60,background:'var(--lime-dk)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:900,color:'#fff',margin:'0 auto 22px'}}>N</div>
          <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>Sign in to practice</div>
          <div style={{fontSize:14,color:'var(--tx3)',lineHeight:1.7,marginBottom:26}}>Access the full question bank, track progress, and predict your SAT score.</div>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/login?signup=1" style={{padding:'11px 24px',background:'var(--lime-dk)',color:'#fff',borderRadius:11,fontWeight:800,fontSize:14,textDecoration:'none'}}>Sign up free</Link>
            <Link href="/login" style={{padding:'11px 18px',background:'var(--sf2)',color:'var(--tx2)',border:'1px solid var(--line2)',borderRadius:11,fontSize:14,textDecoration:'none'}}>Log in</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{display:'flex',height:'calc(100dvh - var(--nav-h))',overflow:'hidden',position:'relative'}}>

      {sideOpen && <div onClick={()=>setSideOpen(false)} className="mob-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:200}} />}

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside className={`sidebar${sideOpen?' sidebar-open':''}`}
        style={{width:'var(--side-w)',minWidth:'var(--side-w)',borderRight:'1px solid var(--line)',background:'var(--sf)',display:sideOpen?'flex':'none',flexDirection:'column',height:'100%',zIndex:250}}>

        {/* Status */}
        <div style={{padding:'8px 12px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:6,fontSize:11.5}}>
          <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,
            background:connected==='live'?'var(--lime-dk)':connected==='err'?'var(--r-tx)':'var(--tx4)',
            boxShadow:connected==='live'?'0 0 6px rgba(132,204,22,.6)':'none'}} />
          <span style={{color:'var(--tx4)',flex:1}}>{connected==='live'?'Connected':connected==='checking'?'Connecting…':'Error'}</span>
          {isAdmin && <button onClick={()=>setShowModal(true)} style={{fontSize:11,color:'var(--lime-dk)',cursor:'pointer',border:'none',background:'none'}}>Edit</button>}
        </div>

        {/* Filters */}
        <div style={{padding:'10px 12px',borderBottom:'1px solid var(--line)',display:'flex',flexDirection:'column',gap:9}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--tx4)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:6}}>Difficulty</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {['all','easy','medium','hard'].map(d=>(
                <button key={d} onClick={()=>handleDiffChange(d)}
                  style={{padding:'4px 10px',borderRadius:100,fontSize:12,fontWeight:d===diff?700:400,
                    border:`1px solid ${d===diff?'var(--lime-dk)':'var(--line2)'}`,
                    background:d===diff?'var(--lime-dk)':'transparent',
                    color:d===diff?'#fff':'var(--tx3)',cursor:'pointer',transition:'all .12s'}}>
                  {d==='all'?'All':d[0].toUpperCase()+d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:13,color:'var(--tx2)'}}>Shuffle questions</span>
            <button onClick={handleShuffleChange}
              style={{width:36,height:20,borderRadius:10,border:'none',background:shuffle?'var(--lime-dk)':'var(--sf3)',position:'relative',cursor:'pointer',transition:'background .2s',flexShrink:0}}>
              <span style={{position:'absolute',width:16,height:16,borderRadius:'50%',background:'white',top:2,left:shuffle?18:2,transition:'left .18s',boxShadow:'0 1px 4px rgba(0,0,0,.3)'}} />
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div style={{display:'flex',borderBottom:'1px solid var(--line)',flexShrink:0}}>
          {(['English','Math'] as const).map(s=>(
            <button key={s} onClick={()=>{setSec(s);secRef.current=s;setActDom(null);actDomRef.current=null;setActSk(null);actSkRef.current=null;setQs([]);setSessionDone(false);setTimerRunning(false)}}
              style={{flex:1,padding:'9px 4px',fontSize:11.5,fontWeight:600,border:'none',background:'none',cursor:'pointer',
                color:sec===s?'var(--lime-dk)':'var(--tx3)',
                borderBottom:sec===s?'2px solid var(--lime-dk)':'2px solid transparent',
                transition:'color .12s'}}>
              {s==='English'?'Reading & Writing':'Math'}
            </button>
          ))}
        </div>

        {/* Topic tree */}
        <div style={{flex:1,overflowY:'auto',paddingBottom:40}}>
          {(tree[sec]||[]).map((dom,di)=>{
            const open = dom.name===actDom
            return (
              <div key={di} style={{borderBottom:'1px solid var(--line)'}}>
                {/* Domain row — expand only, no load */}
                <div onClick={()=>{const isOpen=dom.name===actDom;setActDom(isOpen?null:dom.name);actDomRef.current=isOpen?null:dom.name;setActSk(null);actSkRef.current=null;}}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',cursor:'pointer',background:open?'var(--lime-dim)':'transparent',transition:'background .1s'}}>
                  <svg style={{transition:'transform .18s',transform:open?'rotate(90deg)':'none',flexShrink:0}}
                    width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--tx4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  <span style={{fontSize:12.5,fontWeight:600,flex:1,color:open?'var(--lime-dk)':'var(--tx)',lineHeight:1.3}}>{dom.name}</span>
                  <span style={{fontSize:10,color:'var(--tx4)',background:'var(--sf3)',padding:'2px 6px',borderRadius:100,fontFamily:'var(--mono)'}}>{dom.count}</span>
                </div>
                {/* Skills — click to load */}
                {open && dom.children.map((sk,si)=>(
                  <div key={si} onClick={()=>{setActSk(sk.name);actSkRef.current=sk.name;loadQs(dom.name,sk.name)}}
                    style={{display:'flex',alignItems:'center',gap:7,padding:'7px 12px 7px 26px',cursor:'pointer',
                      background:actSk===sk.name?'var(--lime-dim)':'transparent',
                      borderLeft:`2px solid ${actSk===sk.name?'var(--lime-dk)':'transparent'}`,
                      transition:'background .1s'}}>
                    <span style={{fontSize:12,flex:1,color:actSk===sk.name?'var(--lime-dk)':'var(--tx2)',lineHeight:1.35}}>{sk.name}</span>
                    <span style={{fontSize:10,color:'var(--tx4)',fontFamily:'var(--mono)'}}>{sk.count}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)',minWidth:0}}>

        {/* Top bar */}
        <div style={{height:46,borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',padding:'0 10px',gap:6,background:'var(--sf)',flexShrink:0}}>
          <button onClick={()=>setSideOpen(o=>!o)}
            style={{width:32,height:32,borderRadius:7,border:'1px solid var(--line2)',background:sideOpen?'var(--lime-dim)':'var(--sf2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:sideOpen?'var(--lime-dk)':'var(--tx2)'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div style={{flex:1,fontSize:11.5,color:'var(--tx3)',display:'flex',gap:4,alignItems:'center',overflow:'hidden',minWidth:0}}>
            {q ? (
              <>
                <span style={{color:'var(--tx4)',flexShrink:0,fontSize:11}}>{/math/i.test(q.section)||isMathDomain(q.domain||'')?'Math':'R&W'}</span>
                {q.domain&&<><span style={{color:'var(--tx4)'}}>›</span><span style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--tx2)'}}>{q.domain}</span></>}
              </>
            ) : <span style={{fontSize:12,color:'var(--tx4)'}}>Select a topic</span>}
          </div>

          {/* Stopwatch */}
          <Stopwatch
            running={timerRunning && !submitted}
            onStop={ms => { elapsedMsRef.current = ms }}
          />

          <Clock />

          {/* Question picker button */}
          {total > 0 && !sessionDone && (
            <button onClick={()=>setShowPicker(true)}
              style={{display:'flex',alignItems:'center',gap:4,padding:'4px 8px',borderRadius:7,border:'1px solid var(--line2)',background:'var(--sf2)',fontSize:11.5,fontWeight:600,color:'var(--tx2)',cursor:'pointer',flexShrink:0}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              {idx+1}/{total}
            </button>
          )}

          {total>0 && !sessionDone && (
            <div style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
              <NavBtn onClick={goPrev} disabled={idx===0}>‹</NavBtn>
              <NavBtn onClick={goNext} disabled={idx===total-1}>›</NavBtn>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{height:3,background:'var(--sf3)',flexShrink:0}}>
          <div style={{height:'100%',background:'var(--lime-dk)',width:`${pct}%`,transition:'width .35s ease'}} />
        </div>

        {/* Stats strip */}
        {total > 0 && (
          <div style={{height:30,borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',padding:'0 14px',gap:14,flexShrink:0,background:'var(--sf)',fontSize:11.5}}>
            <span style={{color:'var(--g-tx)',fontWeight:600}}>{correct} correct</span>
            <span style={{color:'var(--r-tx)',fontWeight:600}}>{wrong} wrong</span>
            <span style={{color:'var(--tx4)'}}>{total-done} left</span>
            {done>0 && <span style={{marginLeft:'auto',color:'var(--tx3)',fontFamily:'var(--mono)'}}>{Math.round((correct/done)*100)}%</span>}
          </div>
        )}

        {/* Content */}
        <div style={{flex:1,overflowY:'auto'}}>

          {loadingQs && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:12}}>
              <div className="spinner"/>
              <span style={{fontSize:13,color:'var(--tx3)'}}>Loading questions…</span>
            </div>
          )}

          {!loadingQs && !q && !sessionDone && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:10,padding:'40px 24px',textAlign:'center'}}>
              <div style={{width:52,height:52,borderRadius:14,background:'var(--sf)',border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--tx4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:'var(--tx2)'}}>Pick a topic to start</div>
              <div style={{fontSize:13,color:'var(--tx4)',maxWidth:240,lineHeight:1.6}}>Open the sidebar, expand a domain, and choose a skill.</div>
            </div>
          )}

          {/* Session complete */}
          {sessionDone && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',padding:'24px'}}>
              <div style={{background:'var(--sf)',border:'1px solid var(--line)',borderRadius:20,padding:'36px 28px',maxWidth:360,width:'100%',textAlign:'center',animation:'fadeUp .3s ease'}}>
                <div style={{width:60,height:60,borderRadius:16,margin:'0 auto 18px',display:'flex',alignItems:'center',justifyContent:'center',
                  background:(correct/total)>=.8?'var(--g-bg)':(correct/total)>=.6?'var(--a-bg)':'var(--r-bg)',
                  border:`1px solid ${(correct/total)>=.8?'var(--g-ln)':(correct/total)>=.6?'var(--a-ln)':'var(--r-ln)'}`}}>
                  {(correct/total)>=.8
                    ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--g-tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    : (correct/total)>=.6
                      ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--a-tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--r-tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  }
                </div>
                <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>Session complete!</div>
                <div style={{fontSize:13,color:'var(--tx3)',marginBottom:22}}>{actSk||actDom} · {total} questions</div>
                <div style={{display:'flex',justifyContent:'center',gap:20,marginBottom:24}}>
                  {[
                    {l:'Score', v:`${Math.round((correct/total)*100)}%`, c:(correct/total)>=.8?'var(--g-tx)':(correct/total)>=.6?'var(--a-tx)':'var(--r-tx)'},
                    {l:'Correct', v:String(correct), c:'var(--g-tx)'},
                    {l:'Wrong',   v:String(wrong),   c:'var(--r-tx)'},
                  ].map(s=>(
                    <div key={s.l} style={{textAlign:'center'}}>
                      <div style={{fontFamily:'var(--mono)',fontSize:24,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
                      <div style={{fontSize:11,color:'var(--tx4)',marginTop:3}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                  <button onClick={()=>{setSessionDone(false);setIdx(0);setSel(null);setSubmitted(false);setCorrect(0);setWrong(0);setAnsweredIdxs(new Set());setTimerRunning(true)}}
                    style={{padding:'10px 18px',background:'var(--lime-dk)',color:'#fff',border:'none',borderRadius:10,fontSize:13.5,fontWeight:700,cursor:'pointer'}}>
                    Review answers
                  </button>
                  <button onClick={()=>actDom&&loadQs(actDom,actSk)}
                    style={{padding:'10px 14px',background:'var(--sf2)',color:'var(--tx)',border:'1px solid var(--line2)',borderRadius:10,fontSize:13,cursor:'pointer'}}>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Question */}
          {!loadingQs && q && !sessionDone && (
            <div key={`${q.id}-${idx}`} style={{maxWidth:760,padding:'22px 20px 80px',animation:'fadeUp .15s ease'}}>

              {/* Badges */}
              <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap',marginBottom:14}}>
                <span style={{padding:'3px 8px',borderRadius:5,fontSize:10.5,fontWeight:600,
                  background:/math/i.test(q.section)||isMathDomain(q.domain||'')?'rgba(37,99,235,.12)':'rgba(99,102,241,.12)',
                  color:/math/i.test(q.section)||isMathDomain(q.domain||'')?'#60a5fa':'#818cf8'}}>
                  {isMathDomain(q.domain||'')||/math/i.test(q.section)?'Math':'Reading & Writing'}
                </span>
                {q.domain&&<span style={{padding:'3px 8px',borderRadius:5,fontSize:10.5,fontWeight:600,background:'var(--sf3)',color:'var(--tx2)'}}>{q.domain}</span>}
                {q.skill&&<span style={{padding:'3px 8px',borderRadius:5,fontSize:10.5,background:'var(--sf3)',color:'var(--tx3)'}}>{q.skill}</span>}
                {q.difficulty&&(
                  <span style={{padding:'3px 8px',borderRadius:5,fontSize:10.5,fontWeight:600,border:'1px solid',
                    borderColor:q.difficulty==='easy'?'var(--g-tx)':q.difficulty==='hard'?'var(--r-tx)':'var(--a-tx)',
                    color:q.difficulty==='easy'?'var(--g-tx)':q.difficulty==='hard'?'var(--r-tx)':'var(--a-tx)'}}>
                    {q.difficulty}
                  </span>
                )}
                {/* Flag */}
                <button onClick={()=>setFlagged(prev=>{const n=new Set(prev);n.has(idx)?n.delete(idx):n.add(idx);return n})}
                  style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:5,fontSize:10.5,fontWeight:600,
                    border:`1px solid ${flagged.has(idx)?'var(--a-tx)':'var(--line2)'}`,
                    background:flagged.has(idx)?'var(--a-bg)':'transparent',
                    color:flagged.has(idx)?'var(--a-tx)':'var(--tx4)',cursor:'pointer'}}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill={flagged.has(idx)?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                  {flagged.has(idx)?'Flagged':'Flag'}
                </button>
              </div>

              {/* Passage */}
              {q.passage_text&&(
                <div style={{background:'var(--sf)',border:'1px solid var(--line)',borderLeft:'3px solid var(--lime-dk)',borderRadius:11,padding:'13px 16px',marginBottom:18}}>
                  <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--lime-dk)',marginBottom:8}}>Passage</div>
                  <MathText text={q.passage_text} style={{fontSize:13.5,lineHeight:1.9,color:'var(--tx2)'}} />
                </div>
              )}

              {/* Question text */}
              <MathText text={q.question_text} style={{fontSize:15.5,lineHeight:1.8,color:'var(--tx)',marginBottom:22,fontWeight:400}} />

              {/* Choices */}
              <div style={{display:'flex',flexDirection:'column',gap:9,marginBottom:20}}>
                {opts.map((opt,i)=>{
                  if (!opt) return null
                  const cs=choiceStyle(i); const ls=labelStyle(i)
                  return (
                    <div key={i} onClick={()=>!submitted&&setSel(LABELS[i])}
                      style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',borderRadius:11,
                        border:`1.5px solid ${cs.borderColor}`,background:cs.background as string,
                        cursor:submitted?'default':'pointer',opacity:cs.opacity,transition:'border-color .12s,background .12s'}}>
                      <div style={{width:28,height:28,borderRadius:'50%',border:`1.5px solid ${ls.borderColor}`,
                        fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',
                        flexShrink:0,fontFamily:'var(--mono)',
                        background:ls.background as string,color:ls.color as string,marginTop:1}}>{LABELS[i]}</div>
                      <MathText text={opt} style={{fontSize:14.5,lineHeight:1.7,color:'var(--tx)',flex:1,paddingTop:2}} />
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div style={{display:'flex',gap:8,marginBottom:18,alignItems:'center',flexWrap:'wrap'}}>
                {!submitted ? (
                  <>
                    <button onClick={() => confirmAnswer()} disabled={!sel}
                      style={{padding:'10px 22px',background:'var(--lime-dk)',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:sel?'pointer':'default',opacity:sel?1:.35}}>
                      Confirm
                    </button>
                    <button onClick={()=>goTo(Math.min(total-1,idx+1))}
                      style={{padding:'10px 14px',background:'transparent',color:'var(--tx3)',border:'1px solid var(--line2)',borderRadius:10,fontSize:13.5,cursor:'pointer'}}>
                      Skip
                    </button>
                  </>
                ) : idx<total-1 ? (
                  <button onClick={goNext}
                    style={{padding:'10px 20px',background:'var(--sf3)',color:'var(--tx)',border:'1px solid var(--line2)',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                    Next →
                  </button>
                ) : (
                  <button onClick={()=>setSessionDone(true)}
                    style={{padding:'10px 20px',background:'var(--lime-dk)',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer'}}>
                    See results →
                  </button>
                )}
                {/* Bookmark */}
                <button onClick={()=>{
                    if (!q||!submitted) return
                    const ex=sessionStore.get().answered.find(a=>a.questionId===q.id)
                    if(ex) sessionStore.toggleSaved(ex)
                  }}
                  style={{width:36,height:36,borderRadius:9,
                    border:`1px solid ${saved.has(q.id)?'var(--lime-dk)':'var(--line2)'}`,
                    background:saved.has(q.id)?'var(--lime-dim)':'var(--sf2)',
                    color:saved.has(q.id)?'var(--lime-dk)':'var(--tx3)',
                    cursor:submitted?'pointer':'default',opacity:submitted?1:.4,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={saved.has(q.id)?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>

              {/* Explanation */}
              {submitted && (
                <div style={{borderRadius:12,padding:'15px 17px',marginBottom:16,
                  background:sel===q.correct_answer?'var(--g-bg)':'var(--r-bg)',
                  border:`1px solid ${sel===q.correct_answer?'var(--g-ln)':'var(--r-ln)'}`,
                  animation:'fadeUp .2s ease'}}>
                  <div style={{fontSize:13.5,fontWeight:700,marginBottom:7,
                    color:sel===q.correct_answer?'var(--g-tx)':'var(--r-tx)',
                    display:'flex',alignItems:'center',gap:6}}>
                    {sel===q.correct_answer
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    }
                    {sel===q.correct_answer?'Correct!':'Incorrect — answer is '+q.correct_answer}
                  </div>
                  {q.explanation
                    ? <MathText text={q.explanation} style={{fontSize:13.5,lineHeight:1.75,color:'var(--tx2)'}} />
                    : <div style={{fontSize:13,color:'var(--tx3)',fontStyle:'italic'}}>No explanation available.</div>}
                </div>
              )}

              {/* Keyboard hints */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap',fontSize:11,color:'var(--tx4)'}}>
                {[['A–D','select'],['Enter','confirm/next'],['→','next'],['←','prev'],['F','flag']].map(([k,v])=>(
                  <span key={k}><kbd style={{background:'var(--sf2)',border:'1px solid var(--line2)',borderRadius:4,padding:'1px 5px',fontFamily:'var(--mono)',fontSize:10}}>{k}</kbd> {v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPicker && (
        <QuestionPicker
          total={total} current={idx} answered={answeredIdxs}
          onGo={goTo} onClose={()=>setShowPicker(false)}
        />
      )}

      {showModal && <ConnectModal onClose={()=>setShowModal(false)} onConnect={tryConnect} initial={creds}/>}
    </div>
  )
}

function ConnectModal({onClose,onConnect,initial}:{onClose:()=>void;onConnect:(u:string,k:string,t:string)=>void;initial:Creds|null}) {
  const [url,setUrl]=useState(initial?.url||'')
  const [key,setKey]=useState(initial?.key||'')
  const [table,setTable]=useState(initial?.table||'sat_questions')
  const [loading,setLoading]=useState(false)
  const submit=async()=>{ setLoading(true); await onConnect(url.trim(),key.trim(),table.trim()||'sat_questions'); setLoading(false) }
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',backdropFilter:'blur(5px)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--sf)',border:'1px solid var(--line2)',borderRadius:18,padding:26,width:'100%',maxWidth:420}}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:16}}>Connect Supabase</div>
        {[{l:'Project URL',v:url,s:setUrl,p:'https://xxxx.supabase.co'},{l:'Anon key',v:key,s:setKey,p:'eyJ…'},{l:'Table',v:table,s:setTable,p:'sat_questions'}].map(f=>(
          <div key={f.l} style={{marginBottom:12}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--tx3)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>{f.l}</label>
            <input value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.p}
              style={{width:'100%',padding:'9px 12px',background:'var(--sf2)',border:'1px solid var(--line2)',borderRadius:8,fontSize:13,color:'var(--tx)',fontFamily:'var(--mono)',outline:'none'}}/>
          </div>
        ))}
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
          <button onClick={onClose} style={{padding:'7px 14px',borderRadius:8,fontSize:13,color:'var(--tx2)',border:'1px solid var(--line2)',background:'none',cursor:'pointer'}}>Cancel</button>
          <button onClick={submit} style={{padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:700,color:'#fff',background:'var(--lime-dk)',border:'none',cursor:'pointer'}}>{loading?'Connecting…':'Connect →'}</button>
        </div>
      </div>
    </div>
  )
}
