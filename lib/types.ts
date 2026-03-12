// lib/types.ts
export interface Question {
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
  correct_answer: string
  explanation: string
  has_image?: boolean
  image_url?: string | null
}

export interface DomainStat {
  section: string
  domain: string
  total_attempted: number
  total_correct: number
  accuracy_pct: number
}

export interface PracticeTest {
  id: string
  test_type: string
  section: string
  domain?: string
  difficulty?: string
  question_ids: string[]
  total_questions: number
  correct_count?: number
  score_pct?: number
  status: 'in_progress' | 'completed'
  started_at: string
  completed_at?: string
}

export interface TreeDomain {
  name: string
  count: number
  children: { name: string; count: number }[]
}

export interface TreeData {
  English: TreeDomain[]
  Math: TreeDomain[]
}