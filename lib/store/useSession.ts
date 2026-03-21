'use client'
// lib/store/useSession.ts
import { useEffect, useState } from 'react'
import { sessionStore, SessionStore } from './session'

export function useSession(): SessionStore {
  const [snap, setSnap] = useState<SessionStore>(() => sessionStore.get())
  useEffect(() => {
    const unsub = sessionStore.subscribe(() => setSnap({ ...sessionStore.get() }))
    return () => unsub()
  }, [])
  return snap
}

export function useStats() {
  useSession()
  return sessionStore.getStats()
}

export function useScore() {
  useSession()
  return sessionStore.getPredictedScore()
}

export function useGamification() {
  useSession()
  return sessionStore.getGamification()
}

export function useTimeStats() {
  useSession()
  return sessionStore.getTimeStats()
}

export function useMistakePatterns() {
  useSession()
  return sessionStore.getMistakePatterns()
}

export function useWeakSkills(topN = 5) {
  useSession()
  return sessionStore.getWeakSkills(topN)
}

export function useAdaptiveDifficulty() {
  useSession()
  return sessionStore.getAdaptiveDifficulty()
}
