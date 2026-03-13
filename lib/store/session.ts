// lib/store/session.ts
// Persistent store — saves to localStorage so data survives page refresh / phone close

export interface AnswerLog {
  questionId: string
  section: string
  domain: string
  skill: string
  difficulty: string
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
  question_text: string
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
}

export interface SessionStore {
  answered: AnswerLog[]
  saved: Record<string, AnswerLog>
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

class Store {
  private data: SessionStore = load()
  private listeners: Set<() => void> = new Set()

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  private notify() {
    save(this.data)
    this.listeners.forEach(fn => fn())
  }

  get(): SessionStore {
    return this.data
  }

  addAnswer(log: AnswerLog) {
    // Avoid duplicate answers for same question in same session
    const exists = this.data.answered.some(a => a.questionId === log.questionId)
    if (!exists) this.data.answered.push(log)
    else {
      // Update existing entry
      const i = this.data.answered.findIndex(a => a.questionId === log.questionId)
      this.data.answered[i] = log
    }
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

  clearSession() {
    this.data = { answered: [], saved: {} }
    this.notify()
  }

  // Derived stats
  getStats() {
    const all = this.data.answered
    const total = all.length
    const correct = all.filter(a => a.isCorrect).length
    const wrong = total - correct
    const acc = total ? Math.round((correct / total) * 100) : 0

    // by domain
    const byDomain: Record<string, { total: number; correct: number; section: string }> = {}
    all.forEach(a => {
      const key = `${a.section}|||${a.domain}`
      if (!byDomain[key]) byDomain[key] = { total: 0, correct: 0, section: a.section }
      byDomain[key].total++
      if (a.isCorrect) byDomain[key].correct++
    })

    // by section
    const bySection: Record<string, { total: number; correct: number }> = {}
    all.forEach(a => {
      const s = /math/i.test(a.section) ? 'Math' : 'English'
      if (!bySection[s]) bySection[s] = { total: 0, correct: 0 }
      bySection[s].total++
      if (a.isCorrect) bySection[s].correct++
    })

    return { total, correct, wrong, acc, byDomain, bySection }
  }

  // Score prediction (simple linear: 0% → 200, 100% → 800 per section)
  getPredictedScore() {
    const { bySection } = this.getStats()
    const predict = (s: { total: number; correct: number } | undefined) => {
      if (!s || s.total < 10) return null
      return Math.round(200 + (s.correct / s.total) * 600)
    }
    const rw = predict(bySection['English'])
    const math = predict(bySection['Math'])
    return { rw, math, total: rw && math ? rw + math : null }
  }
}

export const sessionStore = new Store()