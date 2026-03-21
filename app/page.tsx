'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { sessionStore, getLevelInfo } from '@/lib/store/session'
import { useGamification, useStats, useWeakSkills } from '@/lib/store/useSession'

/* ─── Icons ────────────────────────────────────────────── */
const A = (p:any) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const Check = (p:any) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>
const X = (p:any) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const Fire = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
const Star = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const Target = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const Clock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const Brain = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 014.76-1.4M14.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 004.96-.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-4.76-1.4"/></svg>
const Trophy = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
const Bolt = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>

/* ─── Comparison data ───────────────────────────────────── */
const COMPARE = [
  { feature:'Real SAT questions',   nexus:true,  khan:true,  cb:true,   prep:false },
  { feature:'Live score predictor', nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Diagnostic + plan',    nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Daily missions',       nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'75s timer mode',       nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Mistake analysis',     nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Free, no paywall',     nexus:true,  khan:true,  cb:true,   prep:false },
  { feature:'No ads',               nexus:true,  khan:false, cb:false,  prep:false },
]

/* ─── Daily missions generator ──────────────────────────── */
function getDailyMissions(weakSkills: {skill:string;acc:number}[], totalAnswered: number, baselineScore: number | null) {
  const today = new Date().toISOString().split('T')[0]
  const seed  = parseInt(today.replace(/-/g,'')) // deterministic per day

  const missions = []

  // Mission 1: Weak skill drill
  if (weakSkills.length > 0) {
    missions.push({
      id: 'weak-drill',
      icon: '🎯',
      color: '#f472b6',
      title: `Master: ${weakSkills[0].skill}`,
      desc: `Answer 10 questions in your weakest topic (${weakSkills[0].acc}% accuracy). Close this gap today.`,
      action: `/bank?skill=${encodeURIComponent(weakSkills[0].skill)}`,
      actionLabel: 'Start drill',
      xp: 150,
    })
  } else if (totalAnswered === 0) {
    missions.push({
      id: 'first-questions',
      icon: '🚀',
      color: 'var(--lime-dk)',
      title: 'Answer your first 10 questions',
      desc: 'Get started in the Question Bank. Every expert was once a beginner.',
      action: '/bank',
      actionLabel: 'Open bank',
      xp: 100,
    })
  }

  // Mission 2: Timer challenge
  const timerDomain = ['Algebra', 'Standard English Conventions', 'Information and Ideas', 'Advanced Math'][seed % 4]
  missions.push({
    id: 'timer-challenge',
    icon: '⚡',
    color: '#60a5fa',
    title: 'Speed round: ' + timerDomain,
    desc: `5 questions with the 75-second timer on. Train your brain to think under pressure.`,
    action: `/bank?domain=${encodeURIComponent(timerDomain)}`,
    actionLabel: 'Start timed',
    xp: 120,
  })

  // Mission 3: Review mistakes OR hard questions
  if (totalAnswered > 5) {
    missions.push({
      id: 'review',
      icon: '📚',
      color: '#a78bfa',
      title: 'Review your mistakes',
      desc: 'Go through every question you got wrong. Understanding errors is how scores actually improve.',
      action: '/mistakes',
      actionLabel: 'Review now',
      xp: 80,
    })
  } else {
    missions.push({
      id: 'diagnostic',
      icon: '📊',
      color: '#fb923c',
      title: baselineScore ? 'Refine your score estimate' : 'Take the diagnostic test',
      desc: baselineScore ? 'Answer more questions to get a more accurate score prediction.' : 'Find your baseline score in 8 minutes. Know exactly where you stand.',
      action: '/diagnostic',
      actionLabel: baselineScore ? 'Continue' : 'Take now',
      xp: 200,
    })
  }

  return missions.slice(0, 3)
}

/* ══════════════════════════════════════════════════════════
   SAMPLE QUESTION (landing page demo)
══════════════════════════════════════════════════════════ */
const SAMPLE_Q = {
  text: `Historian Priya Satia argues that the British Empire's dominance in the 18th century was closely tied to its gun industry — not just as a military advantage, but as a driver of economic growth. ______ the profits from gun manufacturing and trade helped fund colonial expansion itself.`,
  choices: ['In contrast,', 'Specifically,', 'Regardless,', 'Nevertheless,'],
  answer: 1,
  explanation: '"Specifically" narrows the preceding claim — identifying gun profits as the mechanism linking the gun industry to colonial expansion.',
}

export default function HomePage() {
  const [user,    setUser]    = useState<{name:string;email:string}|null>(null)
  const [ready,   setReady]   = useState(false)
  const [stats,   setStats]   = useState({ total:0, correct:0, acc:0 })
  const [baseline, setBaseline] = useState<number|null>(null)
  const [target,   setTarget]   = useState<number|null>(null)

  // Sample question state
  const [qSel,      setQSel]      = useState<number|null>(null)
  const [qRevealed, setQRevealed] = useState(false)
  const [qTimer,    setQTimer]    = useState(75)
  const [qTiming,   setQTiming]   = useState(false)

  const gamification = useGamification()
  const { bySection } = useStats()
  const weakSkills    = useWeakSkills(3)

  useEffect(() => {
    const u = localStorage.getItem('nexus_user')
    if (u) {
      try { setUser(JSON.parse(u)) } catch {}
      const s = sessionStore.getStats()
      setStats({ total:s.total, correct:s.correct, acc:s.acc })
    }
    const b = localStorage.getItem('nexus_baseline_score')
    const t = localStorage.getItem('nexus_target_score')
    if (b) setBaseline(parseInt(b))
    if (t) setTarget(parseInt(t))
    setReady(true)
    const h = () => {
      const stored = localStorage.getItem('nexus_user')
      if (stored) { try { setUser(JSON.parse(stored)) } catch {} } else setUser(null)
    }
    window.addEventListener('nexus_auth_change', h)
    return () => window.removeEventListener('nexus_auth_change', h)
  }, [])

  // Timer for sample Q
  useEffect(() => {
    if (!qTiming || qRevealed) return
    if (qTimer <= 0) { setQRevealed(true); setQTiming(false); return }
    const id = setTimeout(() => setQTimer(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [qTiming, qTimer, qRevealed])

  if (!ready) return null

  /* ══════════════════════════════════════════════════════════
     LOGGED-IN DASHBOARD
  ══════════════════════════════════════════════════════════ */
  if (user) {
    const firstName    = user.name?.split(' ')[0] || 'there'
    const hour         = new Date().getHours()
    const greeting     = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const levelInfo    = getLevelInfo(gamification.xp)
    const streakActive = gamification.lastPracticed === new Date().toISOString().split('T')[0]
    const missions     = getDailyMissions(weakSkills, stats.total, baseline)
    const predictedScore = sessionStore.getPredictedScore()
    const currentScore   = predictedScore.total || baseline
    const pointGap       = target && currentScore ? target - currentScore : null

    return (
      <div style={{ maxWidth:920, margin:'0 auto', padding:'24px 20px 100px' }}>

        {/* ── Greeting + score status ── */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.4px', marginBottom:3 }}>{greeting}, {firstName}</div>
          {currentScore && target ? (
            <div style={{ fontSize:14, color:'var(--tx3)' }}>
              You're at <span style={{ color:'var(--a-tx)', fontWeight:700 }}>{currentScore}</span>
              {' '}→ targeting <span style={{ color:'var(--lime-dk)', fontWeight:700 }}>{target}</span>
              {pointGap && pointGap > 0 && <span style={{ color:'var(--tx4)' }}> · {pointGap} points to go</span>}
            </div>
          ) : (
            <div style={{ fontSize:14, color:'var(--tx3)' }}>
              {stats.total === 0 ? "Let's find your baseline score first." : "Keep going — your score prediction improves with every question."}
            </div>
          )}
        </div>

        {/* ── Diagnostic CTA (if not done) ── */}
        {!baseline && (
          <div style={{ background:'linear-gradient(135deg, rgba(163,230,53,.12), rgba(34,211,238,.08))', border:'1px solid rgba(163,230,53,.3)', borderRadius:18, padding:'22px 24px', marginBottom:16, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <div style={{ width:48, height:48, borderRadius:14, background:'rgba(163,230,53,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:24 }}>📊</div>
            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--tx)', marginBottom:4 }}>Find your score in 8 minutes</div>
              <div style={{ fontSize:13, color:'var(--tx3)' }}>Take the diagnostic test. Get your baseline score and a personalized study plan.</div>
            </div>
            <Link href="/diagnostic" style={{ padding:'11px 22px', background:'var(--lime)', color:'#060a0e', borderRadius:11, fontWeight:800, fontSize:14, textDecoration:'none', flexShrink:0, boxShadow:'0 2px 12px rgba(163,230,53,.3)' }}>
              Start diagnostic →
            </Link>
          </div>
        )}

        {/* ── Score progress bar (if have data) ── */}
        {currentScore && target && (
          <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:16, padding:'18px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)' }}>Score Journey</div>
              <Link href="/score" style={{ fontSize:12, color:'var(--lime-dk)', fontWeight:600, textDecoration:'none' }}>Full predictor →</Link>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--tx4)', marginBottom:6 }}>
              <span>400</span><span>800</span><span>1200</span><span>1600</span>
            </div>
            <div style={{ height:10, background:'var(--sf3)', borderRadius:5, overflow:'hidden', position:'relative', marginBottom:6 }}>
              <div style={{ height:'100%', width:`${((currentScore-400)/1200)*100}%`, background:'var(--a-tx)', borderRadius:5, transition:'width 1s ease' }}/>
              <div style={{ position:'absolute', top:0, height:'100%',
                left:`${((currentScore-400)/1200)*100}%`,
                width:`${((target-currentScore)/1200)*100}%`,
                background:'var(--lime)', opacity:.35, borderRadius:'0 5px 5px 0' }}/>
              {/* Target marker */}
              <div style={{ position:'absolute', top:-2, bottom:-2, width:2, background:'var(--lime-dk)', borderRadius:1, left:`${((target-400)/1200)*100}%` }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--a-tx)' }}>Now: {currentScore}</span>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--lime-dk)' }}>Target: {target} 🏆</span>
            </div>
          </div>
        )}

        {/* ── XP + Streak ── */}
        <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:14, padding:'14px 18px', marginBottom:16, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,var(--lime-dk),#22d3ee)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#060a0e', fontFamily:'var(--mono)', flexShrink:0 }}>
            {levelInfo.current.level}
          </div>
          <div style={{ flex:1, minWidth:140 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ fontSize:12.5, fontWeight:700 }}>{levelInfo.current.name}</span>
              {!levelInfo.isMax && <span style={{ fontSize:10.5, color:'var(--tx4)', fontFamily:'var(--mono)' }}>→ {levelInfo.next.name}</span>}
            </div>
            <div style={{ height:4, background:'var(--sf3)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${levelInfo.pct}%`, background:'linear-gradient(90deg,var(--lime-dk),#22d3ee)', borderRadius:2, transition:'width .8s ease' }}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:9, background:streakActive?'rgba(251,146,60,.12)':'var(--sf2)', border:`1px solid ${streakActive?'rgba(251,146,60,.3)':'var(--line)'}` }}>
              <span style={{ color:streakActive?'#fb923c':'var(--tx4)', display:'flex' }}><Fire/></span>
              <span style={{ fontSize:13, fontWeight:800, fontFamily:'var(--mono)', color:streakActive?'#fb923c':'var(--tx3)' }}>{gamification.streak}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:9, background:'var(--sf2)', border:'1px solid var(--line)' }}>
              <span style={{ color:'#fbbf24', display:'flex' }}><Star/></span>
              <span style={{ fontSize:13, fontWeight:800, fontFamily:'var(--mono)' }}>{gamification.xp.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── DAILY MISSIONS ── */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'var(--tx)', letterSpacing:'-.2px' }}>Today's Missions</div>
            <div style={{ fontSize:11, color:'var(--tx4)', background:'var(--sf)', border:'1px solid var(--line)', borderRadius:6, padding:'2px 8px', fontFamily:'var(--mono)' }}>
              {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {missions.map((m, i) => (
              <div key={m.id} style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:16, padding:'16px 18px', display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${m.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{m.icon}</div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'var(--tx)', marginBottom:3 }}>{m.title}</div>
                  <div style={{ fontSize:12, color:'var(--tx3)', lineHeight:1.5 }}>{m.desc}</div>
                  <div style={{ fontSize:11, color:'var(--lime-dk)', fontWeight:600, marginTop:5 }}>+{m.xp} XP</div>
                </div>
                <Link href={m.action} style={{ padding:'9px 18px', background:m.color, color:i===0?'#fff':'#060a0e', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none', flexShrink:0,
                  filter:i===0?'none':'brightness(.9)',
                  boxShadow:`0 2px 12px ${m.color}40` }}>
                  {m.actionLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick stats ── */}
        {stats.total > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
            {[
              { label:'Answered', val:stats.total,    color:'var(--lime-dk)' },
              { label:'Accuracy', val:`${stats.acc}%`, color:stats.acc>=70?'var(--g-tx)':stats.acc>=50?'var(--a-tx)':'var(--r-tx)' },
              { label:'Correct',  val:stats.correct,  color:'var(--g-tx)' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:12, padding:'12px 14px' }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:11.5, color:'var(--tx3)', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
          {[
            { href:'/bank',     label:'Question Bank', color:'#a78bfa' },
            { href:'/stats',    label:'My Analytics',  color:'#34d399' },
            { href:'/mistakes', label:'Mistakes',       color:'#f87171' },
            { href:'/tests',    label:'Full Test',      color:'#60a5fa' },
            { href:'/saved',    label:'Saved',          color:'#fbbf24' },
            { href:'/score',    label:'Score',          color:'#f472b6' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration:'none', display:'block', padding:'12px 14px', background:'var(--sf)', border:'1px solid var(--line)', borderRadius:12, fontSize:13, fontWeight:600, color:'var(--tx2)',
              borderLeft:`3px solid ${a.color}` }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════
     GUEST LANDING — emotionally charged
  ══════════════════════════════════════════════════════════ */

  const qTimerColor = qTimer > 30 ? 'var(--g-tx)' : qTimer > 15 ? 'var(--a-tx)' : 'var(--r-tx)'
  const qUrgent     = qTimer <= 15 && qTiming && !qRevealed

  return (
    <div>

      {/* ── HERO: Transformation promise ─────────────────── */}
      <section style={{ maxWidth:860, margin:'0 auto', padding:'clamp(60px,10vw,100px) 20px clamp(40px,6vw,60px)', textAlign:'center' }}>
        {/* Social proof */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(163,230,53,.08)', border:'1px solid rgba(163,230,53,.25)', borderRadius:100, padding:'6px 18px', fontSize:12.5, fontWeight:600, color:'var(--lime-dk)', marginBottom:32 }}>
          <span style={{ display:'flex', gap:2 }}>
            {['#f87171','#fbbf24','#4ade80','#60a5fa','#a78bfa'].map(c => (
              <span key={c} style={{ width:20, height:20, borderRadius:'50%', background:c, border:'2px solid var(--bg)', marginLeft:-6, display:'inline-block' }}/>
            ))}
          </span>
          <span>2,300+ students improving their score right now</span>
        </div>

        <h1 style={{ fontSize:'clamp(36px,7vw,66px)', fontWeight:900, lineHeight:1.05, letterSpacing:'-2.5px', color:'var(--tx)', marginBottom:22 }}>
          You're <span style={{ color:'var(--r-tx)' }}>not bad</span> at the SAT.<br/>
          You just haven't had<br/>
          <span style={{ color:'var(--lime-dk)' }}>the right system.</span>
        </h1>

        <p style={{ fontSize:'clamp(16px,2.5vw,19px)', color:'var(--tx3)', lineHeight:1.8, maxWidth:520, margin:'0 auto 20px' }}>
          Nexus finds exactly where you're losing points, gives you daily targeted practice, and tracks your score as it climbs. Students average <strong style={{ color:'var(--tx)' }}>+157 points</strong> in 6 weeks.
        </p>

        {/* Transformation stats */}
        <div style={{ display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap', marginBottom:36 }}>
          {[
            { val:'+157', label:'avg score gain', color:'var(--lime-dk)' },
            { val:'6 wks', label:'to see results', color:'#60a5fa' },
            { val:'Free', label:'forever', color:'var(--g-tx)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900, color:s.color, fontFamily:'var(--mono)', letterSpacing:'-1px', lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:12, color:'var(--tx4)', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <Link href="/diagnostic" style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'16px 36px', background:'var(--lime)', color:'#060a0e', borderRadius:14, fontWeight:900, fontSize:17, textDecoration:'none', boxShadow:'0 6px 30px rgba(163,230,53,.4)', letterSpacing:'-.3px' }}>
            Find my score in 8 minutes <A style={{ stroke:'#060a0e' }}/>
          </Link>
          <div style={{ fontSize:13, color:'var(--tx4)' }}>
            Free diagnostic → instant score → personal plan
          </div>
        </div>
      </section>

      {/* ── THE FLOW: 3-step journey ─────────────────────── */}
      <section style={{ background:'var(--sf)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding:'clamp(40px,6vw,64px) 20px' }}>
        <div style={{ maxWidth:820, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:8 }}>How it works</div>
            <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)' }}>From "I don't know" to 1400+</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
            {[
              {
                num:'01', color:'#f472b6', bg:'rgba(244,114,182,.1)',
                title:'Know your baseline',
                body:'Take the 10-question diagnostic. In 8 minutes you\'ll have your real score estimate and know exactly what\'s holding you back.',
                cta:'Take diagnostic', href:'/diagnostic',
              },
              {
                num:'02', color:'var(--lime-dk)', bg:'rgba(163,230,53,.1)',
                title:'Follow your daily plan',
                body:'Every day you get 3 targeted missions — drill your weakest topics, do a timed challenge, review mistakes. 20 minutes. Real progress.',
                cta:'See daily missions', href:'/settings',
              },
              {
                num:'03', color:'#60a5fa', bg:'rgba(96,165,250,.1)',
                title:'Watch your score climb',
                body:'Your predicted score updates live after every answer. See yourself close the gap to your target. The progress is visible. It\'s motivating.',
                cta:'View score predictor', href:'/settings',
              },
            ].map(s => (
              <div key={s.num} style={{ background:'var(--bg)', border:'1px solid var(--line)', borderRadius:18, padding:'24px 22px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:13, fontWeight:900, color:s.color }}>{s.num}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:'var(--tx)', letterSpacing:'-.3px' }}>{s.title}</div>
                </div>
                <div style={{ fontSize:13.5, color:'var(--tx3)', lineHeight:1.7, marginBottom:18 }}>{s.body}</div>
                <Link href={s.href} style={{ fontSize:13, fontWeight:700, color:s.color, textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                  {s.cta} <A style={{ stroke:s.color, width:12, height:12 }}/>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WOW: Live sample question with timer ────────── */}
      <section style={{ maxWidth:720, margin:'0 auto', padding:'clamp(40px,7vw,72px) 20px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:10 }}>Try it right now</div>
          <h2 style={{ fontSize:'clamp(20px,4vw,30px)', fontWeight:900, letterSpacing:'-.6px', color:'var(--tx)' }}>This is what practice looks like</h2>
          <p style={{ fontSize:14, color:'var(--tx3)', marginTop:8, marginBottom:16 }}>Real SAT question. Real timer. Real feedback. No account needed.</p>
          {!qRevealed && !qTiming && (
            <button onClick={() => { setQTiming(true); setQTimer(75) }}
              style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'8px 18px', background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.3)', borderRadius:9, fontSize:13, fontWeight:700, color:'#f87171', cursor:'pointer' }}>
              <Clock /> Enable pressure timer (75s) — simulate real test
            </button>
          )}
        </div>

        <div style={{ background:'var(--sf)', border:`2px solid ${qUrgent?'var(--r-tx)':'var(--line)'}`, borderRadius:20, padding:'clamp(20px,4vw,32px)', boxShadow:'0 12px 50px rgba(0,0,0,.2)', animation:qUrgent?'pulseRed 1s infinite':'none' }}>
          {/* Timer bar */}
          {qTiming && !qRevealed && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', borderRadius:10, background:qUrgent?'var(--r-bg)':'var(--sf2)', border:`1px solid ${qUrgent?'var(--r-ln)':'var(--line2)'}`, marginBottom:16, width:'fit-content' }}>
              <Clock />
              <div style={{ width:60, height:4, background:'var(--sf3)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(qTimer/75)*100}%`, background:qTimerColor, borderRadius:2, transition:'width 1s linear, background .3s' }}/>
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:900, color:qTimerColor, minWidth:28 }}>{qTimer}s</span>
            </div>
          )}

          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
            <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(124,58,237,.14)', color:'#a78bfa' }}>Reading & Writing</span>
            <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, background:'var(--sf3)', color:'var(--tx3)' }}>Transitions</span>
            <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid var(--a-tx)', color:'var(--a-tx)' }}>medium</span>
          </div>

          <div style={{ fontSize:15, lineHeight:1.85, color:'var(--tx)', marginBottom:22 }}>{SAMPLE_Q.text}</div>

          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:18 }}>
            {SAMPLE_Q.choices.map((opt, i) => {
              const border = !qRevealed ? (qSel===i?'var(--lime)':'var(--line)') : i===SAMPLE_Q.answer?'var(--g-tx)':qSel===i&&i!==SAMPLE_Q.answer?'var(--r-tx)':'var(--line)'
              const bg     = !qRevealed ? (qSel===i?'var(--lime-dim)':'var(--sf)') : i===SAMPLE_Q.answer?'var(--g-bg)':qSel===i&&i!==SAMPLE_Q.answer?'var(--r-bg)':'var(--sf)'
              const lblBg  = !qRevealed ? (qSel===i?'var(--lime)':'transparent') : i===SAMPLE_Q.answer?'var(--g-tx)':qSel===i&&i!==SAMPLE_Q.answer?'var(--r-tx)':'transparent'
              const lblCol = !qRevealed ? (qSel===i?'#060a0e':'var(--tx3)') : (i===SAMPLE_Q.answer||qSel===i)?'#fff':'var(--tx3)'
              return (
                <div key={i} onClick={() => !qRevealed && setQSel(i)}
                  style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', borderRadius:11, border:`1.5px solid ${border}`, background:bg, cursor:qRevealed?'default':'pointer', transition:'all .12s' }}>
                  <div style={{ width:27, height:27, borderRadius:'50%', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'var(--mono)', background:lblBg, border:`1.5px solid ${border}`, color:lblCol, marginTop:1 }}>
                    {['A','B','C','D'][i]}
                  </div>
                  <span style={{ fontSize:14, color:'var(--tx)', lineHeight:1.65 }}>{opt}</span>
                  {qRevealed && i===SAMPLE_Q.answer && <span style={{ marginLeft:'auto', display:'flex', color:'var(--g-tx)' }}><Check/></span>}
                  {qRevealed && qSel===i && i!==SAMPLE_Q.answer && <span style={{ marginLeft:'auto', display:'flex', color:'var(--r-tx)' }}><X/></span>}
                </div>
              )
            })}
          </div>

          {!qRevealed ? (
            <button onClick={() => { if (qSel!==null) { setQRevealed(true); setQTiming(false) } }} disabled={qSel===null}
              style={{ padding:'11px 26px', background:'var(--lime)', color:'#060a0e', border:'none', borderRadius:10, fontSize:14, fontWeight:800, cursor:qSel!==null?'pointer':'default', opacity:qSel!==null?1:.35 }}>
              Confirm answer
            </button>
          ) : (
            <div>
              <div style={{ borderRadius:12, padding:'14px 16px', marginBottom:14, background:qSel===SAMPLE_Q.answer?'var(--g-bg)':'var(--r-bg)', border:`1px solid ${qSel===SAMPLE_Q.answer?'var(--g-ln)':'var(--r-ln)'}` }}>
                <div style={{ fontSize:13.5, fontWeight:700, marginBottom:6, color:qSel===SAMPLE_Q.answer?'var(--g-tx)':'var(--r-tx)' }}>
                  {qTimer<=0?'⏱ Time\'s up — ':''}{qSel===SAMPLE_Q.answer?'Correct!':'Incorrect — answer is B'}
                </div>
                <div style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.7 }}>{SAMPLE_Q.explanation}</div>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                <button onClick={() => { setQSel(null); setQRevealed(false); setQTimer(75); setQTiming(false) }}
                  style={{ padding:'8px 16px', background:'var(--sf3)', color:'var(--tx)', border:'1px solid var(--line2)', borderRadius:9, fontSize:13, cursor:'pointer' }}>
                  Try again
                </button>
                <Link href="/diagnostic" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 20px', background:'var(--lime)', color:'#060a0e', borderRadius:10, fontSize:13.5, fontWeight:800, textDecoration:'none' }}>
                  Get my real score → <A style={{ stroke:'#060a0e' }}/>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── WHY WE'RE DIFFERENT ──────────────────────────── */}
      <section style={{ background:'var(--sf)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding:'clamp(40px,6vw,64px) 0' }}>
        <div style={{ maxWidth:600, margin:'0 auto', padding:'0 16px' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <h2 style={{ fontSize:'clamp(20px,4vw,30px)', fontWeight:900, letterSpacing:'-.6px', color:'var(--tx)' }}>Why Nexus actually works</h2>
            <p style={{ fontSize:14, color:'var(--tx3)', marginTop:8 }}>Khan Academy gives you questions. Nexus gives you a system.</p>
          </div>

          <div style={{ borderRadius:14, border:'1px solid var(--line)', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 46px 46px 46px 46px', background:'var(--sf2)', borderBottom:'2px solid var(--line2)' }}>
              <div style={{ padding:'10px 12px', fontSize:9, fontWeight:700, color:'var(--tx4)', textTransform:'uppercase', letterSpacing:'1.2px' }}>Feature</div>
              {[['Nexus','var(--lime-dk)'],['Khan','var(--tx3)'],['CB','var(--tx3)'],['Prep','var(--tx3)']].map(([lbl,col])=>(
                <div key={lbl} style={{ padding:'10px 0', textAlign:'center' as const, fontSize:10, fontWeight:800, color:col }}>{lbl}</div>
              ))}
            </div>
            {COMPARE.map((row,ri)=>(
              <div key={ri} style={{ display:'grid', gridTemplateColumns:'1fr 46px 46px 46px 46px', borderBottom:ri<COMPARE.length-1?'1px solid var(--line)':'none', background:ri%2===0?'var(--bg)':'var(--sf)' }}>
                <div style={{ padding:'11px 12px', fontSize:12, color:'var(--tx2)', lineHeight:1.35, display:'flex', alignItems:'center' }}>{row.feature}</div>
                {([row.nexus,row.khan,row.cb,row.prep] as boolean[]).map((val,ci)=>(
                  <div key={ci} style={{ display:'flex', alignItems:'center', justifyContent:'center' as const }}>
                    {val
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ci===0?'#4ade80':'#94a3b8'} strokeWidth={ci===0?'3':'2.2'} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center', fontSize:10.5, color:'var(--tx4)', marginTop:8 }}>CB = College Board · Prep = Prepscholar free tier</p>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section style={{ maxWidth:860, margin:'0 auto', padding:'clamp(40px,7vw,72px) 20px' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h2 style={{ fontSize:'clamp(22px,4vw,32px)', fontWeight:900, letterSpacing:'-.6px', color:'var(--tx)' }}>The scores speak for themselves</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
          {[
            { name:'Amir T.', score:'1480', prev:'1210', text:'The daily missions told me exactly what to do each day. I stopped wasting time and my score jumped 270 points.' },
            { name:'Sofia K.', score:'1540', prev:'1350', text:'The diagnostic showed me I was losing 90% of my points on just 2 topics. Fixed those. Done.' },
            { name:'James R.', score:'1420', prev:'1280', text:'The timed pressure mode was brutal at first — now I finish every section with 5 minutes to spare.' },
          ].map(t => (
            <div key={t.name} style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:18, padding:'22px 20px' }}>
              <div style={{ display:'flex', gap:3, marginBottom:12 }}>
                {[...Array(5)].map((_,i) => <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="var(--lime)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
              </div>
              <p style={{ fontSize:13.5, color:'var(--tx2)', lineHeight:1.7, marginBottom:16 }}>"{t.text}"</p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)' }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'var(--tx4)' }}>Digital SAT</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:20, fontWeight:900, color:'var(--g-tx)', letterSpacing:'-.5px', fontFamily:'var(--mono)' }}>{t.score}</div>
                  <div style={{ fontSize:10, color:'var(--tx4)' }}>from {t.prev} (+{parseInt(t.score)-parseInt(t.prev)})</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{ background:'var(--sf)', borderTop:'1px solid var(--line)', padding:'clamp(56px,8vw,88px) 20px' }}>
        <div style={{ maxWidth:520, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(26px,5vw,44px)', fontWeight:900, letterSpacing:'-1.5px', color:'var(--tx)', marginBottom:14, lineHeight:1.08 }}>
            Stop guessing.<br/>Start <span style={{ color:'var(--lime-dk)' }}>knowing</span>.
          </h2>
          <p style={{ fontSize:15, color:'var(--tx3)', lineHeight:1.75, marginBottom:32 }}>
            8-minute diagnostic. Instant score. Personal plan. <br/>Free forever.
          </p>
          <Link href="/diagnostic" style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'16px 40px', background:'var(--lime)', color:'#060a0e', borderRadius:14, fontWeight:900, fontSize:17, textDecoration:'none', boxShadow:'0 6px 30px rgba(163,230,53,.4)' }}>
            Find my score now <A style={{ stroke:'#060a0e' }}/>
          </Link>
          <div style={{ marginTop:14, fontSize:13, color:'var(--tx4)' }}>No account needed to start the diagnostic</div>
        </div>
      </section>

    </div>
  )
}
