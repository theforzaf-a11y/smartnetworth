import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Harus sama persis dengan MASTER_ADMIN_PASSWORD di lib/access-context.tsx
const ADMIN_SECRET = "ADMIN-SMART2026"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function isAuthed(req: NextRequest) {
  return req.headers.get("x-admin-key") === ADMIN_SECRET
}

function addPeriod(startDate: string, cycle: "bulanan" | "tahunan") {
  const d = new Date(startDate)
  if (cycle === "tahunan") {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  return d.toISOString()
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseAdmin = getAdminClient()

  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, trial_ends_at, is_blocked")
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

  const customers = usersData.users
    .map((u) => {
      const p = profileMap.get(u.id) as any
      return {
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        trialEndsAt: p?.trial_ends_at ?? null,
        isBlocked: p?.is_blocked ?? false,
      }
    })
    .sort((a, b) => {
      const at = a.trialEndsAt ? new Date(a.trialEndsAt).getTime() : -Infinity
      const bt = b.trialEndsAt ? new Date(b.trialEndsAt).getTime() : -Infinity
      return at - bt
    })

  return NextResponse.json({ customers })
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const supabaseAdmin = getAdminClient()

  if (body.action === "extend") {
    const { userId, startDate, cycle } = body
    if (!userId || !startDate || !cycle) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }
    const trialEndsAt = addPeriod(startDate, cycle)
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ trial_ends_at: trialEndsAt, is_blocked: false })
      .eq("id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, trialEndsAt })
  }

  if (body.action === "block" || body.action === "unblock") {
    const { userId } = body
    if (!userId) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_blocked: body.action === "block" })
      .eq("id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 })
}
