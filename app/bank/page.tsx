'use client'
// app/bank/page.tsx — with KaTeX math rendering + section filter fix
import { useState, useEffect, useCallback } from 'react'
import { Question, TreeData, TreeDomain } from '@/lib/types'
import { MathText } from '@/components/MathText'
import { sessionStore } from '@/lib/store/session'

/* ── Supabase REST ─────────────────────────────────────────── */
function supaFetch(url: string, key: string, table: string, opts: {
  select?: string; filters?: { col: string; op: string; val: string }[]; limit?: number
}) {
  const params = new URLSearchParams()
  params.set('select', opts.select || '*')
  if (opts.limit) params.set('limit', String(opts.limit))
  ;(opts.filters || []).forEach(f => params.append(f.col, `${f.op}.${f.val}`))
  return fetch(`${url}/rest/v1/${table}?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).then(r => r.json())
}

interface Creds { url: string; key: string; table: string }
const LABELS = ['A', 'B', 'C', 'D']

// ── Hardcoded public credentials (read-only anon key) ────────
const DEFAULT_CREDS: Creds = {
  url: 'https://cxeeqxxvuyrhlpindljk.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M',
  table: 'sat_questions',
}

/* ── Clock ─────────────────────────────────────────────────── */
function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--tx3)' }}>{time}</span>
}

export default function BankPage() {
  const [isAdmin, setIsAdmin]     = useState(false)
  const [creds, setCreds]         = useState<Creds | null>(null)
  const [connected, setConnected] = useState<'off' | 'checking' | 'live' | 'err'>('off')
  const [tree, setTree]           = useState<TreeData>({ English: [], Math: [] })
  const [sec, setSec]             = useState<'English' | 'Math'>('English')
  const [actDom, setActDom]       = useState<string | null>(null)
  const [actSk, setActSk]         = useState<string | null>(null)
  const [diff, setDiff]           = useState('all')
  const [shuffle, setShuffle]     = useState(false)
  const [qs, setQs]               = useState<Question[]>([])
  const [idx, setIdx]             = useState(0)
  const [loadingQs, setLoadingQs] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [sel, setSel]             = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved]         = useState<Set<string>>(new Set())
  const [correct, setCorrect]     = useState(0)
  const [wrong, setWrong]         = useState(0)

  const [sideOpen, setSideOpen] = useState(false)
  // Sync saved state from persistent store on mount
  useEffect(() => {
    const s = sessionStore.get().saved
    setSaved(new Set(Object.keys(s)))
    return sessionStore.subscribe(() => {
      setSaved(new Set(Object.keys(sessionStore.get().saved)))
    })
  }, [])

  useEffect(() => {
    setIsAdmin(sessionStorage.getItem('nexus_admin') === '1')
    // Use saved creds or fall back to default
    const raw = localStorage.getItem('nexus_creds')
    const c: Creds = raw ? JSON.parse(raw) : DEFAULT_CREDS
    if (!raw) localStorage.setItem('nexus_creds', JSON.stringify(DEFAULT_CREDS))
    setCreds(c); setConnected('checking')
    supaFetch(c.url, c.key, c.table, { select: 'id', limit: 1 })
      .then(d => { if (Array.isArray(d)) { setConnected('live'); buildTree(c) } else setConnected('err') })
      .catch(() => setConnected('err'))
  }, [])

  const buildTree = useCallback(async (c: Creds) => {
    const data = await supaFetch(c.url, c.key, c.table, { select: 'section,domain,skill', limit: 5000 })
    if (!Array.isArray(data)) return
    const map: Record<string, Record<string, Record<string, number>>> = { English: {}, Math: {} }
    data.forEach((r: any) => {
      const s = /math/i.test(r.section) ? 'Math' : 'English'
      const d = r.domain || 'Other'
      const sk = r.skill || ''
      if (!map[s][d]) map[s][d] = { _total: 0 }
      map[s][d]._total = (map[s][d]._total || 0) + 1
      if (sk) map[s][d][sk] = (map[s][d][sk] || 0) + 1
    })
    const toArr = (obj: Record<string, Record<string, number>>): TreeDomain[] =>
      Object.keys(obj).map(d => ({ name: d, count: obj[d]._total || 0, children: Object.keys(obj[d]).filter(k => k !== '_total').map(sk => ({ name: sk, count: obj[d][sk] })) }))
    setTree({ English: toArr(map.English), Math: toArr(map.Math) })
  }, [])

  const loadQs = useCallback(async (dom: string, sk: string | null, activeSec?: string) => {
    if (!creds) return
    const useSec = activeSec || sec
    setLoadingQs(true); setQs([]); setIdx(0); setSel(null); setSubmitted(false); setCorrect(0); setWrong(0)
    const filters: { col: string; op: string; val: string }[] = []
    if (dom) filters.push({ col: 'domain', op: 'eq', val: dom })
    if (sk)  filters.push({ col: 'skill',  op: 'eq', val: sk })
    if (diff !== 'all') filters.push({ col: 'difficulty', op: 'eq', val: diff })
    const data = await supaFetch(creds.url, creds.key, creds.table, {
      select: 'id,section,domain,skill,difficulty,question_text,passage_text,choice_a,choice_b,choice_c,choice_d,correct_answer,explanation',
      filters, limit: 500,
    })
    let items: Question[] = Array.isArray(data) ? data : []
    // Client-side section filter — avoids DB exact-match issues
    items = items.filter(q => useSec === 'Math' ? /math/i.test(q.section) : !/math/i.test(q.section))
    const sorted = shuffle ? [...items].sort(() => Math.random() - .5) : items
    setQs(sorted); setLoadingQs(false)
  }, [creds, sec, diff, shuffle])

  const tryConnect = async (url: string, key: string, table: string) => {
    setConnected('checking')
    const d = await supaFetch(url, key, table, { select: 'id', limit: 1 }).catch(() => null)
    if (Array.isArray(d)) {
      const c = { url, key, table }; setCreds(c); setConnected('live')
      localStorage.setItem('nexus_creds', JSON.stringify(c)); setShowModal(false); buildTree(c)
    } else setConnected('err')
  }

  const goTo = (i: number) => { setIdx(i); setSel(null); setSubmitted(false) }

  const confirm = useCallback(() => {
    if (!sel || submitted || !qs[idx]) return
    const q = qs[idx]
    const isCorrect = sel === q.correct_answer
    setSubmitted(true)
    if (isCorrect) setCorrect(c => c + 1); else setWrong(c => c + 1)
    // Save to persistent store
    sessionStore.addAnswer({
      questionId: q.id,
      section: q.section,
      domain: q.domain || '',
      skill: q.skill || '',
      difficulty: q.difficulty || '',
      selectedAnswer: sel,
      correctAnswer: q.correct_answer,
      isCorrect,
      explanation: q.explanation || '',
      question_text: q.question_text,
      choice_a: q.choice_a,
      choice_b: q.choice_b,
      choice_c: q.choice_c,
      choice_d: q.choice_d,
    })
  }, [sel, submitted, qs, idx])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const map: Record<string, string> = { a:'A', b:'B', c:'C', d:'D' }
      if (!submitted && map[e.key.toLowerCase()]) { setSel(map[e.key.toLowerCase()]); return }
      if (e.key === 'Enter') { if (!submitted && sel) confirm(); else if (submitted && idx < qs.length - 1) goTo(idx + 1) }
      if (e.key === 'ArrowRight' && submitted) goTo(Math.min(qs.length - 1, idx + 1))
      if (e.key === 'ArrowLeft') goTo(Math.max(0, idx - 1))
      if (e.key.toLowerCase() === 's' && qs[idx]) setSaved(s => { const n = new Set(s); n.has(qs[idx].id) ? n.delete(qs[idx].id) : n.add(qs[idx].id); return n })
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [submitted, sel, idx, qs])

  const q = qs[idx]
  const total = qs.length
  const done = correct + wrong
  const pct = total ? Math.round((done / total) * 100) : 0
  const opts = q ? [q.choice_a, q.choice_b, q.choice_c, q.choice_d] : []
  const corrIdx = q ? LABELS.indexOf(q.correct_answer) : -1

  const choiceStyle = (i: number): React.CSSProperties => {
    if (!submitted) {
      const isSel = sel === LABELS[i]
      return { borderColor: isSel ? 'var(--lime)' : 'var(--line)', background: isSel ? 'var(--lime-dim)' : 'var(--sf)', opacity: 1 }
    }
    if (i === corrIdx) return { borderColor: 'var(--g-tx)', background: 'var(--g-bg)', opacity: 1 }
    if (LABELS[i] === sel) return { borderColor: 'var(--r-tx)', background: 'var(--r-bg)', opacity: 1 }
    return { borderColor: 'var(--line)', background: 'var(--sf)', opacity: 0.28 }
  }

  const labelStyle = (i: number): React.CSSProperties => {
    if (!submitted && sel === LABELS[i]) return { background: 'var(--lime)', color: '#060a0e', borderColor: 'var(--lime)' }
    if (submitted && i === corrIdx) return { background: 'var(--g-tx)', color: '#fff', borderColor: 'var(--g-tx)' }
    if (submitted && LABELS[i] === sel) return { background: 'var(--r-tx)', color: '#fff', borderColor: 'var(--r-tx)' }
    return { background: 'transparent', color: 'var(--tx3)', borderColor: 'var(--line2)' }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--nav-h))', overflow: 'hidden', position: 'relative' }}>

      {/* ── MOBILE SIDEBAR OVERLAY ───────────────────── */}
      {sideOpen && <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'none' }} className="mob-overlay" />}

      {/* ── SIDEBAR ──────────────────────────────────── */}
      <aside className={`sidebar${sideOpen ? ' sidebar-open' : ''}`} style={{ width: 'var(--side-w)', minWidth: 'var(--side-w)', borderRight: '1px solid var(--line)', background: 'var(--sf)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Connection */}
        <div style={{ padding: '9px 13px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: connected === 'live' ? 'var(--lime)' : connected === 'err' ? 'var(--r-tx)' : 'var(--tx4)', boxShadow: connected === 'live' ? '0 0 7px rgba(163,230,53,.4)' : 'none' }} />
          <span style={{ color: 'var(--tx3)', flex: 1 }}>{connected === 'live' ? 'Connected' : connected === 'checking' ? 'Connecting…' : connected === 'err' ? 'Error' : 'Not connected'}</span>
          {isAdmin && <button onClick={() => setShowModal(true)} style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--lime-dk)', cursor: 'pointer', border: 'none', background: 'none' }}>Reconnect</button>}
        </div>

        {/* Difficulty */}
        <div style={{ padding: '10px 13px', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '.6px' }}>Difficulty</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {['all','easy','medium','hard'].map(d => (
              <button key={d} onClick={() => { setDiff(d); if (actDom) loadQs(actDom, actSk) }}
                style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11.5, fontWeight: d === diff ? 700 : 500, border: `1px solid ${d === diff ? 'var(--lime)' : 'var(--line2)'}`, background: d === diff ? 'var(--lime)' : 'none', color: d === diff ? '#060a0e' : 'var(--tx3)', cursor: 'pointer' }}>
                {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--tx2)' }}>
            <span>Shuffle</span>
            <button onClick={() => setShuffle(s => !s)} style={{ width: 32, height: 17, borderRadius: 9, border: 'none', background: shuffle ? 'var(--lime)' : 'var(--line2)', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
              <span style={{ position: 'absolute', width: 13, height: 13, borderRadius: '50%', background: '#fff', top: 2, left: shuffle ? 17 : 2, transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
          {(['English', 'Math'] as const).map(s => (
            <button key={s} onClick={() => { setSec(s); setActDom(null); setActSk(null); setQs([]) }}
              style={{ flex: 1, padding: '9px 4px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: sec === s ? 'var(--lime-dk)' : 'var(--tx3)', borderBottom: sec === s ? '2px solid var(--lime)' : '2px solid transparent' }}>
              {s === 'English' ? 'Reading & Writing' : 'Math'}
            </button>
          ))}
        </div>

        {/* Tree */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>
          {(tree[sec] || []).map((dom, di) => {
            const open = dom.name === actDom
            return (
              <div key={di} style={{ borderBottom: '1px solid var(--line)' }}>
                <div onClick={() => { setActDom(dom.name); setActSk(null); loadQs(dom.name, null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', cursor: 'pointer', background: open && !actSk ? 'var(--lime-dim)' : 'none' }}>
                  <span style={{ fontSize: 9, color: 'var(--tx4)', transition: 'transform .18s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: open && !actSk ? 'var(--lime-dk)' : 'var(--tx)', lineHeight: 1.3 }}>{dom.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--tx4)', background: 'var(--sf3)', padding: '2px 7px', borderRadius: 100, fontFamily: 'var(--mono)' }}>{dom.count}</span>
                </div>
                {open && dom.children.map((sk, si) => (
                  <div key={si} onClick={() => { setActSk(sk.name); loadQs(dom.name, sk.name) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px 8px 28px', cursor: 'pointer', background: actSk === sk.name ? 'var(--lime-dim)' : 'none', borderLeft: `2px solid ${actSk === sk.name ? 'var(--lime)' : 'transparent'}` }}>
                    <span style={{ fontSize: 12.5, flex: 1, color: actSk === sk.name ? 'var(--lime-dk)' : 'var(--tx2)', lineHeight: 1.35 }}>{sk.name}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--tx4)', fontFamily: 'var(--mono)' }}>{sk.count}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* Top bar */}
        <div style={{ height: 42, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, background: 'var(--sf)', flexShrink: 0 }}>
          {/* Mobile sidebar toggle */}
          <button onClick={() => setSideOpen(o => !o)} className="mob-menu-btn" style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid var(--line2)', background: 'var(--sf2)', fontSize: 16, cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>☰</button>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--tx3)', display: 'flex', gap: 5, alignItems: 'center', overflow: 'hidden' }}>
            {q ? (<>
              <span>{/math/i.test(q.section) ? 'Math' : 'Reading & Writing'}</span>
              {q.domain && <><span style={{ color: 'var(--tx4)' }}>›</span><b style={{ color: 'var(--tx2)', fontWeight: 600 }}>{q.domain}</b></>}
              {q.skill  && <><span style={{ color: 'var(--tx4)' }}>›</span><b style={{ color: 'var(--tx2)', fontWeight: 600 }}>{q.skill}</b></>}
            </>) : <span>Select a topic from the sidebar</span>}
          </div>
          <Clock />
          {total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <NavBtn onClick={() => goTo(Math.max(0, idx - 1))} disabled={idx === 0}>←</NavBtn>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--tx3)', minWidth: 52, textAlign: 'center' }}>{idx + 1} / {total}</span>
              <NavBtn onClick={() => goTo(Math.min(total - 1, idx + 1))} disabled={idx === total - 1}>→</NavBtn>
            </div>
          )}
        </div>

        {/* Progress */}
        <div style={{ height: 2, background: 'var(--sf3)', flexShrink: 0 }}>
          <div style={{ height: '100%', background: 'var(--lime)', width: `${pct}%`, transition: 'width .35s' }} />
        </div>

        {/* Stats row */}
        <div style={{ height: 34, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 18, flexShrink: 0, background: 'var(--sf)', fontSize: 12 }}>
          <span style={{ color: 'var(--g-tx)', fontWeight: 600 }}>✓ {correct} correct</span>
          <span style={{ color: 'var(--r-tx)', fontWeight: 600 }}>✗ {wrong} wrong</span>
          <span style={{ color: 'var(--tx3)' }}>{total - done} remaining</span>
        </div>

        {/* Question */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingQs ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: 'var(--tx3)', fontSize: 13 }}>
              <div className="spinner" />Loading questions…
            </div>
          ) : !q ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: '60px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 42 }}>📖</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx2)' }}>Select a topic</div>
              <div style={{ fontSize: 13, color: 'var(--tx3)', maxWidth: 300, lineHeight: 1.6 }}>Choose a domain or skill from the left sidebar to begin.</div>
            </div>
          ) : (
            <div key={`${q.id}-${idx}`} style={{ maxWidth: 760, padding: '28px 30px 60px', animation: 'fadeUp .2s ease' }}>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 18 }}>
                <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: /math/i.test(q.section) ? 'rgba(37,99,235,.14)' : 'rgba(124,58,237,.14)', color: /math/i.test(q.section) ? '#60a5fa' : '#a78bfa' }}>
                  {/math/i.test(q.section) ? 'Math' : 'Reading & Writing'}
                </span>
                {q.domain && <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'var(--sf3)', color: 'var(--tx2)' }}>{q.domain}</span>}
                {q.skill  && <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 500, background: 'var(--sf3)', color: 'var(--tx3)' }}>{q.skill}</span>}
                {q.difficulty && (
                  <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: 'transparent', border: '1px solid currentColor', color: q.difficulty === 'easy' ? 'var(--g-tx)' : q.difficulty === 'hard' ? 'var(--r-tx)' : 'var(--a-tx)' }}>
                    {q.difficulty}
                  </span>
                )}
              </div>

              {/* Passage */}
              {q.passage_text && (
                <div style={{ background: 'var(--sf)', border: '1px solid var(--line)', borderLeft: '3px solid var(--lime-dk)', borderRadius: 12, padding: '16px 20px', marginBottom: 22 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--lime-dk)', marginBottom: 10 }}>Passage</div>
                  <MathText text={q.passage_text} style={{ fontSize: 14, lineHeight: 1.85, color: 'var(--tx2)' }} />
                </div>
              )}

              {/* Question */}
              <MathText text={q.question_text} style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--tx)', marginBottom: 24, fontWeight: 400 }} />

              {/* Choices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                {opts.map((opt, i) => {
                  if (!opt) return null
                  const cs = choiceStyle(i)
                  const ls = labelStyle(i)
                  return (
                    <div key={i} onClick={() => !submitted && setSel(LABELS[i])}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${cs.borderColor}`, background: cs.background as string, cursor: submitted ? 'default' : 'pointer', opacity: cs.opacity, transition: 'border-color .13s, background .13s' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${ls.borderColor}`, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--mono)', background: ls.background as string, color: ls.color as string, marginTop: 1 }}>{LABELS[i]}</div>
                      <MathText text={opt} style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--tx)', flex: 1, paddingTop: 3 }} />
                    </div>
                  )
                })}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
                {!submitted ? (
                  <>
                    <button onClick={confirm} disabled={!sel}
                      style={{ padding: '10px 22px', background: 'var(--lime)', color: '#060a0e', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: sel ? 'pointer' : 'default', opacity: sel ? 1 : .4 }}>
                      Confirm
                    </button>
                    <button onClick={() => goTo(Math.min(total - 1, idx + 1))}
                      style={{ padding: '10px 18px', background: 'none', color: 'var(--tx3)', border: '1px solid var(--line2)', borderRadius: 9, fontSize: 14, cursor: 'pointer' }}>
                      Skip
                    </button>
                  </>
                ) : idx < total - 1 ? (
                  <button onClick={() => goTo(idx + 1)}
                    style={{ padding: '10px 22px', background: 'var(--sf3)', color: 'var(--tx)', border: '1px solid var(--line2)', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Next →
                  </button>
                ) : null}
                <button onClick={() => {
                  if (!q || !submitted) return
                  const existing = sessionStore.get().answered.find(a => a.questionId === q.id)
                  if (existing) sessionStore.toggleSaved(existing)
                }}
                  title="Bookmark (S)"
                  style={{ width: 36, height: 36, borderRadius: 8, fontSize: 16, border: `1px solid ${q && saved.has(q.id) ? 'var(--lime)' : 'var(--line2)'}`, background: q && saved.has(q.id) ? 'var(--lime-dim)' : 'var(--sf2)', color: q && saved.has(q.id) ? 'var(--lime-dk)' : 'var(--tx3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🔖
                </button>
              </div>

              {/* Result explanation */}
              {submitted && (
                <div style={{ borderRadius: 13, padding: '16px 19px', marginBottom: 20, background: sel === q.correct_answer ? 'var(--g-bg)' : 'var(--r-bg)', border: `1px solid ${sel === q.correct_answer ? 'var(--g-ln)' : 'var(--r-ln)'}`, animation: 'fadeUp .22s ease' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: sel === q.correct_answer ? 'var(--g-tx)' : 'var(--r-tx)' }}>
                    {sel === q.correct_answer ? '✓  Correct!' : `✗  Incorrect — the correct answer is ${q.correct_answer}`}
                  </div>
                  {q.explanation && <MathText text={q.explanation} style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--tx2)' }} />}
                </div>
              )}

              {/* Keyboard hints */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--tx4)' }}>
                {[['A–D', 'select'], ['Enter', 'confirm/next'], ['→', 'next'], ['←', 'prev'], ['S', 'bookmark']].map(([k, v]) => (
                  <span key={k}><kbd style={{ background: 'var(--sf2)', border: '1px solid var(--line2)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--mono)', fontSize: 11 }}>{k}</kbd> {v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && <ConnectModal onClose={() => setShowModal(false)} onConnect={tryConnect} initial={creds} />}
    </div>
  )
}

function NavBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--line2)', background: 'var(--sf2)', fontSize: 13, color: 'var(--tx3)', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .28 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  )
}

function ConnectModal({ onClose, onConnect, initial }: { onClose: () => void; onConnect: (u: string, k: string, t: string) => void; initial: Creds | null }) {
  const [url, setUrl] = useState(initial?.url || '')
  const [key, setKey] = useState(initial?.key || '')
  const [table, setTable] = useState(initial?.table || 'sat_questions')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async () => {
    if (!url || !key) { setErr('Enter both URL and key.'); return }
    setLoading(true); await onConnect(url.trim(), key.trim(), table.trim() || 'sat_questions'); setLoading(false)
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--sf)', border: '1px solid var(--line2)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>🔗 Connect Supabase</div>
        {[{ label: 'Project URL', val: url, set: setUrl, ph: 'https://xxxx.supabase.co' }, { label: 'Anon key', val: key, set: setKey, ph: 'eyJ…' }, { label: 'Table name', val: table, set: setTable, ph: 'sat_questions' }].map(f => (
          <div key={f.label}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--tx3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.4px' }}>{f.label}</label>
            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: '100%', padding: '9px 12px', background: 'var(--sf2)', border: '1px solid var(--line2)', borderRadius: 8, fontSize: 13, color: 'var(--tx)', fontFamily: 'var(--mono)', outline: 'none', marginBottom: 14 }} />
          </div>
        ))}
        {err && <div style={{ fontSize: 12.5, color: 'var(--r-tx)', background: 'var(--r-bg)', border: '1px solid var(--r-ln)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--tx2)', border: '1px solid var(--line2)', background: 'none', cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} style={{ padding: '6px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#060a0e', background: 'var(--lime)', border: 'none', cursor: 'pointer' }}>{loading ? 'Connecting…' : 'Connect →'}</button>
        </div>
      </div>
    </div>
  )
}