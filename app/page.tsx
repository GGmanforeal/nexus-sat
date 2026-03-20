'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sessionStore } from '@/lib/store/session'

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

/* ─── Dashboard quick actions ────────────────────────────── */
const QUICK_ACTIONS = [
  { href:'/bank',     label:'Question Bank',  color:'#a78bfa', desc:'Practice by domain, skill or difficulty.',  Icon:BankIcon    },
  { href:'/tests',    label:'Take a Test',    color:'#60a5fa', desc:'Full-length SAT simulations with scoring.',  Icon:TestIcon    },
  { href:'/stats',    label:'My Stats',       color:'#34d399', desc:'Track accuracy across every domain.',        Icon:StatsIcon   },
  { href:'/mistakes', label:'Review Mistakes',color:'#f87171', desc:'Every wrong answer in one place.',           Icon:MistakeIcon },
  { href:'/saved',    label:'Saved Questions',color:'#fbbf24', desc:'Bookmarked questions to revisit.',           Icon:SavedIcon   },
  { href:'/score',    label:'Score Predictor',color:'#f472b6', desc:'Estimate your SAT score right now.',         Icon:ScoreIcon   },
]

/* ─── Landing features ───────────────────────────────────── */
const FEATURES = [
  { color:'#a78bfa', Icon:BankIcon,    title:'2,400+ Real Questions',  desc:'PSAT 8/9, PSAT 10, and Digital SAT — filtered by domain, skill, and difficulty.' },
  { color:'#60a5fa', Icon:TestIcon,    title:'Full-Length Timed Tests', desc:'Exact digital SAT format with auto-scoring and section breakdowns.' },
  { color:'#34d399', Icon:StatsIcon,   title:'Live Score Prediction',  desc:'Your predicted SAT score updates after every question. Watch it climb.' },
  { color:'#f87171', Icon:MistakeIcon, title:'Smart Mistake Review',   desc:'Every wrong answer auto-saved. Drill weak spots until they stick.' },
]

/* ─── Vs. comparison ─────────────────────────────────────── */
const COMPARE = [
  { feature:'Real SAT questions (PSAT/Digital)',   nexus:true,  khan:true,  cb:true,   prep:false },
  { feature:'Live score predictor',                nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Mistake tracker by skill',            nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Difficulty filter (Easy/Med/Hard)',   nexus:true,  khan:false, cb:false,  prep:false },
  { feature:'Free — no paywall',                   nexus:true,  khan:true,  cb:true,   prep:false },
  { feature:'No ads',                              nexus:true,  khan:false, cb:false,  prep:false },
]

/* ─── Testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  { name:'Amir T.',  score:'1480', prev:'1210', text:'The score predictor kept me motivated — I watched my number climb from 1210 to 1480 over six weeks.' },
  { name:'Sofia K.', score:'1540', prev:'1350', text:'The domain breakdown showed exactly which skills I was weak in. No other free platform does that.' },
  { name:'James R.', score:'1420', prev:'1280', text:'I used Nexus every day for a month. The question bank is huge and the mistake review is a game changer.' },
]

/* ─── Sample question (no login needed) ──────────────────── */
const SAMPLE_Q = {
  text: `Historian Priya Satia argues that the British Empire's dominance in the 18th century was closely tied to its gun industry — not just as a military advantage, but as a driver of economic growth. ______ the profits from gun manufacturing and trade helped fund colonial expansion itself.`,
  choices: ['In contrast,', 'Specifically,', 'Regardless,', 'Nevertheless,'],
  answer: 1, // B = index 1
  skill: 'Transitions',
  domain: 'Standard English Conventions',
  difficulty: 'medium',
  explanation: 'Choice B is correct. "Specifically" signals that the second sentence narrows down or elaborates on the preceding claim — here, identifying gun profits as the particular mechanism linking the gun industry to colonial expansion.',
}

export default function HomePage() {
  const [user, setUser]   = useState<{name:string;email:string}|null>(null)
  const [ready, setReady] = useState(false)
  const [stats, setStats] = useState({ total:0, correct:0, acc:0 })

  // Sample question state
  const [sel, setSel]           = useState<number|null>(null)
  const [revealed, setRevealed] = useState(false)

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

  if (!ready) return null

  /* ══════════════════════════════════════════════════════════
     DASHBOARD — logged-in
  ══════════════════════════════════════════════════════════ */
  if (user) {
    const firstName = user.name?.split(' ')[0] || 'there'
    const hour      = new Date().getHours()
    const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    return (
      <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 20px 100px' }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-.5px', marginBottom:4 }}>{greeting}, {firstName}</div>
          <div style={{ fontSize:14, color:'var(--tx3)' }}>What do you want to work on today?</div>
        </div>

        {stats.total > 0 && (
          <div style={{ display:'flex', gap:12, marginBottom:28, flexWrap:'wrap' }}>
            {[
              { label:'Questions answered', val:stats.total,      color:'var(--lime-dk)' },
              { label:'Correct answers',    val:stats.correct,    color:'var(--g-tx)'    },
              { label:'Accuracy',           val:`${stats.acc}%`,  color:stats.acc>=70?'var(--g-tx)':stats.acc>=50?'var(--a-tx)':'var(--r-tx)' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:12, padding:'14px 18px', flex:1, minWidth:120 }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:12, color:'var(--tx3)', marginTop:5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
          {QUICK_ACTIONS.map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration:'none' }}>
              <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:16, padding:'20px 18px', height:'100%' }}>
                <div style={{ width:46, height:46, borderRadius:12, background:`${a.color}18`, display:'flex', alignItems:'center', justifyContent:'center', color:a.color, marginBottom:14 }}><a.Icon /></div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--tx)', marginBottom:5 }}>{a.label}</div>
                <div style={{ fontSize:13, color:'var(--tx3)', lineHeight:1.6 }}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {stats.total === 0 && (
          <div style={{ marginTop:28, background:'var(--sf)', border:'1px solid var(--line)', borderRadius:16, padding:'28px 24px', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Ready to start?</div>
            <div style={{ fontSize:13.5, color:'var(--tx3)', marginBottom:20 }}>Pick a topic from the Question Bank and answer your first questions.</div>
            <Link href="/bank" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', background:'var(--lime)', color:'#060a0e', borderRadius:11, fontWeight:700, fontSize:14, textDecoration:'none' }}>Open Question Bank <ArrowIcon /></Link>
          </div>
        )}
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════
     GUEST LANDING PAGE
  ══════════════════════════════════════════════════════════ */

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
          The only SAT prep tool<br />
          <span style={{ color:'var(--lime-dk)' }}>built to beat the others.</span>
        </h1>

        <p style={{ fontSize:'clamp(15px,2.5vw,18px)', color:'var(--tx3)', lineHeight:1.75, maxWidth:520, margin:'0 auto 38px' }}>
          Real questions. Live score prediction. Skill-level mistake tracking. Everything Khan Academy, College Board, and Prepscholar are missing — free.
        </p>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/settings" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 32px', background:'var(--lime)', color:'#060a0e', borderRadius:13, fontWeight:800, fontSize:16, textDecoration:'none', boxShadow:'0 4px 24px rgba(163,230,53,.3)' }}>
            Start for free <ArrowIcon />
          </Link>
          <Link href="/bank" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 22px', background:'var(--sf)', color:'var(--tx2)', border:'1px solid var(--line2)', borderRadius:13, fontWeight:600, fontSize:15, textDecoration:'none' }}>
            Browse questions
          </Link>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <section style={{ borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', background:'var(--sf)', padding:'18px 24px' }}>
        <div style={{ maxWidth:760, margin:'0 auto', display:'flex', justifyContent:'center', gap:'clamp(24px,6vw,72px)', flexWrap:'wrap' }}>
          {[
            { val:'2,400+', label:'SAT questions' },
            { val:'3',      label:'difficulty levels' },
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

      {/* ── TRY A QUESTION (no login needed) ─────────────── */}
      <section style={{ maxWidth:780, margin:'0 auto', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:10 }}>No account needed</div>
          <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)' }}>Try a real SAT question</h2>
          <p style={{ fontSize:14, color:'var(--tx3)', marginTop:10 }}>This is exactly what the Question Bank looks like inside. Select an answer to see instant feedback.</p>
        </div>

        <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:20, padding:'clamp(20px,4vw,32px)', boxShadow:'0 8px 40px rgba(0,0,0,.2)' }}>
          {/* Badges */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:18 }}>
            <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(124,58,237,.14)', color:'#a78bfa' }}>Reading & Writing</span>
            <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600, background:'var(--sf3)', color:'var(--tx2)' }}>{SAMPLE_Q.domain}</span>
            <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, background:'var(--sf3)', color:'var(--tx3)' }}>{SAMPLE_Q.skill}</span>
            <span style={{ padding:'3px 9px', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid var(--a-tx)', color:'var(--a-tx)' }}>{SAMPLE_Q.difficulty}</span>
          </div>

          {/* Question text */}
          <div style={{ fontSize:15.5, lineHeight:1.8, color:'var(--tx)', marginBottom:22 }}>{SAMPLE_Q.text}</div>

          {/* Choices */}
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

          {/* Confirm / explanation */}
          {!revealed ? (
            <button onClick={() => { if (sel !== null) setRevealed(true) }} disabled={sel === null}
              style={{ padding:'10px 24px', background:'var(--lime)', color:'#060a0e', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:sel!==null?'pointer':'default', opacity:sel!==null?1:.35 }}>
              Confirm answer
            </button>
          ) : (
            <>
              <div style={{ borderRadius:12, padding:'14px 16px', marginBottom:14, background:sel===SAMPLE_Q.answer?'var(--g-bg)':'var(--r-bg)', border:`1px solid ${sel===SAMPLE_Q.answer?'var(--g-ln)':'var(--r-ln)'}` }}>
                <div style={{ fontSize:13.5, fontWeight:700, marginBottom:6, color:sel===SAMPLE_Q.answer?'var(--g-tx)':'var(--r-tx)', display:'flex', alignItems:'center', gap:6 }}>
                  {sel===SAMPLE_Q.answer ? <CheckIcon /> : <XIcon />}
                  {sel===SAMPLE_Q.answer ? 'Correct!' : `Incorrect — the answer is B`}
                </div>
                <div style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.7 }}>{SAMPLE_Q.explanation}</div>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                <button onClick={() => { setSel(null); setRevealed(false) }} style={{ padding:'8px 16px', background:'var(--sf3)', color:'var(--tx)', border:'1px solid var(--line2)', borderRadius:9, fontSize:13, cursor:'pointer' }}>
                  Try again
                </button>
                <Link href="/bank" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', background:'var(--lime)', color:'#060a0e', borderRadius:9, fontSize:13, fontWeight:700, textDecoration:'none' }}>
                  See 2,400+ more questions <ArrowIcon />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section style={{ background:'var(--sf)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:10 }}>What you get</div>
            <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)' }}>Built for the digital SAT</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:16 }}>
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

      {/* ── VS COMPARISON ────────────────────────────────── */}
      <section style={{ maxWidth:860, margin:'0 auto', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:10 }}>Why Nexus</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)' }}>What the others are missing</h2>
        </div>
        <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:18, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr repeat(4, 80px)', gap:0, background:'var(--sf2)', borderBottom:'1px solid var(--line)' }}>
            <div style={{ padding:'12px 20px', fontSize:11, fontWeight:700, color:'var(--tx4)', textTransform:'uppercase', letterSpacing:'.5px' }}>Feature</div>
            {['Nexus','Khan','CB','Prep'].map((n,i) => (
              <div key={n} style={{ padding:'12px 8px', textAlign:'center', fontSize:12, fontWeight:700, color:i===0?'var(--lime-dk)':'var(--tx3)' }}>{n}</div>
            ))}
          </div>
          {COMPARE.map((row, ri) => (
            <div key={ri} style={{ display:'grid', gridTemplateColumns:'1fr repeat(4, 80px)', borderBottom: ri < COMPARE.length-1 ? '1px solid var(--line)' : 'none', alignItems:'center' }}>
              <div style={{ padding:'13px 20px', fontSize:13.5, color:'var(--tx2)' }}>{row.feature}</div>
              {[row.nexus, row.khan, row.cb, row.prep].map((v, ci) => (
                <div key={ci} style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'13px 0' }}>
                  {v ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ci===0?'var(--g-tx)':'var(--tx4)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--r-tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p style={{ textAlign:'center', fontSize:11.5, color:'var(--tx4)', marginTop:12 }}>CB = College Board, Prep = Prepscholar free tier</p>
      </section>

      {/* ── SCORE PREDICTOR TEASER ───────────────────────── */}
      <section style={{ background:'var(--sf)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', display:'flex', gap:48, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
          <div style={{ flex:'1 1 300px', maxWidth:440 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#f472b6', textTransform:'uppercase', letterSpacing:'2px', marginBottom:12 }}>Score Predictor</div>
            <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)', marginBottom:16, lineHeight:1.2 }}>Know your score<br/>before test day.</h2>
            <p style={{ fontSize:14, color:'var(--tx3)', lineHeight:1.75, marginBottom:24 }}>After answering just 10 questions per section, Nexus predicts your SAT score in real time — broken down into R&amp;W and Math. Watch it climb as you practice.</p>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
              {['Updates live after every answer','Separate R&W and Math subscores','Based on real Digital SAT scoring curves'].map(t => (
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
            <div style={{ background:'var(--sf2)', border:'1px solid var(--line2)', borderRadius:20, padding:'26px 22px', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.28)' }}>
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
      <section style={{ maxWidth:860, margin:'0 auto', padding:'clamp(40px,7vw,72px) 24px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--lime-dk)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:10 }}>Student results</div>
          <h2 style={{ fontSize:'clamp(22px,4vw,34px)', fontWeight:900, letterSpacing:'-.8px', color:'var(--tx)' }}>Real scores. Real students.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:18, padding:'22px 20px' }}>
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
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{ background:'var(--sf)', borderTop:'1px solid var(--line)', padding:'clamp(48px,8vw,80px) 24px' }}>
        <div style={{ maxWidth:520, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(24px,5vw,40px)', fontWeight:900, letterSpacing:'-1.5px', color:'var(--tx)', marginBottom:16, lineHeight:1.1 }}>Start raising your<br/>SAT score today.</h2>
          <p style={{ fontSize:15, color:'var(--tx3)', lineHeight:1.7, marginBottom:32 }}>Free forever. No ads. No subscriptions. Just the best SAT prep you can find.</p>
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
