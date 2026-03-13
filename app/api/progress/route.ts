// app/api/progress/route.ts
// Syncs user progress (answers, saved) to Supabase user_progress table.
// POST  — save/upsert a batch of answer logs
// GET   — fetch all progress for the authenticated user

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://cxeeqxxvuyrhlpindljk.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZWVxeHh2dXlyaGxwaW5kbGprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE1MzE3MSwiZXhwIjoyMDg4NzI5MTcxfQ.4XJe77ZIMV0kRKdwjIpvCvtH-er_jlCD_Ui_irs23zM'

function authHeaders(token: string) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }
}

async function getUserId(token: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return data?.id ?? null
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const userId = await getUserId(token)
  if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const params = new URLSearchParams({ user_id: `eq.${userId}`, limit: '2000', select: '*' })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_progress?${params}`, {
    headers: authHeaders(token),
  })
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const userId = await getUserId(token)
  if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await req.json()
  const rows = (body.answers ?? []).map((a: any) => ({ ...a, user_id: userId }))

  if (!rows.length) return NextResponse.json({ ok: true })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_progress`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }
  return NextResponse.json({ ok: true, count: rows.length })
}
