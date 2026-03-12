// ================================================================
// Dashboard.tsx — User analytics + recent tests
// ================================================================
'use client'

import { useEffect, useState } from 'react'

interface DomainStat {
  section: string
  domain: string
  total_attempted: number
  total_correct: number
  accuracy_pct: number
}

interface RecentTest {
  id: string
  test_type: string
  section: string
  total_questions: number
  correct_count: number
  score_pct: number
  completed_at: string
}

interface UserSummary {
  total_answered: number
  total_correct: number
  streak_days: number
}

export default function Dashboard() {
  const [stats,   setStats]   = useState<DomainStat[]>([])
  const [tests,   setTests]   = useState<RecentTest[]>([])
  const [summary, setSummary] = useState<UserSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/progress')
      .then(r => r.json())
      .then(data => {
        setStats(data.domain_stats || [])
        setTests(data.recent_tests || [])
        setSummary(data.user_summary || null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-spinner" />

  const overallAcc = summary
    ? Math.round((summary.total_correct / Math.max(summary.total_answered, 1)) * 100)
    : 0

  return (
    <div className="dashboard">
      {/* ── Summary cards ── */}
      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-value">{summary?.total_answered ?? 0}</div>
          <div className="stat-label">Questions Answered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: overallAcc >= 70 ? '#22c55e' : '#f59e0b' }}>
            {overallAcc}%
          </div>
          <div className="stat-label">Overall Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">🔥 {summary?.streak_days ?? 0}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tests.length}</div>
          <div className="stat-label">Tests Completed</div>
        </div>
      </div>

      {/* ── Domain accuracy ── */}
      <section className="dashboard-section">
        <h2>Performance by Domain</h2>
        <div className="domain-bars">
          {stats.map(s => (
            <div key={`${s.section}-${s.domain}`} className="domain-bar-row">
              <div className="domain-bar-info">
                <span className="domain-bar-name">{s.domain}</span>
                <span className="domain-bar-section">{s.section}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${s.accuracy_pct}%`,
                    background: s.accuracy_pct >= 80 ? '#22c55e' : s.accuracy_pct >= 60 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
              <span className="bar-pct">{s.accuracy_pct.toFixed(0)}%</span>
              <span className="bar-attempts">{s.total_attempted} Qs</span>
            </div>
          ))}
          {stats.length === 0 && <p className="empty-state">No data yet. Start practicing!</p>}
        </div>
      </section>

      {/* ── Recent tests ── */}
      <section className="dashboard-section">
        <h2>Recent Tests</h2>
        <div className="tests-table">
          {tests.map(t => (
            <div key={t.id} className="test-row">
              <div className="test-row-type">{t.test_type}</div>
              <div className="test-row-section">{t.section}</div>
              <div className="test-row-score">
                {t.correct_count}/{t.total_questions}
                <span className="test-row-pct"> ({t.score_pct?.toFixed(0)}%)</span>
              </div>
              <div className="test-row-date">{new Date(t.completed_at).toLocaleDateString()}</div>
            </div>
          ))}
          {tests.length === 0 && <p className="empty-state">No completed tests yet.</p>}
        </div>
      </section>
    </div>
  )
}