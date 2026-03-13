'use client'
// app/bank/page.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
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

// Domains that belong to Math even if stored under English section in DB
const MATH_ONLY_DOMAINS = ['problem-solving and data analysis','problem solving and data analysis','data analysis']

function isMathDomain(domain: string) {
  return MATH_ONLY_DOMAINS.includes(domain.toLowerCase())
}

/* ─── Clock ────────────────────────────────────────────────── */
function Clock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    tick(); const id = setInterval(tick,1000); return () => clearInterval(id)
  }, [])
  return <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--tx4)'}}>{t}</span>
}

/* ─── Nav button ───────────────────────────────────────────── */
function NavBtn({onClick,disabled,children}:{onClick:()=>void;disabled:boolean;children:React.ReactNode}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{width:30,height:30,borderRadius:7,border:'1px solid var(--line2)',background:'var(--sf2)',fontSize:14,color:'var(--tx3)',cursor:disabled?'default':'pointer',opacity:disabled?.25:1,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      {children}
    </button>
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
  const [sideOpen, setSideOpen]   = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Use refs so filter callbacks always see current values
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
    const data = await supaFetch(c, {select:'section,domain,skill',limit:5000})
    if (!Array.isArray(data)) return
    const map: Record<string,Record<string,Record<string,number>>> = {English:{},Math:{}}
    data.forEach((r: any) => {
      const rawSec = /math/i.test(r.section) ? 'Math' : 'English'
      const domain = r.domain || 'Other'
      const skill  = r.skill  || ''
      // Reclassify "Problem Solving and Data Analysis" → Math
      const s = (rawSec === 'English' && isMathDomain(domain)) ? 'Math' : rawSec
      if (!map[s][domain]) map[s][domain] = {_total:0}
      map[s][domain]._total = (map[s][domain]._total||0)+1
      if (skill) map[s][domain][skill] = (map[s][domain][skill]||0)+1
    })
    const toArr = (obj: Record<string,Record<string,number>>): TreeDomain[] =>
      Object.keys(obj).map(d => ({name:d,count:obj[d]._total||0,children:Object.keys(obj[d]).filter(k=>k!=='_total').map(sk=>({name:sk,count:obj[d][sk]}))}))
    setTree({English:toArr(map.English),Math:toArr(map.Math)})
  }, [])

  // Core load function — reads current values from refs so it's always fresh
  const loadQs = useCallback(async (dom: string, sk: string|null, overrideSec?: string) => {
    const c = credsRef.current
    if (!c) return
    const useSec    = overrideSec ?? secRef.current
    const useDiff   = diffRef.current
    const useShuffle = shuffleRef.current

    setLoadingQs(true); setQs([]); setIdx(0); setSel(null); setSubmitted(false)
    setCorrect(0); setWrong(0); setSessionDone(false); setFlagged(new Set())

    const filters: {col:string;op:string;val:string}[] = []
    if (dom) filters.push({col:'domain',op:'eq',val:dom})
    if (sk)  filters.push({col:'skill', op:'eq',val:sk})
    if (useDiff !== 'all') filters.push({col:'difficulty',op:'eq',val:useDiff})

    const data = await supaFetch(c, {
      select:'id,section,domain,skill,difficulty,question_text,passage_text,choice_a,choice_b,choice_c,choice_d,correct_answer,explanation',
      filters, limit:500,
    })
    let items: Question[] = Array.isArray(data) ? data : []

    // Filter by section — also reclassify PSDA
    items = items.filter(q => {
      const qSec = isMathDomain(q.domain||'') ? 'Math' : (/math/i.test(q.section) ? 'Math' : 'English')
      return qSec === useSec
    })

    const sorted = useShuffle ? [...items].sort(()=>Math.random()-.5) : items
    setQs(sorted); setLoadingQs(false)
    if (sorted.length > 0) setSideOpen(false)
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

  // When diff or shuffle changes, reload if a topic is active
  const handleDiffChange = (d: string) => {
    setDiff(d); diffRef.current = d
    const dom = actDomRef.current
    if (dom) loadQs(dom, actSkRef.current)
  }
  const handleShuffleChange = () => {
    const next = !shuffleRef.current
    setShuffle(next); shuffleRef.current = next
    const dom = actDomRef.current
    if (dom) loadQs(dom, actSkRef.current)
  }

  const goTo = (i: number) => { setIdx(i); setSel(null); setSubmitted(false) }

  const confirmAnswer = useCallback(() => {
    if (!sel || submitted || !qs[idx]) return
    const q = qs[idx]
    const isCorrect = sel === q.correct_answer
    setSubmitted(true)
    if (isCorrect) setCorrect(c=>c+1); else setWrong(c=>c+1)
    sessionStore.addAnswer({
      questionId:q.id, section:q.section, domain:q.domain||'',
      skill:q.skill||'', difficulty:q.difficulty||'',
      selectedAnswer:sel, correctAnswer:q.correct_answer, isCorrect,
      explanation:q.explanation||'', question_text:q.question_text,
      choice_a:q.choice_a, choice_b:q.choice_b, choice_c:q.choice_c, choice_d:q.choice_d,
    })
    if (idx === qs.length-1) setTimeout(()=>setSessionDone(true),700)
  }, [sel,submitted,qs,idx])

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
      if (e.key.toLowerCase()==='s' && qs[idx] && submitted) {
        const ex = sessionStore.get().answered.find(a=>a.questionId===qs[idx].id)
        if (ex) sessionStore.toggleSaved(ex)
      }
    }
    window.addEventListener('keydown',h)
    return ()=>window.removeEventListener('keydown',h)
  }, [submitted,sel,idx,qs,confirmAnswer,sessionDone])

  const q       = qs[idx]
  const total   = qs.length
  const done    = correct+wrong
  const pct     = total ? Math.round((done/total)*100) : 0
  const opts    = q ? [q.choice_a,q.choice_b,q.choice_c,q.choice_d] : []
  const corrIdx = q ? LABELS.indexOf(q.correct_answer) : -1

  const choiceStyle = (i: number): React.CSSProperties => {
    if (!submitted) {
      return sel===LABELS[i]
        ? {borderColor:'var(--lime)',background:'var(--lime-dim)',opacity:1}
        : {borderColor:'var(--line)',background:'var(--sf)',opacity:1}
    }
    if (i===corrIdx) return {borderColor:'var(--g-tx)',background:'var(--g-bg)',opacity:1}
    if (LABELS[i]===sel) return {borderColor:'var(--r-tx)',background:'var(--r-bg)',opacity:1}
    return {borderColor:'var(--line)',background:'var(--sf)',opacity:0.25}
  }
  const labelStyle = (i: number): React.CSSProperties => {
    if (!submitted && sel===LABELS[i]) return {background:'var(--lime)',color:'#060a0e',borderColor:'var(--lime)'}
    if (submitted && i===corrIdx) return {background:'var(--g-tx)',color:'#fff',borderColor:'var(--g-tx)'}
    if (submitted && LABELS[i]===sel) return {background:'var(--r-tx)',color:'#fff',borderColor:'var(--r-tx)'}
    return {background:'transparent',color:'var(--tx3)',borderColor:'var(--line2)'}
  }

  // ── Guest gate ────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100dvh - var(--nav-h))',padding:24}}>
        <div style={{background:'var(--sf)',border:'1px solid var(--line)',borderRadius:22,padding:'48px 32px',maxWidth:400,width:'100%',textAlign:'center',animation:'fadeUp .3s ease'}}>
          <div style={{width:64,height:64,background:'var(--lime)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:900,color:'#060a0e',margin:'0 auto 24px'}}>N</div>
          <div style={{fontSize:20,fontWeight:800,marginBottom:10,letterSpacing:'-.3px'}}>Sign in to practice</div>
          <div style={{fontSize:14,color:'var(--tx3)',lineHeight:1.7,marginBottom:28}}>
            Create a free account to access the full question bank, track your progress, and predict your SAT score.
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/settings" style={{padding:'11px 26px',background:'var(--lime)',color:'#060a0e',borderRadius:11,fontWeight:800,fontSize:14,textDecoration:'none'}}>
              Sign up free →
            </Link>
            <Link href="/settings" style={{padding:'11px 18px',background:'var(--sf2)',color:'var(--tx2)',border:'1px solid var(--line2)',borderRadius:11,fontSize:14,textDecoration:'none'}}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{display:'flex',height:'calc(100dvh - var(--nav-h))',overflow:'hidden',position:'relative'}}>

      {/* Mobile overlay */}
      {sideOpen && <div onClick={()=>setSideOpen(false)} className="mob-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:200,display:'block'}} />}

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside className={`sidebar${sideOpen?' sidebar-open':''}`}
        style={{width:'var(--side-w)',minWidth:'var(--side-w)',borderRight:'1px solid var(--line)',background:'var(--sf)',display:'flex',flexDirection:'column',height:'100%',zIndex:250}}>

        {/* Connection status */}
        <div style={{padding:'8px 12px',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:6,fontSize:11.5}}>
          <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:connected==='live'?'var(--lime)':connected==='err'?'var(--r-tx)':'var(--tx4)',boxShadow:connected==='live'?'0 0 6px rgba(163,230,53,.5)':'none'}} />
          <span style={{color:'var(--tx4)',flex:1}}>{connected==='live'?'Connected':connected==='checking'?'Connecting…':connected==='err'?'Error':'Offline'}</span>
          {isAdmin && <button onClick={()=>setShowModal(true)} style={{fontSize:11,color:'var(--lime-dk)',cursor:'pointer',border:'none',background:'none'}}>Edit</button>}
        </div>

        {/* Filters */}
        <div style={{padding:'10px 12px',borderBottom:'1px solid var(--line)',display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'var(--tx4)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:6}}>Difficulty</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {['all','easy','medium','hard'].map(d=>(
                <button key={d} onClick={()=>handleDiffChange(d)}
                  style={{padding:'4px 11px',borderRadius:100,fontSize:12,fontWeight:d===diff?700:500,border:`1px solid ${d===diff?'var(--lime)':'var(--line2)'}`,background:d===diff?'var(--lime)':'transparent',color:d===diff?'#060a0e':'var(--tx3)',cursor:'pointer',transition:'all .12s'}}>
                  {d==='all'?'All':d[0].toUpperCase()+d.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:13,color:'var(--tx2)'}}>Shuffle</span>
            <button onClick={handleShuffleChange}
              style={{width:36,height:20,borderRadius:10,border:'none',background:shuffle?'var(--lime)':'var(--sf3)',position:'relative',cursor:'pointer',transition:'background .2s',flexShrink:0}}>
              <span style={{position:'absolute',width:16,height:16,borderRadius:'50%',background:'white',top:2,left:shuffle?18:2,transition:'left .18s',boxShadow:'0 1px 4px rgba(0,0,0,.25)'}} />
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div style={{display:'flex',borderBottom:'1px solid var(--line)',flexShrink:0}}>
          {(['English','Math'] as const).map(s=>(
            <button key={s} onClick={()=>{setSec(s);secRef.current=s;setActDom(null);actDomRef.current=null;setActSk(null);actSkRef.current=null;setQs([]);setSessionDone(false)}}
              style={{flex:1,padding:'9px 4px',fontSize:11.5,fontWeight:600,border:'none',background:'none',cursor:'pointer',color:sec===s?'var(--lime-dk)':'var(--tx3)',borderBottom:sec===s?'2px solid var(--lime)':'2px solid transparent',transition:'color .12s'}}>
              {s==='English'?'Reading & Writing':'Math'}
            </button>
          ))}
        </div>

        {/* Topic tree */}
        <div style={{flex:1,overflowY:'auto',paddingBottom:40}}>
          {(tree[sec]||[]).length===0 && connected==='live' && (
            <div style={{padding:'24px 16px',textAlign:'center',fontSize:12,color:'var(--tx4)'}}>No topics found</div>
          )}
          {(tree[sec]||[]).map((dom,di)=>{
            const open = dom.name===actDom
            return (
              <div key={di} style={{borderBottom:'1px solid var(--line)'}}>
                <div onClick={()=>{setActDom(dom.name);actDomRef.current=dom.name;setActSk(null);actSkRef.current=null;loadQs(dom.name,null)}}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',cursor:'pointer',background:open&&!actSk?'var(--lime-dim)':'transparent',transition:'background .1s'}}>
                  <span style={{fontSize:8,color:'var(--tx4)',transition:'transform .18s',display:'inline-block',transform:open?'rotate(90deg)':'none'}}>▶</span>
                  <span style={{fontSize:12.5,fontWeight:600,flex:1,color:open&&!actSk?'var(--lime-dk)':'var(--tx)',lineHeight:1.3}}>{dom.name}</span>
                  <span style={{fontSize:10,color:'var(--tx4)',background:'var(--sf3)',padding:'2px 7px',borderRadius:100,fontFamily:'var(--mono)'}}>{dom.count}</span>
                </div>
                {open && dom.children.map((sk,si)=>(
                  <div key={si} onClick={()=>{setActSk(sk.name);actSkRef.current=sk.name;loadQs(dom.name,sk.name)}}
                    style={{display:'flex',alignItems:'center',gap:7,padding:'7px 12px 7px 26px',cursor:'pointer',background:actSk===sk.name?'var(--lime-dim)':'transparent',borderLeft:`2px solid ${actSk===sk.name?'var(--lime)':'transparent'}`,transition:'background .1s'}}>
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
        <div style={{height:44,borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',padding:'0 12px',gap:8,background:'var(--sf)',flexShrink:0}}>
          <button onClick={()=>setSideOpen(o=>!o)} className="mob-menu-btn"
            style={{width:32,height:32,borderRadius:7,border:'1px solid var(--line2)',background:'var(--sf2)',cursor:'pointer',display:'none',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--tx2)'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div style={{flex:1,fontSize:12,color:'var(--tx3)',display:'flex',gap:5,alignItems:'center',overflow:'hidden'}}>
            {q ? (
              <>
                <span style={{color:'var(--tx4)',flexShrink:0}}>{/math/i.test(q.section)||isMathDomain(q.domain||'')?'Math':'R&W'}</span>
                {q.domain&&<><span style={{color:'var(--tx4)'}}>›</span><span style={{color:'var(--tx2)',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.domain}</span></>}
                {q.skill&&<><span style={{color:'var(--tx4)',flexShrink:0}}>›</span><span style={{color:'var(--tx2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.skill}</span></>}
              </>
            ) : <span>Select a topic from the sidebar</span>}
          </div>

          <Clock />

          {total>0 && !sessionDone && (
            <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
              <NavBtn onClick={()=>goTo(Math.max(0,idx-1))} disabled={idx===0}>‹</NavBtn>
              <span style={{fontFamily:'var(--mono)',fontSize:11.5,color:'var(--tx3)',minWidth:44,textAlign:'center'}}>{idx+1}/{total}</span>
              <NavBtn onClick={()=>goTo(Math.min(total-1,idx+1))} disabled={idx===total-1}>›</NavBtn>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{height:3,background:'var(--sf3)',flexShrink:0}}>
          <div style={{height:'100%',background:'var(--lime)',width:`${pct}%`,transition:'width .35s ease'}} />
        </div>

        {/* Stats strip */}
        {total>0 && (
          <div style={{height:32,borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',padding:'0 16px',gap:16,flexShrink:0,background:'var(--sf)',fontSize:12}}>
            <span style={{color:'var(--g-tx)',fontWeight:600}}>{correct} correct</span>
            <span style={{color:'var(--r-tx)',fontWeight:600}}>{wrong} wrong</span>
            <span style={{color:'var(--tx4)'}}>{total-done} left</span>
            {done>0 && <span style={{marginLeft:'auto',color:'var(--tx3)'}}>{Math.round((correct/done)*100)}% acc</span>}
            {flagged.size>0 && <span style={{color:'var(--a-tx)',fontSize:11}}>{flagged.size} flagged</span>}
          </div>
        )}

        {/* Content area */}
        <div style={{flex:1,overflowY:'auto'}}>

          {loadingQs && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:12}}>
              <div className="spinner"/>
              <span style={{fontSize:13,color:'var(--tx3)'}}>Loading questions…</span>
            </div>
          )}

          {!loadingQs && !q && !sessionDone && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:12,padding:'48px 24px',textAlign:'center'}}>
              <div style={{width:56,height:56,borderRadius:14,background:'var(--sf)',border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--tx4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <div style={{fontSize:15,fontWeight:700,color:'var(--tx2)'}}>Pick a topic to start</div>
              <div style={{fontSize:13,color:'var(--tx4)',maxWidth:260,lineHeight:1.65}}>Choose a domain or skill from the sidebar. Use difficulty filters to focus your practice.</div>
            </div>
          )}

          {/* Session complete */}
          {sessionDone && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',padding:'24px'}}>
              <div style={{background:'var(--sf)',border:'1px solid var(--line)',borderRadius:20,padding:'40px 32px',maxWidth:380,width:'100%',textAlign:'center',animation:'fadeUp .3s ease'}}>
                <div style={{fontSize:52,marginBottom:16}}>{(correct/total)>=.8?'🎉':(correct/total)>=.6?'💪':'📚'}</div>
                <div style={{fontSize:20,fontWeight:800,marginBottom:4,letterSpacing:'-.3px'}}>Session complete!</div>
                <div style={{fontSize:13,color:'var(--tx3)',marginBottom:24}}>{actSk||actDom} · {total} questions</div>
                <div style={{display:'flex',justifyContent:'center',gap:20,marginBottom:28}}>
                  {[{l:'Score',v:`${Math.round((correct/total)*100)}%`,c:(correct/total)>=.8?'var(--g-tx)':(correct/total)>=.6?'var(--a-tx)':'var(--r-tx)'},
                    {l:'Correct',v:String(correct),c:'var(--g-tx)'},{l:'Wrong',v:String(wrong),c:'var(--r-tx)'}].map(s=>(
                    <div key={s.l} style={{textAlign:'center'}}>
                      <div style={{fontFamily:'var(--mono)',fontSize:26,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
                      <div style={{fontSize:11,color:'var(--tx4)',marginTop:4}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                  <button onClick={()=>{setSessionDone(false);setIdx(0);setSel(null);setSubmitted(false);setCorrect(0);setWrong(0)}}
                    style={{padding:'10px 20px',background:'var(--lime)',color:'#060a0e',border:'none',borderRadius:10,fontSize:13.5,fontWeight:700,cursor:'pointer'}}>
                    Review answers
                  </button>
                  <button onClick={()=>actDom&&loadQs(actDom,actSk)}
                    style={{padding:'10px 16px',background:'var(--sf3)',color:'var(--tx)',border:'1px solid var(--line2)',borderRadius:10,fontSize:13,cursor:'pointer'}}>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Question */}
          {!loadingQs && q && !sessionDone && (
            <div key={`${q.id}-${idx}`} style={{maxWidth:780,padding:'24px 22px 80px',animation:'fadeUp .18s ease'}}>

              {/* Badges + flag */}
              <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap',marginBottom:16}}>
                <span style={{padding:'3px 9px',borderRadius:6,fontSize:11,fontWeight:600,
                  background:/math/i.test(q.section)||isMathDomain(q.domain||'')?'rgba(37,99,235,.14)':'rgba(124,58,237,.14)',
                  color:/math/i.test(q.section)||isMathDomain(q.domain||'')?'#60a5fa':'#a78bfa'}}>
                  {/math/i.test(q.section)||isMathDomain(q.domain||'')?'Math':'Reading & Writing'}
                </span>
                {q.domain&&<span style={{padding:'3px 9px',borderRadius:6,fontSize:11,fontWeight:600,background:'var(--sf3)',color:'var(--tx2)'}}>{q.domain}</span>}
                {q.skill&&<span style={{padding:'3px 9px',borderRadius:6,fontSize:11,background:'var(--sf3)',color:'var(--tx3)'}}>{q.skill}</span>}
                {q.difficulty&&(
                  <span style={{padding:'3px 9px',borderRadius:6,fontSize:11,fontWeight:600,border:'1px solid currentColor',background:'transparent',
                    color:q.difficulty==='easy'?'var(--g-tx)':q.difficulty==='hard'?'var(--r-tx)':'var(--a-tx)'}}>
                    {q.difficulty}
                  </span>
                )}
                <button onClick={()=>setFlagged(prev=>{const n=new Set(prev);n.has(idx)?n.delete(idx):n.add(idx);return n})}
                  title="Flag question (F)" style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:6,fontSize:11,fontWeight:600,border:`1px solid ${flagged.has(idx)?'var(--a-tx)':'var(--line2)'}`,background:flagged.has(idx)?'var(--a-bg)':'transparent',color:flagged.has(idx)?'var(--a-tx)':'var(--tx4)',cursor:'pointer'}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={flagged.has(idx)?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                  {flagged.has(idx)?'Flagged':'Flag'}
                </button>
              </div>

              {/* Passage */}
              {q.passage_text&&(
                <div style={{background:'var(--sf)',border:'1px solid var(--line)',borderLeft:'3px solid var(--lime-dk)',borderRadius:12,padding:'14px 18px',marginBottom:20}}>
                  <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:1,color:'var(--lime-dk)',marginBottom:10}}>Passage</div>
                  <MathText text={q.passage_text} style={{fontSize:13.5,lineHeight:1.9,color:'var(--tx2)'}} />
                </div>
              )}

              {/* Question */}
              <MathText text={q.question_text} style={{fontSize:15.5,lineHeight:1.8,color:'var(--tx)',marginBottom:24,fontWeight:400}} />

              {/* Choices */}
              <div style={{display:'flex',flexDirection:'column',gap:9,marginBottom:22}}>
                {opts.map((opt,i)=>{
                  if (!opt) return null
                  const cs=choiceStyle(i); const ls=labelStyle(i)
                  return (
                    <div key={i} onClick={()=>!submitted&&setSel(LABELS[i])}
                      style={{display:'flex',alignItems:'flex-start',gap:12,padding:'13px 16px',borderRadius:12,border:`1.5px solid ${cs.borderColor}`,background:cs.background as string,cursor:submitted?'default':'pointer',opacity:cs.opacity,transition:'border-color .12s,background .12s'}}>
                      <div style={{width:28,height:28,borderRadius:'50%',border:`1.5px solid ${ls.borderColor}`,fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:'var(--mono)',background:ls.background as string,color:ls.color as string,marginTop:1}}>{LABELS[i]}</div>
                      <MathText text={opt} style={{fontSize:14.5,lineHeight:1.7,color:'var(--tx)',flex:1,paddingTop:2}} />
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div style={{display:'flex',gap:8,marginBottom:20,alignItems:'center',flexWrap:'wrap'}}>
                {!submitted ? (
                  <>
                    <button onClick={confirmAnswer} disabled={!sel}
                      style={{padding:'10px 24px',background:'var(--lime)',color:'#060a0e',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:sel?'pointer':'default',opacity:sel?1:.35,transition:'opacity .15s'}}>
                      Confirm
                    </button>
                    <button onClick={()=>goTo(Math.min(total-1,idx+1))}
                      style={{padding:'10px 16px',background:'transparent',color:'var(--tx3)',border:'1px solid var(--line2)',borderRadius:10,fontSize:13.5,cursor:'pointer'}}>
                      Skip
                    </button>
                  </>
                ) : idx<total-1 ? (
                  <button onClick={()=>goTo(idx+1)}
                    style={{padding:'10px 22px',background:'var(--sf3)',color:'var(--tx)',border:'1px solid var(--line2)',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>
                    Next →
                  </button>
                ) : (
                  <button onClick={()=>setSessionDone(true)}
                    style={{padding:'10px 22px',background:'var(--lime)',color:'#060a0e',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer'}}>
                    See results →
                  </button>
                )}
                {/* Bookmark */}
                <button onClick={()=>{
                  if(!q||!submitted) return
                  const ex=sessionStore.get().answered.find(a=>a.questionId===q.id)
                  if(ex) sessionStore.toggleSaved(ex)
                }} title="Bookmark (S)"
                  style={{width:38,height:38,borderRadius:9,border:`1px solid ${saved.has(q.id)?'var(--lime)':'var(--line2)'}`,background:saved.has(q.id)?'var(--lime-dim)':'var(--sf2)',color:saved.has(q.id)?'var(--lime-dk)':'var(--tx3)',cursor:submitted?'pointer':'default',opacity:submitted?1:.4,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={saved.has(q.id)?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>

              {/* Explanation */}
              {submitted && (
                <div style={{borderRadius:13,padding:'16px 18px',marginBottom:18,
                  background:sel===q.correct_answer?'var(--g-bg)':'var(--r-bg)',
                  border:`1px solid ${sel===q.correct_answer?'var(--g-ln)':'var(--r-ln)'}`,
                  animation:'fadeUp .2s ease'}}>
                  <div style={{fontSize:13.5,fontWeight:700,marginBottom:8,color:sel===q.correct_answer?'var(--g-tx)':'var(--r-tx)'}}>
                    {sel===q.correct_answer?'✓ Correct!':'✗ Incorrect — correct answer is '+q.correct_answer}
                  </div>
                  {q.explanation ? (
                    <MathText text={q.explanation} style={{fontSize:13.5,lineHeight:1.75,color:'var(--tx2)'}} />
                  ) : (
                    <div style={{fontSize:13,color:'var(--tx3)',fontStyle:'italic'}}>No explanation available for this question.</div>
                  )}
                </div>
              )}

              {/* Keyboard hints */}
              <div style={{display:'flex',gap:10,flexWrap:'wrap',fontSize:11,color:'var(--tx4)'}}>
                {[['A–D','select'],['Enter','confirm/next'],['→','next'],['←','prev'],['F','flag'],['S','bookmark']].map(([k,v])=>(
                  <span key={k}><kbd style={{background:'var(--sf2)',border:'1px solid var(--line2)',borderRadius:4,padding:'1px 5px',fontFamily:'var(--mono)',fontSize:10.5}}>{k}</kbd> {v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && <ConnectModal onClose={()=>setShowModal(false)} onConnect={tryConnect} initial={creds}/>}
    </div>
  )
}

function ConnectModal({onClose,onConnect,initial}:{onClose:()=>void;onConnect:(u:string,k:string,t:string)=>void;initial:Creds|null}) {
  const [url,setUrl]=useState(initial?.url||'')
  const [key,setKey]=useState(initial?.key||'')
  const [table,setTable]=useState(initial?.table||'sat_questions')
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  const submit=async()=>{
    if(!url||!key){setErr('Enter URL and key.');return}
    setLoading(true);await onConnect(url.trim(),key.trim(),table.trim()||'sat_questions');setLoading(false)
  }
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.65)',backdropFilter:'blur(5px)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--sf)',border:'1px solid var(--line2)',borderRadius:18,padding:28,width:'100%',maxWidth:440}}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:18}}>Connect Supabase</div>
        {[{l:'Project URL',v:url,s:setUrl,p:'https://xxxx.supabase.co'},{l:'Anon key',v:key,s:setKey,p:'eyJ…'},{l:'Table',v:table,s:setTable,p:'sat_questions'}].map(f=>(
          <div key={f.l} style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--tx3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>{f.l}</label>
            <input value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.p}
              style={{width:'100%',padding:'9px 12px',background:'var(--sf2)',border:'1px solid var(--line2)',borderRadius:8,fontSize:13,color:'var(--tx)',fontFamily:'var(--mono)',outline:'none'}}/>
          </div>
        ))}
        {err&&<div style={{fontSize:12.5,color:'var(--r-tx)',background:'var(--r-bg)',border:'1px solid var(--r-ln)',borderRadius:8,padding:'8px 12px',marginBottom:12}}>{err}</div>}
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'7px 14px',borderRadius:8,fontSize:13,color:'var(--tx2)',border:'1px solid var(--line2)',background:'none',cursor:'pointer'}}>Cancel</button>
          <button onClick={submit} style={{padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:700,color:'#060a0e',background:'var(--lime)',border:'none',cursor:'pointer'}}>{loading?'Connecting…':'Connect →'}</button>
        </div>
      </div>
    </div>
  )
}
