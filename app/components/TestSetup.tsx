// ================================================================
// TestSetup.tsx — Practice Mode Selection Screen
// ================================================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MATH_DOMAINS = [
  'Algebra',
  'Advanced Math',
  'Problem Solving and Data Analysis',
  'Geometry and Trigonometry',
]

const EBRW_DOMAINS = [
  'Craft and Structure',
  'Information and Ideas',
  'Expression of Ideas',
  'Standard English Conventions',
]

export default function TestSetup() {
  const router = useRouter()
  const [mode,       setMode]       = useState<'full' | 'section' | 'domain' | 'adaptive'>('section')
  const [section,    setSection]    = useState<'Math' | 'EBRW' | 'Both'>('Both')
  const [domain,     setDomain]     = useState<string>('')
  const [difficulty, setDifficulty] = useState<string>('mixed')
  const [count,      setCount]      = useState(10)
  const [loading,    setLoading]    = useState(false)

  const domains = section === 'Math' ? MATH_DOMAINS : section === 'EBRW' ? EBRW_DOMAINS : [...MATH_DOMAINS, ...EBRW_DOMAINS]

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type:  mode,
          section:    mode === 'full' ? 'Both' : section,
          domain:     domain || undefined,
          difficulty: difficulty === 'mixed' ? undefined : difficulty,
          count:      mode === 'full' ? 98 : count,
        }),
      })
      const data = await res.json()
      if (data.test_id) {
        router.push(`/test/${data.test_id}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="setup-container">
      <h1 className="setup-title">Start Practicing</h1>

      {/* ── Mode selection ── */}
      <section className="setup-section">
        <h2>Practice Mode</h2>
        <div className="mode-grid">
          {[
            { key: 'full',     label: '📋 Full SAT',      desc: '98 questions · ~3h' },
            { key: 'section',  label: '📐 By Section',    desc: 'Math or EBRW only' },
            { key: 'domain',   label: '🎯 By Domain',     desc: 'Focus on one topic' },
            { key: 'adaptive', label: '🧠 Adaptive',      desc: 'Target your weak spots' },
          ].map(m => (
            <button
              key={m.key}
              className={`mode-card ${mode === m.key ? 'active' : ''}`}
              onClick={() => setMode(m.key as typeof mode)}
            >
              <span className="mode-label">{m.label}</span>
              <span className="mode-desc">{m.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Section filter ── */}
      {mode !== 'full' && mode !== 'adaptive' && (
        <section className="setup-section">
          <h2>Section</h2>
          <div className="toggle-group">
            {(['Both', 'Math', 'EBRW'] as const).map(s => (
              <button
                key={s}
                className={`toggle-btn ${section === s ? 'active' : ''}`}
                onClick={() => { setSection(s); setDomain('') }}
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Domain filter ── */}
      {mode === 'domain' && (
        <section className="setup-section">
          <h2>Domain</h2>
          <div className="domain-list">
            {domains.map(d => (
              <button
                key={d}
                className={`domain-btn ${domain === d ? 'active' : ''}`}
                onClick={() => setDomain(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Difficulty ── */}
      {mode !== 'full' && mode !== 'adaptive' && (
        <section className="setup-section">
          <h2>Difficulty</h2>
          <div className="toggle-group">
            {[
              { key: 'mixed',  label: '🎲 Mixed'  },
              { key: 'easy',   label: '🟢 Easy'   },
              { key: 'medium', label: '🟡 Medium' },
              { key: 'hard',   label: '🔴 Hard'   },
            ].map(d => (
              <button
                key={d.key}
                className={`toggle-btn ${difficulty === d.key ? 'active' : ''}`}
                onClick={() => setDifficulty(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Question count ── */}
      {mode !== 'full' && (
        <section className="setup-section">
          <h2>Number of Questions: <strong>{count}</strong></h2>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="count-slider"
          />
          <div className="slider-labels">
            <span>5</span><span>10</span><span>20</span><span>30</span><span>50</span>
          </div>
        </section>
      )}

      <button
        className="btn-start"
        onClick={handleStart}
        disabled={loading || (mode === 'domain' && !domain)}
      >
        {loading ? 'Building test…' : `Start ${mode === 'full' ? 'Full SAT' : 'Practice'} →`}
      </button>
    </div>
  )
}


