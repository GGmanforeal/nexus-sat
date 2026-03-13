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
  useSession() // subscribe to updates
  return sessionStore.getStats()
}

export function useScore() {
  useSession()
  return sessionStore.getPredictedScore()
}