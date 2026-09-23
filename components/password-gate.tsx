"use client"

import { useState } from "react"
import { Lock, Mail, PiggyBank, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Mode = "login" | "register"

export function PasswordGate() {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setInfo("")
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.")
      return
    }
    setLoading(true)
    if (mode === "login") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (err) {
        setError(err.message === "Invalid login credentials" ? "Email atau password salah." : err.message)
      }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (err) {
        setError(err.message)
      } else {
        setInfo("Akun berhasil dibuat! Silakan masuk.")
        setMode("login")
        setPassword("")
      }
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Isi email kamu dulu, lalu tap "Lupa password?" lagi.')
      return
    }
    setError("")
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    })
    setLoading(false)
    if (err) setError(err.message)
    else setInfo("Link reset password sudah dikirim ke email kamu.")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-background to-blue-50 px-4 dark:from-indigo-950/40 dark:via-background dark:to-blue-950/30">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <PiggyBank className="size-7" />
          </span>
          <h1 className="text-xl font-bold tracking-tight">SmartNetWorth</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Masuk ke akun kamu untuk melanjutkan." : "Buat akun baru untuk mulai mencatat."}
          </p>
        </div>

        <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setError("")
              setInfo("")
            }}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
            ].join(" ")}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register")
              setError("")
              setInfo("")
            }}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              mode === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
            ].join(" ")}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <div className="relative mb-4">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Minimal 6 karakter" : "Masukkan password"}
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {mode === "login" ? (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Lupa password?
            </button>
          ) : null}

          {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
          {info ? <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">{info}</p> : null}

          <Button type="submit" size="lg" className="mt-4 w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Masuk" : "Daftar"}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {mode === "login" ? 'Belum punya akun? Tap "Daftar" di atas.' : 'Sudah punya akun? Tap "Masuk" di atas.'}
        </p>
      </div>
    </main>
  )
}
