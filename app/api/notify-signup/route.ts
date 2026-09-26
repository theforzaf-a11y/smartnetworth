import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-webhook-secret")
    if (secret !== process.env.SIGNUP_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const record = body?.record

    const email =
      record?.email ||
      record?.raw_user_meta_data?.email ||
      "Pelanggan baru"

    const message = `🔔 SmartNetWorth - Pelanggan Baru!\n\nAda yang baru saja daftar:\n${email}\n\nSegera cek & aktifkan di halaman Kelola Pelanggan.`

    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN || "",
      },
      body: new URLSearchParams({
        target: "6289673478796",
        message,
      }),
    })

    const fonnteData = await fonnteRes.json()

    return NextResponse.json({ ok: true, fonnte: fonnteData })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Gagal mengirim notifikasi: " + error.message },
      { status: 500 },
    )
  }
}
