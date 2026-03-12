// ================================================================
// PracticeTest.tsx — Core Question-by-Question Test Component
// Usage: <PracticeTest testId="uuid" questions={[...]} />
// ================================================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'  // browser client

// ── Types ────────────────────────────────────────────────────────
interface Question {
  id: string
  section: string
  domain: string
  skill: string
  difficulty: 'easy' | 'medium' | 'hard'
  question_text: string
  passage_text: string | null
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
  has_image: boolean
  image_url: string | null
}

interface AnswerResult {
  is_correct: boolean
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string
  choices: Record<string, string>
}

interface PracticeTestProps {
  testId: string
  questions: Question[]
  onComplete?: (score: number, total: number) => void
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D'] as const
const DIFFICULTY_COLOR = {
  easy:   '#22c55e',
  medium: '#f59e0b',
  hard:   '#ef4444',
}

// ── Main Component ───────────────────────────────────────────────
export default function PracticeTest({ testId, questions, onComplete }: PracticeTestProps) {
  const supabase = createClient()

  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [selected,    setSelected]    = useState<string | null>(null)
  const [result,      setResult]      = useState<AnswerResult | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [score,       setScore]       = useState(0)
  const [answers,     setAnswers]     = useState<Record<string, string>>({})
  const [isComplete,  setIsComplete]  = useState(false)
  const [isFlagged,   setIsFlagged]   = useState(false)
  const [elapsed,     setElapsed]     = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const questionStartRef = useRef<number>(Date.now())

  const current = questions[currentIdx]
  const total   = questions.length
  const progress = ((currentIdx) / total) * 100

  // ── Per-question timer ────────────────────────────────────────
  useEffect(() => {
    questionStartRef.current = Date.now()
    setElapsed(0)
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - questionStartRef.current) / 1000))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentIdx])

  // ── Submit answer ─────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!selected || submitting || result) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000)

    try {
      const res = await fetch(`/api/tests/${testId}/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          question_id:     current.id,
          selected_answer: selected,
          time_spent_secs: timeSpent,
          is_flagged:      isFlagged,
        }),
      })
      const data: AnswerResult = await res.json()
      setResult(data)
      setAnswers(prev => ({ ...prev, [current.id]: selected }))
      if (data.is_correct) setScore(s => s + 1)
    } catch (err) {
      console.error('Submit failed:', err)
    } finally {
      setSubmitting(false)
    }
  }, [selected, submitting, result, testId, current, isFlagged])

  // ── Next question ─────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= total) {
      setIsComplete(true)
      onComplete?.(score + (result?.is_correct ? 1 : 0), total)
    } else {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setResult(null)
      setIsFlagged(false)
    }
  }, [currentIdx, total, score, result, onComplete])

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (result) {
        if (e.key === 'Enter' || e.key === 'ArrowRight') handleNext()
        return
      }
      const map: Record<string, string> = { '1':'A','2':'B','3':'C','4':'D','a':'A','b':'B','c':'C','d':'D' }
      if (map[e.key]) setSelected(map[e.key])
      if (e.key === 'Enter' && selected) handleSubmit()
      if (e.key === 'f') setIsFlagged(f => !f)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [result, selected, handleSubmit, handleNext])

  // ── Complete screen ───────────────────────────────────────────
  if (isComplete) {
    const finalScore = score
    const pct        = Math.round((finalScore / total) * 100)
    return (
      <div className="test-complete">
        <div className="complete-card">
          <div className="complete-emoji">{pct >= 80 ? '🎉' : pct >= 60 ? '📚' : '💪'}</div>
          <h2>Test Complete!</h2>
          <div className="score-display">
            <span className="score-num">{finalScore}</span>
            <span className="score-sep">/</span>
            <span className="score-total">{total}</span>
          </div>
          <div className="score-pct" style={{ color: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444' }}>
            {pct}% correct
          </div>
          <p className="score-msg">
            {pct >= 80 ? 'Excellent work! Keep it up.' : pct >= 60 ? 'Good effort! Review your mistakes.' : 'Keep practicing — you\'ll get there!'}
          </p>
          <button className="btn-primary" onClick={() => window.location.href = '/dashboard'}>
            View Dashboard →
          </button>
        </div>
      </div>
    )
  }

  const choices = [
    { label: 'A', text: current.choice_a },
    { label: 'B', text: current.choice_b },
    { label: 'C', text: current.choice_c },
    { label: 'D', text: current.choice_d },
  ]

  const getChoiceState = (label: string) => {
    if (!result) return selected === label ? 'selected' : 'default'
    if (label === result.correct_answer) return 'correct'
    if (label === selected && !result.is_correct) return 'wrong'
    return 'default'
  }

  const formatTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="practice-test">
      {/* ── Progress bar ── */}
      <div className="test-header">
        <div className="test-meta">
          <span className="section-badge" data-section={current.section}>{current.section}</span>
          <span className="domain-label">{current.domain}</span>
          <span className="difficulty-dot" style={{ background: DIFFICULTY_COLOR[current.difficulty] }} />
          <span className="difficulty-label">{current.difficulty}</span>
        </div>
        <div className="test-nav">
          <span className="question-counter">{currentIdx + 1} / {total}</span>
          <span className="timer" data-warning={elapsed > 90}>{formatTime(elapsed)}</span>
          <button
            className={`flag-btn ${isFlagged ? 'flagged' : ''}`}
            onClick={() => setIsFlagged(f => !f)}
            title="Flag for review (F)"
          >
            {isFlagged ? '🚩' : '⚑'}
          </button>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Main content ── */}
      <div className="question-layout">
        {/* Passage (if present) */}
        {current.passage_text && (
          <div className="passage-panel">
            <div className="passage-label">PASSAGE</div>
            <div className="passage-text">{current.passage_text}</div>
          </div>
        )}

        {/* Question panel */}
        <div className={`question-panel ${current.passage_text ? 'with-passage' : 'full-width'}`}>
          {/* Skill breadcrumb */}
          <div className="skill-crumb">{current.skill}</div>

          {/* Question text */}
          <div className="question-text">{current.question_text}</div>

          {/* Image (if present) */}
          {current.has_image && current.image_url && (
            <div className="question-image">
              <img src={current.image_url} alt="Question figure" />
            </div>
          )}

          {/* Answer choices */}
          <div className="choices-list">
            {choices.map(({ label, text }) => {
              const state = getChoiceState(label)
              return (
                <button
                  key={label}
                  className={`choice-btn choice-${state}`}
                  onClick={() => !result && setSelected(label)}
                  disabled={!!result}
                >
                  <span className="choice-label">{label}</span>
                  <span className="choice-text">{text}</span>
                  {state === 'correct' && <span className="choice-icon">✓</span>}
                  {state === 'wrong'   && <span className="choice-icon">✗</span>}
                </button>
              )
            })}
          </div>

          {/* Submit / Next */}
          {!result ? (
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={!selected || submitting}
            >
              {submitting ? 'Checking…' : 'Submit Answer'}
            </button>
          ) : (
            <div className="result-panel" data-correct={result.is_correct}>
              <div className="result-header">
                <span className="result-icon">{result.is_correct ? '✓' : '✗'}</span>
                <span className="result-text">
                  {result.is_correct ? 'Correct!' : `Incorrect — correct answer is ${result.correct_answer}`}
                </span>
              </div>
              {result.explanation && (
                <div className="explanation">{result.explanation}</div>
              )}
              <button className="btn-next" onClick={handleNext}>
                {currentIdx + 1 < total ? 'Next Question →' : 'See Results'}
              </button>
            </div>
          )}

          {/* Keyboard hints */}
          <div className="keyboard-hints">
            Press <kbd>A</kbd>–<kbd>D</kbd> to select · <kbd>Enter</kbd> to submit · <kbd>F</kbd> to flag
          </div>
        </div>
      </div>
    </div>
  )
}