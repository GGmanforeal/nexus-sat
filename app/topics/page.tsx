'use client'
// app/topics/page.tsx — Full question browser sorted by section > domain > skill
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'

/* ─── Supabase ─────────────────────────────────────────────── */
const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMxNzEsImV4cCI6MjA4ODcyOTE3MX0.ZF5cOKLnvsTzM6xptsO-aiRtq1mfPs8KjOoaaQdCc8M'

const MATH_ONLY_DOMAINS = ['problem-solving and data analysis','problem solving and data analysis','data analysis']
function isMathDomain(d: string) { return MATH_ONLY_DOMAINS.includes(d.toLowerCase()) }

interface SkillRow  { name: string; count: number }
interface DomainRow { name: string; count: number; skills: SkillRow[] }
interface SectionData { label: string; color: string; bg: string; total: number; domains: DomainRow[] }

type SortMode = 'default' | 'az' | 'za' | 'most' | 'least'

/* ─── Icons ─────────────────────────────────────────────── */
const SearchIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const SortIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
const ArrowIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const BookIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>

export default function TopicsPage() {
  const [rawData, setRawData]   = useState<{ section:string; domain:string; skill:string }[]>([])
  const [loading, setLoading]   = useState(true)
  const [search,  setSearch]    = useState('')
  const [sort,    setSort]      = useState<SortMode>('default')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('nexus_user'))
    const h = () => setLoggedIn(!!localStorage.getItem('nexus_user'))
    window.addEventListener('nexus_auth_change', h)

    // Fetch all rows with just section/domain/skill in batches
    const fetchAll = async () => {
      let all: any[] = []
      let offset = 0
      while (true) {
        const p = new URLSearchParams()
        p.set('select', 'section,domain,skill')
        p.set('limit', '1000')
        p.set('offset', String(offset))
        const batch = await fetch(`${SUPABASE_URL}/rest/v1/sat_questions?${p}`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        }).then(r => r.json()).catch(() => [])
        if (!Array.isArray(batch) || batch.length === 0) break
        all = all.concat(batch)
        if (batch.length < 1000) break
        offset += 1000
      }
      setRawData(all)
      setLoading(false)
    }
    fetchAll()
    return () => window.removeEventListener('nexus_auth_change', h)
  }, [])

  // Build tree from rawData
  const sections = useMemo((): SectionData[] => {
    const map: Record<string, Record<string, Record<string, number>>> = { English: {}, Math: {} }
    rawData.forEach(r => {
      const sNorm = (r.section || '').trim().toLowerCase()
      const rawSec = sNorm === 'math' ? 'Math' : 'English'
      const domain = (r.domain || 'Other').trim()
      const skill  = (r.skill  || '').trim()
      const s = (rawSec === 'English' && isMathDomain(domain)) ? 'Math' : rawSec
      if (!map[s][domain]) map[s][domain] = { _total: 0 }
      map[s][domain]._total = (map[s][domain]._total || 0) + 1
      if (skill) map[s][domain][skill] = (map[s][domain][skill] || 0) + 1
    })

    const buildSection = (key: 'English' | 'Math', label: string, color: string, bg: string): SectionData => {
      let domains = Object.entries(map[key]).map(([name, skills]) => {
        const count = skills._total || 0
        const skillArr: SkillRow[] = Object.entries(skills)
          .filter(([k]) => k !== '_total')
          .map(([k, v]) => ({ name: k, count: v as number }))
        return { name, count, skills: skillArr }
      })

      // Apply sort
      if (sort === 'az')    domains = domains.sort((a,b) => a.name.localeCompare(b.name))
      if (sort === 'za')    domains = domains.sort((a,b) => b.name.localeCompare(a.name))
      if (sort === 'most')  domains = domains.sort((a,b) => b.count - a.count)
      if (sort === 'least') domains = domains.sort((a,b) => a.count - b.count)

      // Apply search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        domains = domains
          .map(d => ({
            ...d,
            skills: d.skills.filter(s => s.name.toLowerCase().includes(q)),
          }))
          .filter(d => d.name.toLowerCase().includes(q) || d.skills.length > 0)
      }

      const total = domains.reduce((s, d) => s + d.count, 0)
      return { label, color, bg, total, domains }
    }

    return [
      buildSection('English', 'English Reading & Writing', '#6366f1', 'rgba(99,102,241,.1)'),
      buildSection('Math',    'Math',                      '#0ea5e9', 'rgba(14,165,233,.1)'),
    ]
  }, [rawData, sort, search])

  // Guest gate
  if (!loggedIn) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100dvh - var(--nav-h))', padding:24 }}>
        <div style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:22, padding:'48px 32px', maxWidth:400, width:'100%', textAlign:'center' }}>
          <div style={{ width:64, height:64, background:'var(--lime)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#060a0e', margin:'0 auto 24px' }}>N</div>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Sign in to browse topics</div>
          <div style={{ fontSize:14, color:'var(--tx3)', marginBottom:28 }}>Create a free account to access all 2,400+ questions sorted by topic.</div>
          <Link href="/settings" style={{ display:'inline-block', padding:'11px 28px', background:'var(--lime)', color:'#060a0e', borderRadius:11, fontWeight:800, fontSize:14, textDecoration:'none' }}>Sign up free →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.4px', marginBottom:4 }}>Question Bank</div>
        <div style={{ fontSize:14, color:'var(--tx3)' }}>
          {loading ? 'Loading…' : `${rawData.length.toLocaleString()} questions across ${sections.reduce((a,s) => a + s.domains.length, 0)} domains`}
        </div>
      </div>

      {/* Controls bar */}
      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        {/* Search */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--sf)', border:'1px solid var(--line2)', borderRadius:10, padding:'8px 14px', flex:1, minWidth:180, maxWidth:340 }}>
          <span style={{ color:'var(--tx4)', flexShrink:0 }}><SearchIcon /></span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search domains or skills…"
            style={{ background:'none', border:'none', outline:'none', fontSize:13.5, color:'var(--tx)', width:'100%' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--tx4)', fontSize:16, lineHeight:1, padding:0 }}>×</button>
          )}
        </div>

        {/* Sort buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--tx4)', marginRight:2 }}>
            <SortIcon /> Sort:
          </span>
          {([
            { key:'default', label:'Default' },
            { key:'az',      label:'A → Z'   },
            { key:'za',      label:'Z → A'   },
            { key:'most',    label:'Most Qs' },
            { key:'least',   label:'Least Qs'},
          ] as { key: SortMode; label: string }[]).map(opt => (
            <button key={opt.key} onClick={() => setSort(opt.key)}
              style={{
                padding:'6px 12px', borderRadius:8, fontSize:12.5, fontWeight:600, cursor:'pointer', border:'1px solid',
                borderColor: sort === opt.key ? 'var(--lime)' : 'var(--line2)',
                background:  sort === opt.key ? 'var(--lime-dim)' : 'transparent',
                color:       sort === opt.key ? 'var(--lime-dk)' : 'var(--tx3)',
                transition:  'all .12s',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:20 }}>
          {[0,1].map(i => (
            <div key={i} style={{ background:'var(--sf)', borderRadius:18, padding:24, height:400 }}>
              <div className="skeleton" style={{ height:28, width:'60%', marginBottom:12, borderRadius:8 }} />
              <div className="skeleton" style={{ height:14, width:'30%', marginBottom:28, borderRadius:6 }} />
              {[1,2,3,4].map(j => (
                <div key={j} style={{ marginBottom:16 }}>
                  <div className="skeleton" style={{ height:18, width:'55%', marginBottom:8, borderRadius:6 }} />
                  <div className="skeleton" style={{ height:12, width:'80%', marginBottom:6, borderRadius:4 }} />
                  <div className="skeleton" style={{ height:12, width:'70%', borderRadius:4 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && search && sections.every(s => s.domains.length === 0) && (
        <div style={{ textAlign:'center', padding:'60px 24px', color:'var(--tx3)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>No results for "{search}"</div>
          <div style={{ fontSize:14 }}>Try a different search term.</div>
          <button onClick={() => setSearch('')} style={{ marginTop:16, padding:'8px 18px', background:'var(--sf)', border:'1px solid var(--line2)', borderRadius:9, fontSize:13, cursor:'pointer', color:'var(--tx)' }}>
            Clear search
          </button>
        </div>
      )}

      {/* Two-column section grid */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:20, alignItems:'start' }}>
          {sections.map(sec => (
            sec.domains.length === 0 ? null : (
              <div key={sec.label} style={{ background:'var(--sf)', border:'1px solid var(--line)', borderRadius:18, overflow:'hidden' }}>

                {/* Section header */}
                <div style={{ padding:'18px 20px 16px', background:sec.bg, borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                  <div>
                    <div style={{ fontSize:17, fontWeight:800, color:sec.color, letterSpacing:'-.3px' }}>{sec.label}</div>
                    <div style={{ fontSize:12, color:'var(--tx3)', marginTop:3 }}>{sec.total.toLocaleString()} questions</div>
                  </div>
                  <Link href={`/bank`}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'var(--sf)', border:'1px solid var(--line2)', borderRadius:9, fontSize:12, fontWeight:700, color:'var(--tx2)', textDecoration:'none', flexShrink:0, whiteSpace:'nowrap' }}>
                    All Topics <ArrowIcon />
                  </Link>
                </div>

                {/* Domains list */}
                <div style={{ padding:'8px 0' }}>
                  {sec.domains.map((dom, di) => (
                    <div key={dom.name} style={{ borderBottom: di < sec.domains.length-1 ? '1px solid var(--line)' : 'none' }}>

                      {/* Domain row */}
                      <Link href={`/bank?domain=${encodeURIComponent(dom.name)}`} style={{ textDecoration:'none' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px 8px', cursor:'pointer' }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'var(--tx)' }}>{dom.name}</div>
                          <div style={{ fontSize:12, color:'var(--tx4)', fontFamily:'var(--mono)', flexShrink:0, marginLeft:12 }}>
                            {dom.count.toLocaleString()} questions
                          </div>
                        </div>
                      </Link>

                      {/* Skills list */}
                      {dom.skills.length > 0 && (
                        <div style={{ paddingBottom:10 }}>
                          {dom.skills
                            .sort((a,b) => sort==='most' ? b.count-a.count : sort==='least' ? a.count-b.count : sort==='az' ? a.name.localeCompare(b.name) : sort==='za' ? b.name.localeCompare(a.name) : 0)
                            .map(sk => (
                              <Link key={sk.name} href={`/bank?skill=${encodeURIComponent(sk.name)}`} style={{ textDecoration:'none' }}>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 20px 5px 32px', cursor:'pointer', transition:'background .1s' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--sf2)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                  <div style={{ fontSize:13, color:'var(--tx2)', lineHeight:1.4 }}>{sk.name}</div>
                                  <div style={{ fontSize:11.5, color:'var(--tx4)', fontFamily:'var(--mono)', flexShrink:0, marginLeft:12 }}>
                                    {sk.count.toLocaleString()} questions
                                  </div>
                                </div>
                              </Link>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
