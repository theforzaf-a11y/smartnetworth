"use client"

import { useState } from "react"
import { Lock, PiggyBank, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAccess } from "@/lib/access-context"

export function PasswordGate() {
  const { unlock } = useAccess()
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (unlock(value)) {
      setError(false)
    } else {
      setError(true)
      setValue("")
    }
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
            Aplikasi terkunci. Masukkan kode akses untuk melanjutkan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <label htmlFor="passcode" className="mb-2 block text-sm font-medium">
            Kode Akses
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="passcode"
              type="password"
              autoFocus
              autoComplete="off"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (error) setError(false)
              }}
              placeholder="Masukkan kode akses"
              aria-invalid={error}
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
            />
          </div>

          {error ? (
            <p className="mt-2 text-xs text-destructive">Kode akses salah. Silakan coba lagi.</p>
          ) : null}

          <Button type="submit" size="lg" className="mt-4 w-full">
            Buka Aplikasi
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Hubungi Admin SmartNetWorth jika Anda lupa kode akses.
        </p>
      </div>
    </main>
  )
}
