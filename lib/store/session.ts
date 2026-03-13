// lib/store/session.ts
// Persistent store — saves to localStorage + syncs to Supabase when logged in.

export interface AnswerLog {
  questionId:     string
  section:        string
  domain:         string
  skill:          string
  difficulty:     string
  selectedAnswer: string
  correctAnswer:  string
  isCorrect:      boolean
  explanation:    string
  question_text:  string
  choice_a:       string
  choice_b:       string
  choice_c:       string
  choice_d:       string
  savedForReview?: boolean
}

export interface SessionStore {
  answered: AnswerLog[]
  saved:    Record<string, AnswerLog>
}

const STORAGE_KEY = 'nexus_session_v2'

function load(): SessionStore {
  if (typeof window === 'undefined') return { answered: [], saved: {} }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { answered: [], saved: {} }
}

function save(data: SessionStore) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

// Debounced DB sync — batches rapid calls
let syncTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSync(data: SessionStore) {
  if (typeof window === 'undefined') return
  const token = localStorage.getItem('nexus_token')
  if (!token) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const answers = data.answered.map(a => ({
      question_id:     a.questionId,
      section:         a.section,
      domain:          a.domain,
      skill:           a.skill,
      difficulty:      a.difficulty,
      selected_answer: a.selectedAnswer,
      correct_answer:  a.correctAnswer,
      is_correct:      a.isCorrect,
      saved_for_review: !!data.saved[a.questionId],
    }))
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers }),
    }).catch(() => {}) // Silent fail — localStorage is the source of truth
  }, 1500)
}

class Store {
  private data: SessionStore = load()
  private listeners: Set<() => void> = new Set()

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  private notify() {
    save(this.data)
    scheduleSync(this.data)
    this.listeners.forEach(fn => fn())
  }

  get(): SessionStore {
    return this.data
  }

  addAnswer(log: AnswerLog) {
    const i = this.data.answered.findIndex(a => a.questionId === log.questionId)
    if (i === -1) this.data.answered.push(log)
    else this.data.answered[i] = log
    this.notify()
  }

  toggleSaved(q: AnswerLog) {
    if (this.data.saved[q.questionId]) {
      delete this.data.saved[q.questionId]
    } else {
      this.data.saved[q.questionId] = q
    }
    this.notify()
  }

  isSaved(questionId: string): boolean {
    return !!this.data.saved[questionId]
  }

  deleteMistake(questionId: string) {
    this.data.answered = this.data.answered.filter(a => a.questionId !== questionId)
    delete this.data.saved[questionId]
    this.notify()
  }

  clearSession() {
    this.data = { answered: [], saved: {} }
    this.notify()
  }

  // Load user's history from DB after login
  async loadFromDB() {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('nexus_token')
    if (!token) return
    try {
      const res  = await fetch('/api/progress', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const rows = await res.json()
      if (!Array.isArray(rows)) return
      rows.forEach((row: any) => {
        const log: AnswerLog = {
          questionId:     row.question_id,
          section:        row.section,
          domain:         row.domain,
          skill:          row.skill,
          difficulty:     row.difficulty,
          selectedAnswer: row.selected_answer,
          correctAnswer:  row.correct_answer,
          isCorrect:      row.is_correct,
          explanation:    '',
          question_text:  '',
          choice_a: '', choice_b: '', choice_c: '', choice_d: '',
        }
        const existing = this.data.answered.findIndex(a => a.questionId === log.questionId)
        if (existing === -1) this.data.answered.push(log)
        if (row.saved_for_review) this.data.saved[log.questionId] = log
      })
      save(this.data)
      this.listeners.forEach(fn => fn())
    } catch {}
  }

  // Derived stats
  getStats() {
    const all     = this.data.answered
    const total   = all.length
    const correct = all.filter(a => a.isCorrect).length
    const wrong   = total - correct
    const acc     = total ? Math.round((correct / total) * 100) : 0

    const byDomain: Record<string, { total: number; correct: number; section: string }> = {}
    all.forEach(a => {
      const key = `${a.section}|||${a.domain}`
      if (!byDomain[key]) byDomain[key] = { total: 0, correct: 0, section: a.section }
      byDomain[key].total++
      if (a.isCorrect) byDomain[key].correct++
    })

    const bySection: Record<string, { total: number; correct: number }> = {}
    all.forEach(a => {
      const s = /math/i.test(a.section) ? 'Math' : 'English'
      if (!bySection[s]) bySection[s] = { total: 0, correct: 0 }
      bySection[s].total++
      if (a.isCorrect) bySection[s].correct++
    })

    return { total, correct, wrong, acc, byDomain, bySection }
  }

  getPredictedScore() {
    const { bySection } = this.getStats()
    const predict = (s: { total: number; correct: number } | undefined) => {
      if (!s || s.total < 10) return null
      return Math.round(200 + (s.correct / s.total) * 600)
    }
    const rw   = predict(bySection['English'])
    const math = predict(bySection['Math'])
    return { rw, math, total: rw && math ? rw + math : null }
  }
}

export const sessionStore = new Store()
