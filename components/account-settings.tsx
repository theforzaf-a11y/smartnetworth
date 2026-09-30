"use client"

import { useEffect, useState } from "react"
import { X, Settings, KeyRound, Lock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAccess } from "@/lib/access-context"
import { supabase } from "@/lib/supabase"

interface AccountSettingsProps {
  onClose: () => void
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20"

/**
 * Pengaturan yang boleh diatur sendiri oleh pemilik akun (pelanggan) — tanpa
 * perlu Master Admin Password, karena sesi login mereka sendiri sudah cukup
 * membuktikan ini akun mereka.
 */
export function AccountSettings({ onClose }: AccountSettingsProps) {
  const { editPin, setEditPin } = useAccess()

  const [newPassword, setNewPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [editPinInput, setEditPinInput] = useState(editPin)
  const [editPinError, setEditPinError] = useState("")
  const [savedMsg, setSavedMsg] = useState("")

  useEffect(() => {
    setEditPinInput(editPin)
  }, [editPin])

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

  function handleSaveEditPin(e: React.FormEvent) {
    e.preventDefault()
    const pin = editPinInput.trim()
    if (pin.length < 4) {
      setEditPinError("PIN Edit minimal 4 karakter.")
      return
    }
    setEditPinError("")
    setEditPin(pin)
    flash("PIN Edit berhasil disimpan.")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Pengaturan Akun Saya"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400">
              <Settings className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight">Pengaturan Akun Saya</h2>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Password login &amp; PIN Edit akun Anda
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Tutup" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

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
            {passwordError ? <p className="text-xs text-destructive">{passwordError}</p> : null}
            <Button type="submit" variant="outline" className="w-full" disabled={passwordSaving}>
              {passwordSaving ? "Menyimpan..." : "Simpan Password Akun"}
            </Button>
          </form>

          <div className="h-px bg-border" />

          {/* PIN Edit — Mode Edit */}
          <form onSubmit={handleSaveEditPin} className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-rose-600 dark:text-rose-400" />
              <h3 className="text-sm font-semibold">PIN Edit (Mode Edit)</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Default semua device dalam <span className="font-medium text-foreground">Mode Lihat Saja</span>.
              Siapa pun yang tahu PIN ini bisa mengaktifkan Mode Edit di device mereka lewat ikon
              gembok di header untuk mencatat/mengubah data. Bagikan PIN ini hanya ke staf yang
              bertanggung jawab menginput data.
            </p>
            <input
              type="text"
              autoComplete="off"
              value={editPinInput}
              onChange={(e) => {
                setEditPinInput(e.target.value)
                if (editPinError) setEditPinError("")
              }}
              placeholder="PIN Edit (min. 4 karakter)"
              aria-invalid={!!editPinError}
              className={inputClass}
            />
            {editPinError ? <p className="text-xs text-destructive">{editPinError}</p> : null}
            <Button type="submit" variant="outline" className="w-full">
              Simpan PIN Edit
            </Button>
          </form>

          {savedMsg ? (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              {savedMsg}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
