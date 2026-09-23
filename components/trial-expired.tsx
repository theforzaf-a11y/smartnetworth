"use client"

import { Clock, PiggyBank } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAccess } from "@/lib/access-context"

export function TrialExpired() {
  const access = useAccess()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          <Clock className="size-6" />
        </span>
        <h1 className="text-lg font-bold">Masa Trial Berakhir</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Masa coba gratis akun{" "}
          <span className="font-medium text-foreground">{access.user?.email}</span> sudah
          berakhir. Hubungi admin untuk memperpanjang akses.
        </p>
        <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <PiggyBank className="size-3.5" />
          SmartNetWorth
        </div>
        <Button variant="outline" className="mt-5 w-full" onClick={access.lock}>
          Keluar
        </Button>
      </div>
    </div>
  )
}
