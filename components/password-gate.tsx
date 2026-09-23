"use client"

import { useState } from "react"
import { Lock, Mail, PiggyBank, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

type Mode = "login" | "register"

export function PasswordGate() {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        setInfo("Akun berhasil dibuat! Anda sudah bisa langsung masuk.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError(null)
    setInfo(null)
    if (!email) {
      setError("Isi email terlebih dahulu untuk reset password.")
      return
    }
    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setInfo("Link reset password sudah dikirim ke email Anda.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim email reset.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400">
            <PiggyBank className="size-6" />
          </span>
          <h1 className="text-lg font-bold">SmartNetWorth</h1>
          <p className="text-xs text-muted-foreground">
            Masuk atau daftar untuk mulai mencatat keuangan Anda
          </p>
        </div>

        <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setError(null)
              setInfo(null)
            }}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register")
              setError(null)
              setInfo(null)
            }}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              mode === "register"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password (min. 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error ? <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}
          {info ? <p className="text-xs text-emerald-600 dark:text-emerald-400">{info}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "login" ? (
              "Masuk"
            ) : (
              "Daftar"
            )}
          </Button>

          {mode === "login" ? (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Lupa password?
            </button>
          ) : null}
        </form>
      </div>
    </div>
  )
}
