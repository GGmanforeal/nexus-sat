// lib/store/session.ts  — Nexus v4: XP · streaks · time tracking · adaptive difficulty
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
  timeMs?:        number   // time taken to answer in ms
  mistakeType?:   'careless' | 'concept'  // tagged later
  answeredAt?:    number   // epoch ms
}

export interface GamificationData {
  xp:             number
  level:          number
  streak:         number          // consecutive days practiced
  lastPracticed:  string | null   // ISO date string YYYY-MM-DD
  longestStreak:  number
  totalDays:      number
}

export interface SessionStore {
  answered: AnswerLog[]
  saved:    Record<string, AnswerLog>
  gamification: GamificationData
}

const STORAGE_KEY = 'nexus_session_v2'

const DEFAULT_GAMIFICATION: GamificationData = {
  xp: 0, level: 1, streak: 0,
  lastPracticed: null, longestStreak: 0, totalDays: 0,
}

// XP per action
export const XP_RULES = {
  correct:       15,
  incorrect:     3,   // still learn
  correctHard:   25,  // hard question bonus
  correctMed:    18,
  streak3:       10,  // streak bonus every 3 questions correct in a row
}

// Level thresholds
export const LEVELS = [
  { level: 1, name: 'Beginner',       minXp: 0     },
  { level: 2, name: 'Explorer',       minXp: 200   },
  { level: 3, name: 'Practitioner',   minXp: 500   },
  { level: 4, name: 'Challenger',     minXp: 1000  },
  { level: 5, name: 'Proficient',     minXp: 1800  },
  { level: 6, name: 'Advanced',       minXp: 3000  },
  { level: 7, name: 'Expert',         minXp: 5000  },
  { level: 8, name: '1400+ Scholar',  minXp: 8000  },
  { level: 9, name: '1500+ Elite',    minXp: 12000 },
  { level: 10, name: '1600 Legend',   minXp: 18000 },
]

export function getLevelInfo(xp: number) {
  let current = LEVELS[0]
  let next    = LEVELS[1]
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      current = LEVELS[i]
      next    = LEVELS[i + 1] || LEVELS[i]
      break
    }
  }
  const progressXp  = xp - current.minXp
  const neededXp    = next.minXp - current.minXp
  const pct         = next === current ? 100 : Math.min(100, Math.round((progressXp / neededXp) * 100))
  return { current, next, progressXp, neededXp, pct, isMax: next === current }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function load(): SessionStore {
  if (typeof window === 'undefined') return { answered: [], saved: {}, gamification: { ...DEFAULT_GAMIFICATION } }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (!parsed.gamification) parsed.gamification = { ...DEFAULT_GAMIFICATION }
      return parsed
    }
  } catch {}
  return { answered: [], saved: {}, gamification: { ...DEFAULT_GAMIFICATION } }
}

function save(data: SessionStore) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

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
    }).catch(() => {})
  }, 1500)
}

class Store {
  private data: SessionStore = load()
  private listeners: Set<() => void> = new Set()
  private correctStreak = 0  // in-session streak for bonus XP

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  private notify() {
    save(this.data)
    scheduleSync(this.data)
    this.listeners.forEach(fn => fn())
  }

  get(): SessionStore { return this.data }

  addAnswer(log: AnswerLog) {
    log.answeredAt = Date.now()
    const i = this.data.answered.findIndex(a => a.questionId === log.questionId)
    if (i === -1) this.data.answered.push(log)
    else this.data.answered[i] = log

    // XP calculation
    let xpGain = log.isCorrect
      ? (log.difficulty === 'hard' ? XP_RULES.correctHard : log.difficulty === 'medium' ? XP_RULES.correctMed : XP_RULES.correct)
      : XP_RULES.incorrect

    // Streak bonus
    if (log.isCorrect) {
      this.correctStreak++
      if (this.correctStreak % 3 === 0) xpGain += XP_RULES.streak3
    } else {
      this.correctStreak = 0
    }

    // Auto-tag mistake type: careless if >avg time, concept if fast
    if (!log.isCorrect && log.timeMs !== undefined) {
      const avgTime = this.getAvgTimeMs()
      log.mistakeType = log.timeMs > avgTime * 1.2 ? 'careless' : 'concept'
    }

    // Update XP + level
    const g = this.data.gamification
    g.xp += xpGain
    g.level = getLevelInfo(g.xp).current.level

    // Daily streak
    const today = todayStr()
    if (g.lastPracticed !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = yesterday.toISOString().split('T')[0]
      if (g.lastPracticed === yStr) {
        g.streak++
      } else if (g.lastPracticed !== today) {
        g.streak = 1
      }
      g.longestStreak = Math.max(g.longestStreak, g.streak)
      g.lastPracticed = today
      g.totalDays++
    }

    this.notify()
    return xpGain
  }

  toggleSaved(q: AnswerLog) {
    if (this.data.saved[q.questionId]) delete this.data.saved[q.questionId]
    else this.data.saved[q.questionId] = q
    this.notify()
  }

  isSaved(questionId: string): boolean { return !!this.data.saved[questionId] }

  deleteMistake(questionId: string) {
    this.data.answered = this.data.answered.filter(a => a.questionId !== questionId)
    delete this.data.saved[questionId]
    this.notify()
  }

  tagMistake(questionId: string, type: 'careless' | 'concept') {
    const i = this.data.answered.findIndex(a => a.questionId === questionId)
    if (i !== -1) { this.data.answered[i].mistakeType = type; this.notify() }
  }

  clearSession() {
    this.data = { answered: [], saved: {}, gamification: { ...DEFAULT_GAMIFICATION } }
    this.notify()
  }

  getGamification() { return this.data.gamification }

  getAvgTimeMs(): number {
    const timed = this.data.answered.filter(a => a.timeMs !== undefined)
    if (!timed.length) return 60000
    return timed.reduce((s, a) => s + (a.timeMs || 0), 0) / timed.length
  }

  getTimeStats() {
    const timed = this.data.answered.filter(a => a.timeMs !== undefined)
    if (!timed.length) return { avg: null, byDifficulty: {}, bySkill: {} }
    const avg = Math.round(this.getAvgTimeMs() / 1000)
    const byDifficulty: Record<string, number[]> = {}
    const bySkill: Record<string, number[]> = {}
    timed.forEach(a => {
      const t = (a.timeMs || 0) / 1000
      if (!byDifficulty[a.difficulty]) byDifficulty[a.difficulty] = []
      byDifficulty[a.difficulty].push(t)
      if (!bySkill[a.skill]) bySkill[a.skill] = []
      bySkill[a.skill].push(t)
    })
    const meanArr = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)
    return {
      avg,
      byDifficulty: Object.fromEntries(Object.entries(byDifficulty).map(([k, v]) => [k, meanArr(v)])),
      bySkill: Object.fromEntries(Object.entries(bySkill).map(([k, v]) => [k, meanArr(v)])),
    }
  }

  getMistakePatterns() {
    const wrong = this.data.answered.filter(a => !a.isCorrect)
    const careless = wrong.filter(a => a.mistakeType === 'careless').length
    const concept  = wrong.filter(a => a.mistakeType === 'concept').length
    const untagged = wrong.length - careless - concept
    return { total: wrong.length, careless, concept, untagged }
  }

  // Adaptive difficulty recommendation
  getAdaptiveDifficulty(): 'easy' | 'medium' | 'hard' {
    const recent = this.data.answered.slice(-20)
    if (recent.length < 5) return 'easy'
    const recentAcc = recent.filter(a => a.isCorrect).length / recent.length
    if (recentAcc >= 0.80) return 'hard'
    if (recentAcc >= 0.60) return 'medium'
    return 'easy'
  }

  // Weak skills (sorted by accuracy, worst first)
  getWeakSkills(topN = 5) {
    const bySkill: Record<string, { total: number; correct: number }> = {}
    this.data.answered.forEach(a => {
      if (!bySkill[a.skill]) bySkill[a.skill] = { total: 0, correct: 0 }
      bySkill[a.skill].total++
      if (a.isCorrect) bySkill[a.skill].correct++
    })
    return Object.entries(bySkill)
      .filter(([, v]) => v.total >= 3)
      .map(([skill, v]) => ({ skill, ...v, acc: Math.round((v.correct / v.total) * 100) }))
      .sort((a, b) => a.acc - b.acc)
      .slice(0, topN)
  }

  async loadFromDB() {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('nexus_token')
    if (!token) return
    try {
      const res  = await fetch('/api/progress', { headers: { Authorization: `Bearer ${token}` } })
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
          explanation: '', question_text: '',
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
