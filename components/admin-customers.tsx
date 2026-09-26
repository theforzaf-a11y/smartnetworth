"use client"

import { useEffect, useState } from "react"
import { X, Users, Search, CheckCircle2, AlertTriangle, Ban, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAccess } from "@/lib/access-context"

interface AdminCustomersProps {
  onClose: () => void
}

interface Customer {
  id: string
  email: string | null
  createdAt: string
  trialEndsAt: string | null
  isBlocked: boolean
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"

function daysLeft(trialEndsAt: string | null) {
  if (!trialEndsAt) return null
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function StatusBadge({ customer }: { customer: Customer }) {
  if (customer.isBlocked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
        <Ban className="size-3" /> Diblokir
      </span>
    )
  }
  const left = daysLeft(customer.trialEndsAt)
  if (left === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        Belum diatur
      </span>
    )
  }
  if (left < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
        <AlertTriangle className="size-3" /> Kadaluarsa
      </span>
    )
  }
  if (left <= 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
        <AlertTriangle className="size-3" /> H-{left}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
      <CheckCircle2 className="size-3" /> Aktif
    </span>
  )
}

export function AdminCustomers({ onClose }: AdminCustomersProps) {
  const { verifyMaster } = useAccess()

  const [authed, setAuthed] = useState(false)
  const [master, setMaster] = useState("")
  const [masterError, setMasterError] = useState(false)

  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [cycle, setCycle] = useState<"bulanan" | "tahunan">("bulanan")
  const [saving, setSaving] = useState(false)
  const [flash, setFlashMsg] = useState("")

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  async function loadCustomers() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/customers", {
        headers: { "x-admin-key": master },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memuat data")
      setCustomers(data.customers)
    } catch (e: any) {
      setError(e.message || "Gagal memuat data")
    } finally {
      setLoading(false)
    }
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

  useEffect(() => {
    if (authed) loadCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  function showFlash(msg: string) {
    setFlashMsg(msg)
    window.setTimeout(() => setFlashMsg(""), 2200)
  }

  async function handleExtend(userId: string) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": master },
        body: JSON.stringify({ action: "extend", userId, startDate, cycle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan")
      showFlash("Langganan berhasil diperbarui.")
      setEditingId(null)
      loadCustomers()
    } catch (e: any) {
      setError(e.message || "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleBlock(userId: string, block: boolean) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": master },
        body: JSON.stringify({ action: block ? "block" : "unblock", userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan")
      showFlash(block ? "Pelanggan diblokir." : "Blokir dibuka.")
      loadCustomers()
    } catch (e: any) {
      setError(e.message || "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const filtered = customers.filter((c) =>
    (c.email || "").toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Kelola Pelanggan"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400">
              <Users className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight">Kelola Pelanggan</h2>
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
              Masukkan Master Admin Password untuk membuka daftar pelanggan.
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
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari email pelanggan..."
                className={inputClass + " pl-9"}
              />
            </div>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            {flash ? (
              <p className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                {flash}
              </p>
            ) : null}

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Memuat data...
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Tidak ada pelanggan ditemukan.
                </p>
              ) : (
                filtered.map((c) => {
                  return (
                    <div key={c.id} className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.email}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {c.trialEndsAt
                              ? `Berakhir ${new Date(c.trialEndsAt).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}`
                              : "Belum ada tanggal berlangganan"}
                          </p>
                        </div>
                        <StatusBadge customer={c} />
                      </div>

                      {editingId === c.id ? (
                        <div className="mt-3 space-y-2 border-t border-border pt-3">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={inputClass}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant={cycle === "bulanan" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCycle("bulanan")}
                            >
                              Bulanan
                            </Button>
                            <Button
                              type="button"
                              variant={cycle === "tahunan" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCycle("tahunan")}
                            >
                              Tahunan
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="flex-1"
                              disabled={saving}
                              onClick={() => handleExtend(c.id)}
                            >
                              {saving ? "Menyimpan..." : "Simpan"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setEditingId(c.id)
                              setStartDate(new Date().toISOString().slice(0, 10))
                              setCycle("bulanan")
                            }}
                          >
                            Perpanjang / Aktifkan
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={saving}
                            onClick={() => handleToggleBlock(c.id, !c.isBlocked)}
                          >
                            {c.isBlocked ? "Buka Blokir" : "Blokir"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
