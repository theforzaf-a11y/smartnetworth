"use client"

import { useState } from "react"
import { Lock, PiggyBank, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 6) {
      setError("Password minimal 6 karakter.")
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) setError(err.message)
    else setDone(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-background to-blue-50 px-4 dark:from-indigo-950/40 dark:via-background dark:to-blue-950/30">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <PiggyBank className="size-7" />
          </span>
          <h1 className="text-xl font-bold tracking-tight">SmartNetWorth</h1>
          <p className="mt-1 text-sm text-muted-foreground">Buat password baru untuk akun kamu.</p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-500" />
            <p className="text-sm">Password berhasil diubah. Silakan buka aplikasi dan masuk kembali.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium">
              Password Baru
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="new-password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
              />
            </div>
            {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
            <Button type="submit" size="lg" className="mt-4 w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
