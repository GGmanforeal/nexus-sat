'use client'
// app/dashboard/page.tsx — explicit dashboard URL
// Just re-exports the home page logic since / already IS the dashboard when logged in
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [])
  return null
}
