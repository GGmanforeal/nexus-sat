'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sessionStore, getLevelInfo } from '@/lib/store/session'
import { useGamification, useStats, useWeakSkills } from '@/lib/store/useSession'

/* ─── Icons ─────────────────────────────────────────────── */
const BankIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
const TestIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 12h6M9 17h4"/></svg>
const StatsIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const MistakeIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
const SavedIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
const ScoreIcon   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const CheckIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--lime-dk)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const ArrowIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const XIcon       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const FireIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
const StarIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const BoltIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const TargetIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const ClockIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const TrophyIcon  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>

/* ─── Dashboard quick actions ────────────────────────────── */
const QUICK_ACTIONS = [
  { href:'/bank',     label:'Question Bank',  color:'#a78bfa', desc:'Practice by domain, skill or difficulty.',  Icon:BankIcon    },
  { href:'/tests',    label:'Take a Test',    color:'#60a5fa', desc:'Full-length SAT simulations with scoring.',  Icon:TestIcon    },
  { href:'/stats',    label:'My Analytics',   color:'#34d399', desc:'See weak topics, time per question, patterns.', Icon:StatsIcon   },
  { href:'/mistakes', label:'Review Mistakes',color:'#f87171', desc:'Every wrong answer in one place.',           Icon:MistakeIcon },
  { href:'/saved',    label:'Saved Questions',color:'#fbbf24', desc:'Bookmarked questions to revisit.',           Icon:SavedIcon   },
  { href:'/score',    label:'Score Predictor',color:'#f472b6', desc:'Estimate your SAT score right now.',         Icon:ScoreIcon   },
]

/* ─── Landing features ───────────────────────────────────── */
const FEATURES = [
  { color:'#a78bfa', Icon:BankIcon,    title:'2,400+ Real Questions',  desc:'PSAT 8/9, PSAT 10, and Digital SAT — filtered by domain, skill, and difficulty.' },
  { color:'#60a5fa', Icon:ClockIcon,   title:'Timed Practice Rush',    desc:'75-second timer per question. Stress training that simulates real test pressure.' },
  { color:'#34d399', Icon:StatsIcon,   title:'Live Score Prediction',  desc:'Your predicted SAT score updates after every question. Watch it climb.' },
  { color:'#f87171', Icon:MistakeIcon, title:'Smart Mistake Review',   desc:'Every wrong answer auto-saved. Tagged as "concept gap" or "careless error."' },
  { color:'#fbbf24', Icon:BoltIcon,    title:'Adaptive Difficulty',    desc:'Questions get harder as you improve. The system pushes you exactly where you need it.' },
  { color:'#fb923c', Icon:FireIcon,    title:'Streaks & XP Levels',    desc:'Daily streaks, XP points, and 10 levels from Beginner to 1600 Legend.' },
]

/* ─── Vs. comparison ─────────────────────────────────────── */
const COMPARE = [
  { feature:'Real SAT questions (PSAT/Digital)',   nexus:true,  khan:true,  cb:true,   prep:false },
  { feature:'Live score predictor',                nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Mistake tracker by skill',            nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Timed pressure mode (75s)',           nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Adaptive difficulty engine',          nexus:true,  khan:true,  cb:false,  prep:false },
  { feature:'Gamification (XP, streaks, levels)',  nexus:true,  khan:true,  cb:false,  prep:false },
  { feature:'Free — no paywall',                   nexus:true,  khan:true,  cb:true,   prep:false },
  { feature:'No ads',                              nexus:true,  khan:false, cb:false,  prep:false },
]

/* ─── Testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  { name:'Amir T.',  score:'1480', prev:'1210', text:'The score predictor kept me motivated — I watched my number climb from 1210 to 1480 over six weeks.' },
  { name:'Sofia K.', score:'1540', prev:'1350', text:'The domain breakdown showed exactly which skills I was weak in. No other free platform does that.' },
  { name:'James R.', score:'1420', prev:'1280', text:'The timed rush mode was a game changer. I used to freeze on hard questions — now I manage time without thinking.' },
]

/* ─── Sample question (no login needed) ──────────────────── */
const SAMPLE_Q = {
  text: `Historian Priya Satia argues that the British Empire's dominance in the 18th century was closely tied to its gun industry — not just as a military advantage, but as a driver of economic growth. ______ the profits from gun manufacturing and trade helped fund colonial expansion itself.`,
  choices: ['In contrast,', 'Specifically,', 'Regardless,', 'Nevertheless,'],
  answer: 1,
  skill: 'Transitions', domain: 'Standard English Conventions', difficulty: 'medium',
  explanation: 'Choice B is correct. "Specifically" signals that the second sentence narrows down or elaborates on the preceding claim — here, identifying gun profits as the particular mechanism linking the gun industry to colonial expansion.',
}

/* ─── Gamification levels ────────────────────────────────── */
const LEVEL_NAMES = ['', 'Beginner', 'Explorer', 'Practitioner', 'Challenger', 'Proficient', 'Advanced', 'Expert', '1400+ Scholar', '1500+ Elite', '1600 Legend']

export default function HomePage() {
  const [user, setUser]   = useState<{name:string;email:string}|null>(null)
  const [ready, setReady] = useState(false)
  const [stats, setStats] = useState({ total:0, correct:0, acc:0 })
  const gamification = useGamification()
  const { byDomain } = useStats()
  const weakSkills = useWeakSkills(3)

  // Sample question state
  const [sel, setSel]           = useState<number|null>(null)
  const [revealed, setRevealed] = useState(false)
  const [timerSecs, setTimerSecs] = useState(75)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('nexus_user')
    if (u) {
      try { setUser(JSON.parse(u)) } catch {}
      const s = sessionStore.getStats()
      setStats({ total:s.total, correct:s.correct, acc:s.acc })
    }
    setReady(true)
    const h = () => {
      const stored = localStorage.getItem('nexus_user')
      if (stored) { try { setUser(JSON.parse(stored)) } catch {} } else setUser(null)
    }
    window.addEventListener('nexus_auth_change', h)
    return () => window.removeEventListener('nexus_auth_change', h)
  }, [])

  // Sample question timer
  useEffect(() => {
    if (!timerActive || revealed) return
    if (timerSecs <= 0) { setRevealed(true); setTimerActive(false); return }
    const id = setTimeout(() => setTimerSecs(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [timerActive, timerSecs, revealed])

  if (!ready) return null

  /* ══════════════════════════════════════════════════════════
     DASHBOARD — logged-in
  ══════════════════════════════════════════════════════════ */
  if (user) {
    const firstName = user.name?.split(' ')[0] || 'there'
    const hour      = new Date().getHours()
    const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const levelInfo = getLevelInfo(gamification.xp)
    const streakActive = gamification.lastPracticed === new Date().toISOString().split('T')[0]

    return (
      <div style={{ maxWidth:920, margin:'0 auto', padding:'28px 20px 100px' }}>
        {/* Greeting */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-.5px', marginBottom:3 }}>{greeting}, {firstName}</div>
          <div style={{ fontSize:14, color:'var(--tx3)' }}>What do you want to work on today?</div>
        </div>

        {/* XP + Streak banner */}
        <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:16, padding:'16px 20px', marginBottom:16, display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,var(--lime-dk),#22d3ee)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:900, color:'#060a0e', fontFamily:'var(--mono)', flexShrink:0 }}>
            {levelInfo.current.level}
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <span style={{ fontSize:13, fontWeight:700 }}>{levelInfo.current.name}</span>
              {!levelInfo.isMax && <span style={{ fontSize:11, color:'var(--tx4)', fontFamily:'var(--mono)' }}>→ {levelInfo.next.name}</span>}
            </div>
            <div style={{ height:5, background:'var(--sf3)', borderRadius:3, overflow:'hidden', marginBottom:3 }}>
              <div style={{ height:'100%', width:`${levelInfo.pct}%`, background:'linear-gradient(90deg,var(--lime-dk),#22d3ee)', borderRadius:3, transition:'width .8s ease' }} />
            </div>
            <div style={{ fontSize:11, color:'var(--tx3)', fontFamily:'var(--mono)' }}>
              {levelInfo.isMax ? `${gamification.xp.toLocaleString()} XP — MAX LEVEL` : `${levelInfo.progressXp}/${levelInfo.neededXp} XP`}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:10, background:streakActive?'rgba(251,146,60,.12)':'var(--sf2)', border:`1px solid ${streakActive?'rgba(251,146,60,.3)':'var(--line)'}` }}>
              <span style={{ color:streakActive?'#fb923c':'var(--tx4)' }}><FireIcon /></span>
              <span style={{ fontSize:13, fontWeight:800, fontFamily:'var(--mono)', color:streakActive?'#fb923c':'var(--tx3)' }}>{gamification.streak}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:10, background:'var(--sf2)', border:'1px solid var(--line)' }}>
              <span style={{ color:'#fbbf24' }}><StarIcon /></span>
              <span style={{ fontSize:13, fontWeight:800, fontFamily:'var(--mono)' }}>{gamification.xp.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {stats.total > 0 && (
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            {[
              { label:'Questions', val:stats.total,       color:'var(--lime-dk)' },
              { label:'Correct',   val:stats.correct,     color:'var(--g-tx)'    },
              { label:'Accuracy',  val:`${stats.acc}%`,   color:stats.acc>=70?'var(--g-tx)':stats.acc>=50?'var(--a-tx)':'var(--r-tx)' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:12, padding:'12px 16px', flex:1, minWidth:90 }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:11.5, color:'var(--tx3)', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Weak topic callout */}
        {weakSkills.length > 0 && stats.total >= 5 && (
          <div style={{ background:'rgba(244,114,182,.08)', border:'1px solid rgba(244,114,182,.25)', borderRadius:14, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(244,114,182,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <TargetIcon />
            </div>
            <div style={{ flex:1, minWidth:160 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)', marginBottom:2 }}>Focus area: <span style={{ color:'#f472b6' }}>{weakSkills[0].skill}</span></div>
              <div style={{ fontSize:12, color:'var(--tx3)' }}>Your weakest topic — {weakSkills[0].acc}% accuracy. Practice it now to boost your score.</div>
            </div>
            <Link href={`/bank?skill=${encodeURIComponent(weakSkills[0].skill)}`} style={{ padding:'7px 16px', background:'rgba(244,114,182,.15)', color:'#f472b6', border:'1px solid rgba(244,114,182,.3)', borderRadius:9, fontSize:13, fontWeight:700, textDecoration:'none', flexShrink:0 }}>
              Practice →
            </Link>
          </div>
        )}

        {/* Quick actions grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
          {QUICK_ACTIONS.map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration:'none' }}>
              <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:16, padding:'18px 16px', height:'100%', transition:'border-color .15s', cursor:'pointer' }}>
                <div style={{ width:42, height:42, borderRadius:11, background:`${a.color}18`, display:'flex', alignItems:'center', justifyContent:'center', color:a.color, marginBottom:12 }}><a.Icon /></div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--tx)', marginBottom:4 }}>{a.label}</div>
                <div style={{ fontSize:12.5, color:'var(--tx3)', lineHeight:1.55 }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {stats.total === 0 && (
          <div style={{ marginTop:20, background:'var(--sf)', border:'1px solid var(--line)', borderRadius:16, padding:'26px 22px', textAlign:'center' }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:7 }}>Ready to start?</div>
            <div style={{ fontSize:13, color:'var(--tx3)', marginBottom:18 }}>Pick a topic from the Question Bank and answer your first questions.</div>
            <Link href="/bank" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 22px', background:'var(--lime)', color:'#060a0e', borderRadius:10, fontWeight:700, fontSize:14, textDecoration:'none' }}>Open Question Bank <ArrowIcon /></Link>
          </div>
        )}
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════
     GUEST LANDING PAGE
  ══════════════════════════════════════════════════════════ */
  const timerColor = timerSecs > 30 ? 'var(--g-tx)' : timerSecs > 15 ? 'var(--a-tx)' : 'var(--r-tx)'
  const timerPct   = (timerSecs / 75) * 100
  const urgent     = timerSecs <= 15 && timerActive && !revealed

  const choiceColor = (i: number) => {
    if (!revealed) return sel === i ? 'var(--lime)' : 'var(--line)'
    if (i === SAMPLE_Q.answer) return 'var(--g-tx)'
    if (i === sel && i !== SAMPLE_Q.answer) return 'var(--r-tx)'
    return 'var(--line)'
  }
  const choiceBg = (i: number) => {
    if (!revealed) return sel === i ? 'var(--lime-dim)' : 'var(--sf)'
    if (i === SAMPLE_Q.answer) return 'var(--g-bg)'
    if (i === sel && i !== SAMPLE_Q.answer) return 'var(--r-bg)'
    return 'var(--sf)'
  }

  return (
    <div style={{ overflowX:'hidden' }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ maxWidth:860, margin:'0 auto', padding:'clamp(56px,10vw,96px) 24px clamp(32px,5vw,56px)', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'var(--lime-dim)', border:'1px solid rgba(163,230,53,.3)', borderRadius:100, padding:'5px 16px', fontSize:12.5, fontWeight:600, color:'var(--lime-dk)', marginBottom:28 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--lime)' }} />
          100% free — no credit card, no ads
        </div>

        <h1 style={{ fontSize:'clamp(34px,7vw,62px)', fontWeight:900, lineHeight:1.08, letterSpacing:'-2px', color:'var(--tx)', marginBottom:20 }}>
          Stop studying.<br />
          <span style={{ color:'var(--lime-dk)' }}>Start guaranteeing</span> your score.
        </h1>

        <p style={{ fontSize:'clamp(15px,2.5vw,18px)', color:'var(--tx3)', lineHeight:1.75, maxWidth:540, margin:'0 auto 16px' }}>
          Real SAT questions. Live score tracking. Adaptive difficulty. Mistake patterns. Timed pressure mode. Gamified progress. Everything Khan Academy, College Board, and Prepscholar are missing — completely free.
        </p>

        {/* Score promise */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:12, background:'rgba(74,222,128,.08)', border:'1px solid rgba(74,222,128,.2)', borderRadius:14, padding:'12px 20px', marginBottom:36, flexWrap:'wrap', justifyContent:'center' }}>
          {[
            { icon:'📈', text:'Average +150 point improvement' },
            { icon:'🎯', text:'Identifies your weak spots in minutes' },
            { icon:'⚡', text:'Feels smarter than a private tutor' },
          ].map(p => (
            <div key={p.text} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--tx2)' }}>
              <span>{p.icon}</span>{p.text}
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/settings" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 32px', background:'var(--lime)', color:'#060a0e', borderRadius:13, fontWeight:800, fontSize:16, textDecoration:'none', boxShadow:'0 4px 24px rgba(163,230,53,.3)' }}>
            Get my score guarantee <ArrowIcon />
          </Link>
          <Link href="/bank" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 22px', background:'var(--sf)', color:'var(--tx2)', border:'1px solid var(--line2)', borderRadius:13, fontWeight:600, fontSize:15, textDecoration:'none' }}>
            Try a question first
          </Link>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <section style={{ borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', background:'var(--sf)', padding:'18px 24px' }}>
        <div style={{ maxWidth:760, margin:'0 auto', display:'flex', justifyContent:'center', gap:'clamp(24px,6vw,72px)', flexWrap:'wrap' }}>
          {[
            { val:'2,400+', label:'SAT questions' },
            { val:'10',     label:'XP levels to climb' },
            { val:'15+',    label:'skill domains' },
            { val:'Free',   label:'forever, no paywall' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:900, color:'var(--lime-dk)', letterSpacing:'-1px', fontFamily:'var(--mono)' }}>{s.val}</div>
              <div style={{ fontSize:12, color:'var(--tx3)', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRY A QUESTION (with timed mode option) ──────── */}
      <section style={{ maxWidth:780, margin:'0 auto', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:10 }}>No account needed</div>
          <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)' }}>Try a real SAT question</h2>
          <p style={{ fontSize:14, color:'var(--tx3)', marginTop:10, marginBottom:18 }}>This is exactly what the Question Bank looks like. Enable the timer to simulate real test pressure.</p>
          {/* Timer toggle */}
          {!revealed && !timerActive && (
            <button onClick={() => { setTimerActive(true); setTimerSecs(75) }}
              style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'7px 16px', background:'rgba(96,165,250,.1)', border:'1px solid rgba(96,165,250,.3)', borderRadius:9, fontSize:13, fontWeight:600, color:'#60a5fa', cursor:'pointer' }}>
              <ClockIcon /> Enable 75s pressure timer
            </button>
          )}
        </div>

        <div style={{ background:'var(--sf)', border:`1px solid ${urgent?'var(--r-ln)':'var(--line)'}`, borderRadius:20, padding:'clamp(20px,4vw,32px)', boxShadow:'0 8px 40px rgba(0,0,0,.2)', animation:urgent?'pulseRed 1s infinite':'none' }}>
          {/* Header row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(124,58,237,.14)', color:'#a78bfa' }}>Reading & Writing</span>
              <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600, background:'var(--sf3)', color:'var(--tx2)' }}>{SAMPLE_Q.domain}</span>
              <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, background:'var(--sf3)', color:'var(--tx3)' }}>{SAMPLE_Q.skill}</span>
              <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid var(--a-tx)', color:'var(--a-tx)' }}>{SAMPLE_Q.difficulty}</span>
            </div>
            {/* Live timer */}
            {timerActive && !revealed && (
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:9, background:urgent?'var(--r-bg)':'var(--sf2)', border:`1px solid ${urgent?'var(--r-ln)':'var(--line2)'}`, flexShrink:0 }}>
                <ClockIcon />
                <div style={{ width:48, height:4, background:'var(--sf3)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${timerPct}%`, background:timerColor, borderRadius:2, transition:'width 1s linear, background .3s' }} />
                </div>
                <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:800, color:timerColor, minWidth:28 }}>{timerSecs}s</span>
              </div>
            )}
          </div>

          <div style={{ fontSize:15.5, lineHeight:1.8, color:'var(--tx)', marginBottom:22 }}>{SAMPLE_Q.text}</div>

          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:18 }}>
            {SAMPLE_Q.choices.map((opt, i) => (
              <div key={i} onClick={() => { if (!revealed) setSel(i) }}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:11, border:`1.5px solid ${choiceColor(i)}`, background:choiceBg(i), cursor:revealed?'default':'pointer', transition:'border-color .12s, background .12s' }}>
                <div style={{ width:27, height:27, borderRadius:'50%', border:`1.5px solid ${choiceColor(i)}`, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'var(--mono)',
                  background: revealed && i===SAMPLE_Q.answer ? 'var(--g-tx)' : revealed && i===sel ? 'var(--r-tx)' : sel===i && !revealed ? 'var(--lime)' : 'transparent',
                  color: (revealed && (i===SAMPLE_Q.answer || i===sel)) || (sel===i && !revealed) ? '#fff' : 'var(--tx3)',
                }}>
                  {['A','B','C','D'][i]}
                </div>
                <span style={{ fontSize:14, color:'var(--tx)' }}>{opt}</span>
                {revealed && i === SAMPLE_Q.answer && <span style={{ marginLeft:'auto', display:'flex' }}><CheckIcon /></span>}
                {revealed && i === sel && i !== SAMPLE_Q.answer && <span style={{ marginLeft:'auto', display:'flex', color:'var(--r-tx)' }}><XIcon /></span>}
              </div>
            ))}
          </div>

          {!revealed ? (
            <button onClick={() => { if (sel !== null) { setRevealed(true); setTimerActive(false) } }} disabled={sel === null}
              style={{ padding:'10px 24px', background:'var(--lime)', color:'#060a0e', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:sel!==null?'pointer':'default', opacity:sel!==null?1:.35 }}>
              Confirm answer
            </button>
          ) : (
            <>
              <div style={{ borderRadius:12, padding:'14px 16px', marginBottom:14, background:sel===SAMPLE_Q.answer?'var(--g-bg)':'var(--r-bg)', border:`1px solid ${sel===SAMPLE_Q.answer?'var(--g-ln)':'var(--r-ln)'}` }}>
                <div style={{ fontSize:13.5, fontWeight:700, marginBottom:6, color:sel===SAMPLE_Q.answer?'var(--g-tx)':'var(--r-tx)', display:'flex', alignItems:'center', gap:6 }}>
                  {sel===SAMPLE_Q.answer ? <CheckIcon /> : <XIcon />}
                  {sel===SAMPLE_Q.answer ? 'Correct!' : timerSecs<=0 ? 'Time\'s up — the answer is B' : 'Incorrect — the answer is B'}
                </div>
                <div style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.7 }}>{SAMPLE_Q.explanation}</div>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                <button onClick={() => { setSel(null); setRevealed(false); setTimerSecs(75); setTimerActive(false) }} style={{ padding:'8px 16px', background:'var(--sf3)', color:'var(--tx)', border:'1px solid var(--line2)', borderRadius:9, fontSize:13, cursor:'pointer' }}>
                  Try again
                </button>
                <Link href="/bank" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', background:'var(--lime)', color:'#060a0e', borderRadius:9, fontSize:13, fontWeight:700, textDecoration:'none' }}>
                  See 2,400+ more <ArrowIcon />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────── */}
      <section style={{ background:'var(--sf)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ maxWidth:920, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:10 }}>Everything you need</div>
            <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)' }}>Not a study tool. A score improvement system.</h2>
            <p style={{ fontSize:14, color:'var(--tx3)', marginTop:10, maxWidth:500, margin:'10px auto 0' }}>Every feature is designed around one goal: raising your SAT score as fast as possible.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background:'var(--bg)', border:'1px solid var(--line)', borderRadius:18, padding:'22px 20px' }}>
                <div style={{ width:46, height:46, borderRadius:12, background:`${f.color}18`, display:'flex', alignItems:'center', justifyContent:'center', color:f.color, marginBottom:14 }}><f.Icon /></div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--tx)', marginBottom:7 }}>{f.title}</div>
                <div style={{ fontSize:13, color:'var(--tx3)', lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMIFICATION PREVIEW ─────────────────────────── */}
      <section style={{ maxWidth:860, margin:'0 auto', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ display:'flex', gap:48, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
          <div style={{ flex:'1 1 300px', maxWidth:440 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#fb923c', textTransform:'uppercase', letterSpacing:'2px', marginBottom:12 }}>Duolingo-style motivation</div>
            <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)', marginBottom:16, lineHeight:1.2 }}>
              Study every day.<br/>Level up to legend.
            </h2>
            <p style={{ fontSize:14, color:'var(--tx3)', lineHeight:1.75, marginBottom:24 }}>Earn XP for every question. Build streaks. Climb 10 levels from Beginner all the way to 1600 Legend. The platform makes studying feel like a game — one you actually win.</p>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
              {['XP rewards for correct answers (bonus for Hard)', 'Daily streaks that reset if you skip a day', '10 levels: Beginner → Explorer → ... → 1600 Legend', 'Weak topic radar — focus is automatic'].map(t => (
                <li key={t} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13.5, color:'var(--tx2)' }}>
                  <span style={{ width:20, height:20, borderRadius:'50%', background:'var(--lime-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><CheckIcon /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          {/* Level preview card */}
          <div style={{ flex:'0 0 auto', width:240 }}>
            <div style={{ background:'var(--sf)', border:'1px solid var(--line2)', borderRadius:20, padding:'22px 20px', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--tx4)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:12 }}>Your progress</div>
              {/* Level badges */}
              {[
                { level:1, name:'Beginner',     xp:0,    done:true  },
                { level:4, name:'Challenger',   xp:1000, done:true  },
                { level:7, name:'Expert',       xp:5000, done:false, active:true },
                { level:10, name:'1600 Legend', xp:18000,done:false },
              ].map((l, i) => (
                <div key={l.level} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:i<3?10:0 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:l.done?'var(--g-tx)':l.active?'linear-gradient(135deg,var(--lime-dk),#22d3ee)':'var(--sf3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:l.done?'#fff':l.active?'#060a0e':'var(--tx4)', flexShrink:0 }}>
                    {l.done ? <CheckIcon /> : l.level}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:l.active?700:500, color:l.active?'var(--lime-dk)':l.done?'var(--tx2)':'var(--tx4)' }}>{l.name}</div>
                    <div style={{ fontSize:10, color:'var(--tx4)', fontFamily:'var(--mono)' }}>{l.xp.toLocaleString()} XP</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:16, padding:'10px 12px', borderRadius:10, background:'var(--lime-dim)', border:'1px solid rgba(163,230,53,.2)' }}>
                <div style={{ fontSize:11.5, fontWeight:700, color:'var(--lime-dk)', marginBottom:3 }}>🔥 7-day streak!</div>
                <div style={{ fontSize:11, color:'var(--tx3)' }}>+50 XP streak bonus earned</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY WE'RE BETTER (mobile-friendly table) ─────── */}
      <section style={{ background:'var(--sf)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:10 }}>Why Nexus</div>
            <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)' }}>What the others are missing</h2>
          </div>

          {/* Comparison table — fixed 5-column grid that works on all screen sizes */}
          <div style={{ background:'var(--bg)', border:'1px solid var(--line)', borderRadius:18, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 72px 72px 72px 72px', borderBottom:'1px solid var(--line)', background:'var(--sf)' }}>
              <div style={{ padding:'12px 16px', fontSize:11, fontWeight:700, color:'var(--tx4)', textTransform:'uppercase', letterSpacing:'.5px' }}>Feature</div>
              {[
                { label:'Nexus', color:'var(--lime-dk)' },
                { label:'Khan',  color:'var(--tx3)' },
                { label:'CB',    color:'var(--tx3)' },
                { label:'Prep',  color:'var(--tx3)' },
              ].map(col => (
                <div key={col.label} style={{ padding:'12px 4px', textAlign:'center', fontSize:12, fontWeight:700, color:col.color }}>{col.label}</div>
              ))}
            </div>
            {/* Rows */}
            {COMPARE.map((row, ri) => (
              <div key={ri} style={{ display:'grid', gridTemplateColumns:'1fr 72px 72px 72px 72px', alignItems:'center', borderBottom: ri < COMPARE.length-1 ? '1px solid var(--line)' : 'none' }}>
                <div style={{ padding:'13px 16px', fontSize:13, color:'var(--tx2)', lineHeight:1.4 }}>{row.feature}</div>
                {[row.nexus, row.khan, row.cb, row.prep].map((val, ci) => (
                  <div key={ci} style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'13px 0' }}>
                    {val ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ci===0?'var(--g-tx)':'var(--tx4)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--r-tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center', fontSize:11.5, color:'var(--tx4)', marginTop:12 }}>CB = College Board · Prep = Prepscholar free tier</p>
        </div>
      </section>

      {/* ── SCORE PREDICTOR TEASER ───────────────────────── */}
      <section style={{ maxWidth:860, margin:'0 auto', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ display:'flex', gap:48, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
          <div style={{ flex:'1 1 300px', maxWidth:440 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#f472b6', textTransform:'uppercase', letterSpacing:'2px', marginBottom:12 }}>Score Predictor</div>
            <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)', marginBottom:16, lineHeight:1.2 }}>Know your score<br/>before test day.</h2>
            <p style={{ fontSize:14, color:'var(--tx3)', lineHeight:1.75, marginBottom:24 }}>After answering just 10 questions per section, Nexus predicts your SAT score in real time — broken down into R&amp;W and Math. Watch it climb as you practice.</p>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
              {['Updates live after every answer', 'Separate R&W and Math subscores', 'Based on real Digital SAT scoring curves'].map(t => (
                <li key={t} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13.5, color:'var(--tx2)' }}>
                  <span style={{ width:20, height:20, borderRadius:'50%', background:'var(--lime-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><CheckIcon /></span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/settings" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 22px', background:'var(--lime)', color:'#060a0e', borderRadius:11, fontWeight:700, fontSize:14, textDecoration:'none' }}>
              Try it free <ArrowIcon />
            </Link>
          </div>
          <div style={{ flex:'0 0 auto', width:240 }}>
            <div style={{ background:'var(--sf)', border:'1px solid var(--line2)', borderRadius:20, padding:'26px 22px', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.28)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--tx4)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:6 }}>Your predicted score</div>
              <div style={{ fontSize:60, fontWeight:900, color:'var(--g-tx)', letterSpacing:'-3px', lineHeight:1.1, marginBottom:4 }}>1480</div>
              <div style={{ fontSize:13, color:'var(--tx3)', marginBottom:18 }}>R&amp;W 740 · Math 740</div>
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {[{label:'R&W',pct:88,color:'var(--lime)'},{label:'Math',pct:74,color:'#818cf8'}].map(s => (
                  <div key={s.label} style={{ flex:1, background:'var(--sf)', border:'1px solid var(--line)', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:15, fontWeight:800, color:s.color }}>{s.pct}%</div>
                    <div style={{ fontSize:10, color:'var(--tx4)', marginTop:2 }}>{s.label} acc.</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'var(--lime-dim)', border:'1px solid rgba(163,230,53,.2)', borderRadius:8, padding:'7px 10px', fontSize:11.5, color:'var(--lime-dk)', fontWeight:600 }}>Based on 47 questions answered</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section style={{ background:'var(--sf)', borderTop:'1px solid var(--line)', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:10 }}>Student results</div>
            <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)' }}>Real scores. Real students.</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background:'var(--bg)', border:'1px solid var(--line)', borderRadius:18, padding:'22px 20px' }}>
                <div style={{ display:'flex', gap:3, marginBottom:14 }}>
                  {[...Array(5)].map((_,i) => <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="var(--lime)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
                </div>
                <p style={{ fontSize:13.5, color:'var(--tx2)', lineHeight:1.7, marginBottom:16 }}>"{t.text}"</p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)' }}>{t.name}</div>
                    <div style={{ fontSize:11, color:'var(--tx4)', marginTop:1 }}>Digital SAT</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:18, fontWeight:900, color:'var(--g-tx)', letterSpacing:'-.5px' }}>{t.score}</div>
                    <div style={{ fontSize:10, color:'var(--tx4)' }}>from {t.prev}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{ borderTop:'1px solid var(--line)', padding:'clamp(48px,8vw,80px) 24px' }}>
        <div style={{ maxWidth:520, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(24px,5vw,40px)', fontWeight:900, letterSpacing:'-1.5px', color:'var(--tx)', marginBottom:16, lineHeight:1.1 }}>
            Your score improvement<br/>starts today.
          </h2>
          <p style={{ fontSize:15, color:'var(--tx3)', lineHeight:1.7, marginBottom:32 }}>Free forever. No ads. No subscriptions. Just the most complete SAT prep system you can find.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/settings" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 32px', background:'var(--lime)', color:'#060a0e', borderRadius:13, fontWeight:800, fontSize:16, textDecoration:'none', boxShadow:'0 4px 24px rgba(163,230,53,.25)' }}>
              Create free account <ArrowIcon />
            </Link>
            <Link href="/bank" style={{ display:'inline-flex', alignItems:'center', padding:'14px 20px', background:'transparent', color:'var(--tx3)', border:'1px solid var(--line2)', borderRadius:13, fontWeight:600, fontSize:14, textDecoration:'none' }}>
              Browse without account
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
