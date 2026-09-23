"use client"

import { useEffect, useState } from "react"
import { X, ShieldCheck, KeyRound, Gauge, Mic, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAccess } from "@/lib/access-context"
import { supabase } from "@/lib/supabase"

interface AdminSettingsProps {
  onClose: () => void
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20"

export function AdminSettings({ onClose }: AdminSettingsProps) {
  const {
    verifyMaster,
    scanQuota,
    maxScanQuota,
    setScanQuota,
    resetScanQuota,
    voiceQuota,
    maxVoiceQuota,
    setVoiceQuota,
    resetVoiceQuota,
  } = useAccess()

  const [authed, setAuthed] = useState(false)
  const [master, setMaster] = useState("")
  const [masterError, setMasterError] = useState(false)

  const [newPassword, setNewPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [quotaInput, setQuotaInput] = useState(String(scanQuota))
  const [voiceQuotaInput, setVoiceQuotaInput] = useState(String(voiceQuota))
  const [savedMsg, setSavedMsg] = useState("")

  useEffect(() => {
    setQuotaInput(String(scanQuota))
  }, [scanQuota])

  useEffect(() => {
    setVoiceQuotaInput(String(voiceQuota))
  }, [voiceQuota])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  function flash(msg: string) {
    setSavedMsg(msg)
    window.setTimeout(() => setSavedMsg(""), 2000)
  }

  function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    if (verifyMaster(master)) {
      setAuthed(true)
      setMasterError(false)
    } else {
      setMasterError(true)
      setMaster("")
    }
  }

  async function handleSaveAccountPassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.trim().length < 6) {
      setPasswordError("Password minimal 6 karakter.")
      return
    }
    setPasswordSaving(true)
    setPasswordError("")
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) {
      setPasswordError(error.message)
      return
    }
    setNewPassword("")
    flash("Password akun berhasil diperbarui.")
  }

  function handleSaveQuota(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(quotaInput)
    if (!Number.isFinite(n)) return
    setScanQuota(n)
    flash("Kuota scan berhasil disimpan.")
  }

  function handleSaveVoiceQuota(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(voiceQuotaInput)
    if (!Number.isFinite(n)) return
    setVoiceQuota(n)
    flash("Kuota suara berhasil disimpan.")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Pengaturan Akses Admin"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight">Pengaturan Akses Admin</h2>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Khusus pemilik aplikasi
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Tutup" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {!authed ? (
          <form onSubmit={handleAuth} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Masukkan Master Admin Password untuk membuka pengaturan.
            </p>
            <input
              type="password"
              autoFocus
              autoComplete="off"
              value={master}
              onChange={(e) => {
                setMaster(e.target.value)
                if (masterError) setMasterError(false)
              }}
              placeholder="Master Admin Password"
              aria-invalid={masterError}
              className={inputClass}
            />
            {masterError ? (
              <p className="text-xs text-destructive">Password admin salah.</p>
            ) : null}
            <Button type="submit" size="lg" className="w-full">
              Verifikasi
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Change account password */}
            <form onSubmit={handleSaveAccountPassword} className="space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold">Ubah Password Akun</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Mengubah password login akun Anda yang sedang aktif saat ini.
              </p>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (passwordError) setPasswordError("")
                }}
                placeholder="Password baru (min. 6 karakter)"
                aria-invalid={!!passwordError}
                className={inputClass}
              />
              {passwordError ? (
                <p className="text-xs text-destructive">{passwordError}</p>
              ) : null}
              <Button type="submit" variant="outline" className="w-full" disabled={passwordSaving}>
                {passwordSaving ? "Menyimpan..." : "Simpan Password Akun"}
              </Button>
            </form>

            <div className="h-px bg-border" />

            {/* Scan quota */}
            <form onSubmit={handleSaveQuota} className="space-y-2">
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold">Kuota Scan Struk (Foto)</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Sisa kuota saat ini: <span className="font-semibold text-foreground">{scanQuota}</span> / {maxScanQuota}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={maxScanQuota}
                  value={quotaInput}
                  onChange={(e) => setQuotaInput(e.target.value)}
                  className={inputClass}
                />
                <Button type="submit" variant="outline" className="shrink-0">
                  Simpan
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  resetScanQuota()
                  flash("Kuota scan direset ke maksimum.")
                }}
              >
                Reset Kuota ke {maxScanQuota}
              </Button>
            </form>

            <div className="h-px bg-border" />

            {/* Voice quota */}
            <form onSubmit={handleSaveVoiceQuota} className="space-y-2">
              <div className="flex items-center gap-2">
                <Mic className="size-4 text-violet-600 dark:text-violet-400" />
                <h3 className="text-sm font-semibold">Kuota Catat Suara</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Sisa kuota saat ini: <span className="font-semibold text-foreground">{voiceQuota}</span> / {maxVoiceQuota}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={maxVoiceQuota}
                  value={voiceQuotaInput}
                  onChange={(e) => setVoiceQuotaInput(e.target.value)}
                  className={inputClass}
                />
                <Button type="submit" variant="outline" className="shrink-0">
                  Simpan
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  resetVoiceQuota()
                  flash("Kuota suara direset ke maksimum.")
                }}
              >
                Reset Kuota ke {maxVoiceQuota}
              </Button>
            </form>

            {savedMsg ? (
              <p className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                {savedMsg}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
