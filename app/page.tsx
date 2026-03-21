'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sessionStore, getLevelInfo } from '@/lib/store/session'
import { useGamification, useStats, useWeakSkills } from '@/lib/store/useSession'

/* ─── Icons ────────────────────────────────────────────── */
const A = (p: any) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const Check = (p: any) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>
const X = (p: any) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const Fire  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
const Star  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const Clock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
// Mission icons (replace all emojis)
const IcTarget = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const IcRocket = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m3.29 15 1.4-1.4a2.18 2.18 0 0 1 2.91.09c.79.78.8 2.07.09 2.91L6.3 18"/><path d="M6.5 8.5 9.8 6.7a2.18 2.18 0 0 0 .7-3.1C9.77 2.6 8.73 2.3 7.8 2.7L5 4.5"/><path d="m15 15-4-4 1.5-1.5"/><path d="m19.5 8.5 1-2.5-2.5 1-4.5 4.5 2 2 4-5z"/></svg>
const IcBolt   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IcBook   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
const IcChart  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IcStudy  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>

// Map icon key → component (used in mission renderer)
const MISSION_ICONS: Record<string, () => JSX.Element> = {
  target:  IcTarget,
  rocket:  IcRocket,
  bolt:    IcBolt,
  book:    IcBook,
  chart:   IcChart,
  study:   IcStudy,
}

/* ─── Comparison data ───────────────────────────────────── */
const COMPARE = [
  { feature: 'Real SAT questions',   nexus: true,  khan: true,  cb: true,  prep: false },
  { feature: 'Live score predictor', nexus: true,  khan: false, cb: false, prep: false },
  { feature: 'Diagnostic + plan',    nexus: true,  khan: false, cb: false, prep: false },
  { feature: 'Daily missions',       nexus: true,  khan: false, cb: false, prep: false },
  { feature: '75s timer mode',       nexus: true,  khan: false, cb: false, prep: false },
  { feature: 'Mistake analysis',     nexus: true,  khan: false, cb: false, prep: false },
  { feature: 'Free, no paywall',     nexus: true,  khan: true,  cb: true,  prep: false },
  { feature: 'No ads',               nexus: true,  khan: false, cb: false, prep: false },
]

/* ─── Daily missions generator ──────────────────────────── */
function getDailyMissions(
  weakSkills: { skill: string; acc: number }[],
  totalAnswered: number,
  baselineScore: number | null
) {
  const today = new Date().toISOString().split('T')[0]
  const seed  = parseInt(today.replace(/-/g, ''))
  const missions: { id: string; icon: string; color: string; title: string; desc: string; action: string; actionLabel: string; xp: number }[] = []

  if (weakSkills.length > 0) {
    missions.push({
      id: 'weak-drill',
      icon: 'target',
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
      icon: 'rocket',
      color: 'var(--lime-dk)',
      title: 'Answer your first 10 questions',
      desc: 'Get started in the Question Bank. Every expert was once a beginner.',
      action: '/bank',
      actionLabel: 'Open bank',
      xp: 100,
    })
  }

  const domains = ['Algebra', 'Standard English Conventions', 'Information and Ideas', 'Advanced Math']
  const timerDomain = domains[seed % domains.length]
  missions.push({
    id: 'timer-challenge',
    icon: 'bolt',
    color: '#60a5fa',
    title: 'Speed round: ' + timerDomain,
    desc: '5 questions with the 75-second timer on. Train your brain to think under pressure.',
    action: `/bank?domain=${encodeURIComponent(timerDomain)}`,
    actionLabel: 'Start timed',
    xp: 120,
  })

  if (totalAnswered > 5) {
    missions.push({
      id: 'review',
      icon: 'book',
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
      icon: 'chart',
      color: '#fb923c',
      title: baselineScore ? 'Refine your score estimate' : 'Take the diagnostic test',
      desc: baselineScore
        ? 'Answer more questions to get a more accurate score prediction.'
        : 'Find your baseline score in 8 minutes. Know exactly where you stand.',
      action: '/diagnostic',
      actionLabel: baselineScore ? 'Continue' : 'Take now',
      xp: 200,
    })
  }

  return missions.slice(0, 3)
}

/* ─── Sample question ───────────────────────────────────── */
const SAMPLE_Q = {
  text: `Historian Priya Satia argues that the British Empire's dominance in the 18th century was closely tied to its gun industry — not just as a military advantage, but as a driver of economic growth. ______ the profits from gun manufacturing and trade helped fund colonial expansion itself.`,
  choices: ['In contrast,', 'Specifically,', 'Regardless,', 'Nevertheless,'],
  answer: 1,
  explanation: '"Specifically" narrows the preceding claim — identifying gun profits as the mechanism linking the gun industry to colonial expansion.',
}

/* ══════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [user,     setUser]     = useState<{ name: string; email: string } | null>(null)
  const [ready,    setReady]    = useState(false)
  const [stats,    setStats]    = useState({ total: 0, correct: 0, acc: 0 })
  const [baseline, setBaseline] = useState<number | null>(null)
  const [target,   setTarget]   = useState<number | null>(null)
  const [qSel,     setQSel]     = useState<number | null>(null)
  const [qRevealed,setQRevealed]= useState(false)
  const [qTimer,   setQTimer]   = useState(75)
  const [qTiming,  setQTiming]  = useState(false)

  const gamification = useGamification()
  const weakSkills   = useWeakSkills(3)

  useEffect(() => {
    const u = localStorage.getItem('nexus_user')
    if (u) {
      try { setUser(JSON.parse(u)) } catch {}
      const s = sessionStore.getStats()
      setStats({ total: s.total, correct: s.correct, acc: s.acc })
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

  useEffect(() => {
    if (!qTiming || qRevealed) return
    if (qTimer <= 0) { setQRevealed(true); setQTiming(false); return }
    const id = setTimeout(() => setQTimer(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [qTiming, qTimer, qRevealed])

  if (!ready) return null

  /* ── DASHBOARD ─────────────────────────────────────────── */
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
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 20px 100px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 3 }}>{greeting}, {firstName}</div>
          {currentScore && target ? (
            <div style={{ fontSize: 14, color: 'var(--tx3)' }}>
              You&apos;re at <span style={{ color: 'var(--a-tx)', fontWeight: 700 }}>{currentScore}</span>
              {' '}→ targeting <span style={{ color: 'var(--lime-dk)', fontWeight: 700 }}>{target}</span>
              {pointGap && pointGap > 0 && <span style={{ color: 'var(--tx4)' }}> · {pointGap} points to go</span>}
            </div>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--tx3)' }}>
              {stats.total === 0 ? "Let's find your baseline score first." : 'Keep going — your score prediction improves with every question.'}
            </div>
          )}
        </div>

        {/* Diagnostic CTA */}
        {!baseline && (
          <div style={{ background: 'linear-gradient(135deg, rgba(163,230,53,.12), rgba(34,211,238,.08))', border: '1px solid rgba(163,230,53,.3)', borderRadius: 18, padding: '20px 22px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(163,230,53,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--lime-dk)' }}><IcChart /></div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--tx)', marginBottom: 3 }}>Find your score in 8 minutes</div>
              <div style={{ fontSize: 13, color: 'var(--tx3)' }}>Take the diagnostic test. Get your baseline score and a personalized study plan.</div>
            </div>
            <Link href="/diagnostic" style={{ padding: '11px 22px', background: 'var(--lime)', color: '#060a0e', borderRadius: 11, fontWeight: 800, fontSize: 14, textDecoration: 'none', flexShrink: 0 }}>
              Start diagnostic →
            </Link>
          </div>
        )}

        {/* Score progress */}
        {currentScore && target && (
          <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Score Journey</div>
              <Link href="/score" style={{ fontSize: 12, color: 'var(--lime-dk)', fontWeight: 600, textDecoration: 'none' }}>Full predictor →</Link>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx4)', marginBottom: 5 }}>
              <span>400</span><span>800</span><span>1200</span><span>1600</span>
            </div>
            <div style={{ height: 10, background: 'var(--sf3)', borderRadius: 5, overflow: 'hidden', position: 'relative', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${((currentScore - 400) / 1200) * 100}%`, background: 'var(--a-tx)', borderRadius: 5 }} />
              <div style={{ position: 'absolute', top: 0, height: '100%', left: `${((currentScore - 400) / 1200) * 100}%`, width: `${((target - currentScore) / 1200) * 100}%`, background: 'var(--lime)', opacity: 0.35, borderRadius: '0 5px 5px 0' }} />
              <div style={{ position: 'absolute', top: -2, bottom: -2, width: 2, background: 'var(--lime-dk)', left: `${((target - 400) / 1200) * 100}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-tx)' }}>Now: {currentScore}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lime-dk)', display:'flex', alignItems:'center', gap:4 }}>Target: {target} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--lime-dk)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg></span>
            </div>
          </div>
        )}

        {/* XP + Streak */}
        <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,var(--lime-dk),#22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#060a0e', fontFamily: 'var(--mono)', flexShrink: 0 }}>
            {levelInfo.current.level}
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{levelInfo.current.name}</span>
              {!levelInfo.isMax && <span style={{ fontSize: 10.5, color: 'var(--tx4)', fontFamily: 'var(--mono)' }}>→ {levelInfo.next.name}</span>}
            </div>
            <div style={{ height: 4, background: 'var(--sf3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${levelInfo.pct}%`, background: 'linear-gradient(90deg,var(--lime-dk),#22d3ee)', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 9, background: streakActive ? 'rgba(251,146,60,.12)' : 'var(--sf2)', border: `1px solid ${streakActive ? 'rgba(251,146,60,.3)' : 'var(--line)'}` }}>
              <span style={{ color: streakActive ? '#fb923c' : 'var(--tx4)', display: 'flex' }}><Fire /></span>
              <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--mono)', color: streakActive ? '#fb923c' : 'var(--tx3)' }}>{gamification.streak}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 9, background: 'var(--sf2)', border: '1px solid var(--line)' }}>
              <span style={{ color: '#fbbf24', display: 'flex' }}><Star /></span>
              <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--mono)' }}>{gamification.xp.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Daily Missions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--tx)' }}>Today&apos;s Missions</div>
            <div style={{ fontSize: 11, color: 'var(--tx4)', background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--mono)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {missions.map((m, i) => (
              <div key={m.id} style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: m.color }}>
                  {(() => { const Ic = MISSION_ICONS[m.icon]; return Ic ? <Ic /> : null })()} 
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--tx)', marginBottom: 3 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--tx3)', lineHeight: 1.5 }}>{m.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--lime-dk)', fontWeight: 600, marginTop: 5 }}>+{m.xp} XP</div>
                </div>
                <Link href={m.action} style={{ padding: '9px 18px', background: m.color, color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none', flexShrink: 0 }}>
                  {m.actionLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        {stats.total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Answered', val: stats.total,     color: 'var(--lime-dk)' },
              { label: 'Accuracy', val: `${stats.acc}%`, color: stats.acc >= 70