'use client'
// app/diagnostic/page.tsx
// 10-question diagnostic → instant score estimate → personalized study plan
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

interface Q {
  id: string; question_text: string; passage_text: string
  choice_a: string; choice_b: string; choice_c: string; choice_d: string
  correct_answer: string; difficulty: string; domain: string; skill: string; section: string
}

const TOTAL = 10
const TIME_PER_Q = 90 // seconds

// Score estimate from accuracy
function estimateScore(correct: number, total: number): { total: number; rw: number; math: number } {
  const acc = correct / total
  const section = Math.round(200 + acc * 600)
  return { total: section * 2, rw: section, math: section }
}

// Score label icons — all SVG, zero emoji
const SvgTrophy = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
const SvgStar   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const SvgTrend  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const SvgTarget = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const SvgSeed   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M5 12a7 7 0 0 0 7-7 7 7 0 0 0 7 7"/></svg>
const SvgBook   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>

type ScoreIcon = () => React.ReactElement
function scoreLabel(total: number): { text: string; color: string; Icon: ScoreIcon } {
  if (total >= 1500) return { text: 'Exceptional', color: '#4ade80', Icon: SvgTrophy }
  if (total >= 1350) return { text: 'Strong',      color: '#60a5fa', Icon: SvgStar   }
  if (total >= 1200) return { text: 'Developing',  color: '#fbbf24', Icon: SvgTrend  }
  if (total >= 1000) return { text: 'Needs Work',  color: '#f97316', Icon: SvgTarget }
  return                     { text: 'Starting Out',color: '#f87171', Icon: SvgSeed   }
}

function getStudyPlan(score: number, weakDomains: string[]) {
  const gap = Math.max(0, 1400 - score)
  const weeks = gap <= 0 ? 2 : gap <= 100 ? 4 : gap <= 200 ? 8 : 12
  const dailyMins = gap <= 100 ? 20 : gap <= 200 ? 30 : 45
  return { targetScore: Math.min(1600, score + Math.ceil(gap * 0.8)), weeks, dailyMins, weakDomains }
}

export default function DiagnosticPage() {
  const router = useRouter()
  const [phase, setPhase]   = useState<'intro'|'quiz'|'result'>('intro')
  const [qs, setQs]         = useState<Q[]>([])
  const [idx, setIdx]       = useState(0)
  const [sel, setSel]       = useState<string|null>(null)
  const [answers, setAnswers] = useState<{q:Q; sel:string; correct:boolean}[]>([])
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [loggedIn, setLoggedIn] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('nexus_user'))
    // Check if already done diagnostic
    const done = localStorage.getItem('nexus_diagnostic_done')
    if (done) {
      const saved = JSON.parse(done)
      setAnswers(saved.answers || [])
      setPhase('result')
    }
  }, [])

  // Fetch questions when quiz starts
  const startDiagnostic = async () => {
    setLoading(true)
    // Get mix: 5 R&W (easy+med) + 5 Math (easy+med)
    const [rw, math] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/sat_questions?select=*&section=neq.Math&limit=5&order=random`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/sat_questions?select=*&section=eq.Math&limit=5&order=random`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }).then(r => r.json()),
    ])
    const mixed = [...(Array.isArray(rw)?rw:[]), ...(Array.isArray(math)?math:[])].slice(0, TOTAL)
    if (mixed.length === 0) { setLoading(false); return }
    setQs(mixed.sort(() => Math.random() - 0.5))
    setLoading(false)
    setPhase('quiz')
    setTimeLeft(TIME_PER_Q)
    startTimeRef.current = Date.now()
  }

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleAnswer(sel ?? '') ; return TIME_PER_Q }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, idx])

  const handleAnswer = (answer: string) => {
    if (timerRef.current) clearInterval(timerRef.current)
    const q = qs[idx]
    const correct = answer === q?.correct_answer
    const newAnswers = [...answers, { q, sel: answer, correct }]
    setAnswers(newAnswers)
    setSel(null)
    if (idx + 1 >= qs.length) {
      // Save result
      localStorage.setItem('nexus_diagnostic_done', JSON.stringify({ answers: newAnswers, date: new Date().toISOString() }))
      setPhase('result')
    } else {
      setIdx(i => i + 1)
      setTimeLeft(TIME_PER_Q)
    }
  }

  const retake = () => {
    localStorage.removeItem('nexus_diagnostic_done')
    setAnswers([]); setIdx(0); setSel(null); setPhase('intro')
  }

  // ── INTRO ────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ minHeight:'calc(100dvh - var(--nav-h))', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px' }}>
        <div style={{ maxWidth:520, width:'100%', textAlign:'center' }}>
          {/* Pulsing score ring */}
          <div style={{ position:'relative', width:140, height:140, margin:'0 auto 32px' }}>
            <svg viewBox="0 0 140 140" style={{ position:'absolute', top:0, left:0 }}>
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--line)" strokeWidth="8"/>
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--lime)" strokeWidth="8"
                strokeDasharray="377" strokeDashoffset="200" strokeLinecap="round"
                style={{ transform:'rotate(-90deg)', transformOrigin:'70px 70px', animation:'spin 3s linear infinite' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--tx4)', textTransform:'uppercase', letterSpacing:'1px' }}>Your SAT</div>
              <div style={{ fontSize:28, fontWeight:900, color:'var(--tx)', letterSpacing:'-1px' }}>????</div>
            </div>
          </div>

          <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:12 }}>
            Step 1 of 3
          </div>
          <h1 style={{ fontSize:'clamp(26px,5vw,40px)', fontWeight:900, lineHeight:1.1, letterSpacing:'-1.5px', marginBottom:16, color:'var(--tx)' }}>
            Find out your real<br/>SAT score in 8 minutes
          </h1>
          <p style={{ fontSize:15, color:'var(--tx3)', lineHeight:1.75, marginBottom:28, maxWidth:400, margin:'0 auto 28px' }}>
            Answer {TOTAL} real SAT questions. We'll calculate your baseline score and build a personalized plan to get you to 1400+.
          </p>

          {/* What happens */}
          <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:16, padding:'20px', marginBottom:28, textAlign:'left' }}>
            {[
              { step:'1', label:'Answer 10 real SAT questions', sub:'Mix of R&W and Math, ~90 seconds each' },
              { step:'2', label:'See your estimated score',      sub:'Instant calculation, no waiting' },
              { step:'3', label:'Get your personal study plan',  sub:'Daily missions built around your weak spots' },
            ].map(s => (
              <div key={s.step} style={{ display:'flex', gap:14, marginBottom:s.step==='3'?0:14, alignItems:'flex-start' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--lime-dim)', border:'1px solid rgba(163,230,53,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'var(--lime-dk)', flexShrink:0 }}>{s.step}</div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'var(--tx)', marginBottom:2 }}>{s.label}</div>
                  <div style={{ fontSize:12, color:'var(--tx4)' }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={startDiagnostic} disabled={loading}
            style={{ width:'100%', padding:'16px', background:'var(--lime)', color:'#060a0e', border:'none', borderRadius:13, fontSize:17, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 24px rgba(163,230,53,.35)', opacity:loading?0.6:1, letterSpacing:'-.3px' }}>
            {loading ? 'Loading questions…' : 'Start my diagnostic →'}
          </button>
          {loggedIn && (
            <div style={{ marginTop:14, fontSize:12, color:'var(--tx4)' }}>
              Your results will be saved to your account.
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── QUIZ ─────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = qs[idx]
    if (!q) return null
    const timerPct = (timeLeft / TIME_PER_Q) * 100
    const timerColor = timeLeft > 30 ? 'var(--g-tx)' : timeLeft > 15 ? 'var(--a-tx)' : 'var(--r-tx)'
    const progress = ((idx) / TOTAL) * 100
    const labels = ['A','B','C','D']
    const choices = [q.choice_a, q.choice_b, q.choice_c, q.choice_d]

    return (
      <div style={{ maxWidth:700, margin:'0 auto', padding:'20px 20px 80px' }}>
        {/* Progress */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--tx3)' }}>
              Question {idx + 1} of {TOTAL}
            </div>
            {/* Timer */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px', borderRadius:9,
              background:timeLeft<=15?'var(--r-bg)':'var(--sf2)',
              border:`1px solid ${timeLeft<=15?'var(--r-ln)':'var(--line2)'}`,
              animation:timeLeft<=15?'pulse 1s infinite':'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <div style={{ width:44, height:3, background:'var(--sf3)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${timerPct}%`, background:timerColor, borderRadius:2, transition:'width 1s linear' }}/>
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:800, color:timerColor, minWidth:22 }}>{timeLeft}s</span>
            </div>
          </div>
          <div style={{ height:5, background:'var(--sf3)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, background:'var(--lime)', borderRadius:3, transition:'width .4s ease' }}/>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600,
            background:/math/i.test(q.section)?'rgba(37,99,235,.14)':'rgba(124,58,237,.14)',
            color:/math/i.test(q.section)?'#60a5fa':'#a78bfa' }}>
            {/math/i.test(q.section) ? 'Math' : 'Reading & Writing'}
          </span>
          {q.domain && <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, background:'var(--sf3)', color:'var(--tx3)', fontWeight:600 }}>{q.domain}</span>}
          {q.difficulty && <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid',
            borderColor:q.difficulty==='easy'?'var(--g-tx)':q.difficulty==='hard'?'var(--r-tx)':'var(--a-tx)',
            color:q.difficulty==='easy'?'var(--g-tx)':q.difficulty==='hard'?'var(--r-tx)':'var(--a-tx)' }}>{q.difficulty}</span>}
        </div>

        {/* Passage */}
        {q.passage_text && (
          <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderLeft:'3px solid var(--lime-dk)', borderRadius:12, padding:'14px 18px', marginBottom:18 }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--lime-dk)', marginBottom:8 }}>Passage</div>
            <div style={{ fontSize:13.5, lineHeight:1.85, color:'var(--tx2)' }}>{q.passage_text}</div>
          </div>
        )}

        {/* Question */}
        <div style={{ fontSize:15.5, lineHeight:1.8, color:'var(--tx)', marginBottom:22, fontWeight:400 }}>{q.question_text}</div>

        {/* Choices */}
        <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:24 }}>
          {choices.map((opt, i) => {
            if (!opt) return null
            const isSelected = sel === labels[i]
            return (
              <div key={i} onClick={() => setSel(labels[i])}
                style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 16px', borderRadius:12, cursor:'pointer',
                  border:`1.5px solid ${isSelected?'var(--lime)':'var(--line)'}`,
                  background:isSelected?'var(--lime-dim)':'var(--sf)',
                  transition:'border-color .1s, background .1s' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'var(--mono)',
                  background:isSelected?'var(--lime)':'transparent',
                  border:`1.5px solid ${isSelected?'var(--lime)':'var(--line2)'}`,
                  color:isSelected?'#060a0e':'var(--tx3)' }}>{labels[i]}</div>
                <div style={{ fontSize:14.5, lineHeight:1.65, color:'var(--tx)', paddingTop:2 }}>{opt}</div>
              </div>
            )
          })}
        </div>

        <button onClick={() => handleAnswer(sel ?? '')} disabled={!sel}
          style={{ width:'100%', padding:'14px', background:'var(--lime)', color:'#060a0e', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor:sel?'pointer':'default', opacity:sel?1:.35 }}>
          Confirm answer →
        </button>
        <div style={{ textAlign:'center', marginTop:10, fontSize:12, color:'var(--tx4)' }}>
          Or press <kbd style={{ background:'var(--sf3)', padding:'1px 6px', borderRadius:4, fontFamily:'var(--mono)' }}>Enter</kbd> to confirm
        </div>
      </div>
    )
  }

  // ── RESULT ───────────────────────────────────────────────
  if (phase === 'result') {
    const correct = answers.filter(a => a.correct).length
    const total   = answers.length
    const score   = total > 0 ? estimateScore(correct, total) : { total: 1100, rw: 550, math: 550 }
    const label   = scoreLabel(score.total)
    const weakDomains = [...new Set(answers.filter(a => !a.correct).map(a => a.q?.domain).filter(Boolean))]
    const plan    = getStudyPlan(score.total, weakDomains as string[])
    const pointGap = plan.targetScore - score.total

    // Save to localStorage for dashboard
    if (total > 0) {
      localStorage.setItem('nexus_baseline_score', String(score.total))
      localStorage.setItem('nexus_target_score', String(plan.targetScore))
      localStorage.setItem('nexus_study_plan', JSON.stringify(plan))
    }

    return (
      <div style={{ maxWidth:620, margin:'0 auto', padding:'32px 20px 100px' }}>

        {/* Score reveal */}
        <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:22, padding:'36px 28px', textAlign:'center', marginBottom:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:300, height:300, borderRadius:'50%', background:label.color, opacity:.06 }}/>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'var(--tx4)', marginBottom:16 }}>Your Diagnostic Score</div>
          <div style={{ fontSize:80, fontWeight:900, lineHeight:1, letterSpacing:'-4px', color:label.color, marginBottom:8, fontFamily:'var(--mono)' }}>{score.total}</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 18px', borderRadius:100, background:`${label.color}18`, border:`1px solid ${label.color}40`, marginBottom:20, color:label.color }}>
            <label.Icon />
            <span style={{ fontSize:14, fontWeight:700, color:label.color }}>{label.text}</span>
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:20 }}>
            {[{l:'R&W',v:score.rw,c:'#a78bfa'},{l:'Math',v:score.math,c:'var(--lime-dk)'}].map(s=>(
              <div key={s.l} style={{ background:'var(--sf2)', border:'1px solid var(--line)', borderRadius:12, padding:'12px 20px', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:900, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:'var(--tx4)', marginTop:3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:13, color:'var(--tx3)' }}>{correct}/{total} correct · baseline estimate</div>
        </div>

        {/* Target */}
        <div style={{ background:'rgba(163,230,53,.08)', border:'1px solid rgba(163,230,53,.25)', borderRadius:18, padding:'22px 24px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(163,230,53,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--lime-dk)', flexShrink:0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--tx)', marginBottom:2 }}>
                Your target: <span style={{ color:'var(--lime-dk)' }}>{plan.targetScore}</span>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--tx4)', marginLeft:6 }}>(+{pointGap} points)</span>
              </div>
              <div style={{ fontSize:13, color:'var(--tx3)' }}>{plan.weeks} weeks · {plan.dailyMins} min/day</div>
            </div>
          </div>

          {/* Progress bar: baseline → target */}
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--tx4)', marginBottom:6 }}>
              <span>400</span><span>800</span><span>1200</span><span>1600</span>
            </div>
            <div style={{ height:8, background:'var(--sf3)', borderRadius:4, overflow:'hidden', position:'relative' }}>
              <div style={{ height:'100%', width:`${((score.total-400)/1200)*100}%`, background:label.color, borderRadius:4 }}/>
              <div style={{ position:'absolute', top:0, height:'100%', left:`${((score.total-400)/1200)*100}%`, width:`${((plan.targetScore-score.total)/1200)*100}%`, background:'var(--lime)', opacity:.4, borderRadius:'0 4px 4px 0' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
              <span style={{ fontSize:11, color:label.color, fontWeight:700 }}>You now: {score.total}</span>
              <span style={{ fontSize:11, color:'var(--lime-dk)', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>Target: {plan.targetScore} <SvgTrophy /></span>
            </div>
          </div>
        </div>

        {/* Weak spots */}
        {weakDomains.length > 0 && (
          <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:16, padding:'20px', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)', marginBottom:12, display:'flex', alignItems:'center', gap:7 }}><span style={{ color:'#a78bfa' }}><SvgBook /></span> Focus areas identified</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {weakDomains.slice(0,3).map((d,i) => (
                <div key={d} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--r-bg)', border:'1px solid var(--r-ln)', borderRadius:10 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:'var(--r-tx)', minWidth:18 }}>#{i+1}</span>
                  <span style={{ fontSize:13, color:'var(--tx2)', flex:1 }}>{d}</span>
                  <Link href={`/bank?domain=${encodeURIComponent(d)}`} style={{ fontSize:11.5, color:'var(--lime-dk)', fontWeight:700, textDecoration:'none', flexShrink:0 }}>Practice →</Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Link href="/" style={{ display:'block', padding:'15px', background:'var(--lime)', color:'#060a0e', borderRadius:13, fontWeight:800, fontSize:16, textDecoration:'none', textAlign:'center', boxShadow:'0 4px 20px rgba(163,230,53,.3)' }}>
            Go to my dashboard →
          </Link>
          <div style={{ display:'flex', gap:10 }}>
            <Link href="/bank" style={{ flex:1, display:'block', padding:'12px', background:'var(--sf)', border:'1px solid var(--line2)', color:'var(--tx2)', borderRadius:12, fontWeight:600, fontSize:14, textDecoration:'none', textAlign:'center' }}>
              Practice weak spots
            </Link>
            <button onClick={retake} style={{ flex:1, padding:'12px', background:'var(--sf)', border:'1px solid var(--line2)', color:'var(--tx3)', borderRadius:12, fontWeight:600, fontSize:14, cursor:'pointer' }}>
              Retake diagnostic
            </button>
          </div>
        </div>

        <div style={{ marginTop:16, padding:'12px 16px', background:'var(--sf)', border:'1px solid var(--line)', borderRadius:12, fontSize:12, color:'var(--tx4)', lineHeight:1.65 }}>
          <strong style={{ color:'var(--tx3)' }}>Note:</strong> This is a baseline estimate based on {total} questions. Your real SAT score may vary. Practice more questions for a more accurate prediction.
        </div>
      </div>
    )
  }

  return null
}
