"use client"

import { useState, useRef } from "react"
import {
  LayoutDashboard,
  PlusCircle,
  Coins,
  Receipt,
  RotateCcw,
  KeyRound,
  Lock,
  Scale,
  HandCoins,
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react"
import { FoxLogo } from "@/components/fox-logo"
import { Button } from "@/components/ui/button"
import { TabRingkasan } from "@/components/tab-ringkasan"
import { TabCatat } from "@/components/tab-catat"
import { TabHarta } from "@/components/tab-harta"
import { TabHutang } from "@/components/tab-hutang"
import { TabPiutang } from "@/components/tab-piutang"
import { TabPajak } from "@/components/tab-pajak"
import { PasswordGate } from "@/components/password-gate"
import { AdminSettings } from "@/components/admin-settings"
import { HelpGuide } from "@/components/help-guide"
import { EntityFilterToggle } from "@/components/entity-toggle"
import { useFinance } from "@/lib/use-finance"
import { filterLiabByEntity, filterRecvByEntity, filterTxByEntity, type EntityFilter } from "@/lib/finance"
import { AccessProvider, useAccess } from "@/lib/access-context"

type Tab = "ringkasan" | "catat" | "harta" | "hutang" | "piutang" | "pajak"

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard; activeClass: string }[] = [
  {
    key: "ringkasan",
    label: "Ringkasan",
    icon: LayoutDashboard,
    activeClass: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  },
  {
    key: "catat",
    label: "Catat Keuangan",
    icon: PlusCircle,
    activeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  },
  {
    key: "harta",
    label: "Harta Lancar",
    icon: Coins,
    activeClass: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  },
  {
    key: "hutang",
    label: "Hutang & Liabilitas",
    icon: Scale,
    activeClass: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  },
  {
    key: "piutang",
    label: "Piutang",
    icon: HandCoins,
    activeClass: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  },
  {
    key: "pajak",
    label: "Pajak UMKM",
    icon: Receipt,
    activeClass: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  },
]

export default function Page() {
  return (
    <AccessProvider>
      <AppShell />
    </AccessProvider>
  )
}

function AppShell() {
  const [tab, setTab] = useState<Tab>("ringkasan")
  const [prefillDebtId, setPrefillDebtId] = useState<string | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("semua")
  
  // State untuk Scan Faktur AI
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const finance = useFinance()
  const access = useAccess()

  // Fungsi penanganan proses OCR / Scan Faktur
  const handleScanInvoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setScanStatus("Membaca & menganalisis faktur...")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Gagal memproses faktur")
      }

      const result = await response.json()
      const amount = result.total ?? result.amount
      const merchant = result.merchant ?? result.description

      if (amount && amount > 0) {
        finance.addTransaction({
          type: "expense",
          amount: amount,
          category: result.category || "Lainnya",
          description: merchant ? `[Scan OCR] ${merchant}` : "Scan OCR Transaksi dari Faktur",
          entity: entityFilter === "semua" ? "pribadi" : entityFilter,
          date: result.date || new Date().toISOString().split("T")[0],
        } as any)
        setScanStatus("Berhasil mencatat faktur!")
      } else {
        alert("Gagal mengenali jumlah nominal dari faktur.")
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan saat memproses gambar faktur.")
    } finally {
      setIsScanning(false)
      setTimeout(() => setScanStatus(null), 3000)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Wait until access state is read from localStorage to avoid a lock-screen flash.
  if (!access.hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Memuat…
      </main>
    )
  }

  if (!access.unlocked) {
    return <PasswordGate />
  }

  return (
    <main className="min-h-screen bg-muted/30 pb-8">
      {/* Hidden File Input untuk Kamera/Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleScanInvoice}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/30">
              <FoxLogo className="size-5" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight">SmartNetWorth</h1>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Kelola kekayaan bersih Anda
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
           <Button variant="ghost" size="icon-sm" 
                   onClick={() => setHelpOpen(true)}>
            <HelpCircle className="size-4" />
          </Button>
          <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Hapus semua data"
              title="Hapus semua data"
              onClick={() => {
                if (
                  confirm(
                    "Hapus SEMUA data transaksi, harta, hutang, dan piutang Anda secara permanen? Tindakan ini tidak bisa dibatalkan.",
                  )
                )
                  finance.resetData()
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Pengaturan Akses Admin"
              title="Pengaturan Akses Admin"
              onClick={() => setAdminOpen(true)}
            >
              <KeyRound className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Kunci aplikasi"
              title="Kunci aplikasi"
              onClick={access.lock}
            >
              <Lock className="size-4" />
            </Button>
          </div>
        </div>

        {/* Global entity filter — scopes every summary, chart & list below */}
        <div className="mx-auto max-w-3xl px-4 pb-2.5">
          <EntityFilterToggle value={entityFilter} onChange={setEntityFilter} />
          {tab === "pajak" ? (
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              Tab Pajak UMKM selalu menghitung data{" "}
              <span className="font-semibold text-purple-600">Bisnis</span> saja.
            </p>
          ) : null}
        </div>

        {/* Top navigation tabs */}
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => {
                  if (t.key !== "catat") setPrefillDebtId(null)
                  setTab(t.key)
                }}
                className={
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                  (active
                    ? t.activeClass
                    : "text-muted-foreground hover:bg-muted hover:text-foreground")
                }
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            )
          })}
        </nav>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-5">
        {!finance.hydrated ? (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
            Memuat data…
          </div>
        ) : tab === "ringkasan" ? (
          <TabRingkasan
            transactions={filterTxByEntity(finance.transactions, entityFilter)}
            saldoAwal={finance.saldoAwal}
            liabilities={filterLiabByEntity(finance.liabilities, entityFilter)}
            receivables={filterRecvByEntity(finance.receivables, entityFilter)}
            onDelete={finance.deleteTransaction}
            onPayNow={(id) => {
              setPrefillDebtId(id)
              setTab("catat")
            }}
          />
        ) : tab === "catat" ? (
          <div className="space-y-4">
            {/* Widget Banner Scan Faktur / Struk */}
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Camera className="size-4 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Scan Faktur / Struk Otomatis
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Foto atau upload struk belanja untuk catat transaksi otomatis via AI.
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={isScanning}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 shrink-0 gap-1.5 shadow-sm"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Proses...
                    </>
                  ) : (
                    <>
                      <Upload className="size-3.5" />
                      Scan Struk
                    </>
                  )}
                </Button>
              </div>

              {scanStatus && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-1.5 rounded-lg">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  {scanStatus}
                </div>
              )}
            </div>

            {/* Form Catat Keuangan bawaan asli */}
            <TabCatat
              onAdd={finance.addTransaction}
              liabilities={finance.liabilities}
              onPay={finance.payLiability}
              onAddCredit={finance.addCreditExpense}
              prefillDebtId={prefillDebtId}
              defaultEntity={entityFilter === "semua" ? "pribadi" : entityFilter}
            />
          </div>
        ) : tab === "harta" ? (
          <TabHarta
            transactions={filterTxByEntity(finance.transactions, entityFilter)}
            saldoAwal={finance.saldoAwal}
            onSaveSaldo={finance.setSaldoAwal}
          />
        ) : tab === "hutang" ? (
          <TabHutang
            transactions={filterTxByEntity(finance.transactions, entityFilter)}
            saldoAwalHutang={finance.saldoAwalHutang}
            onSaveSaldo={finance.setSaldoAwalHutang}
            liabilities={filterLiabByEntity(finance.liabilities, entityFilter)}
            onAdd={finance.addLiability}
            onDelete={finance.deleteLiability}
            onPay={finance.payLiability}
            defaultEntity={entityFilter === "semua" ? "pribadi" : entityFilter}
          />
        ) : tab === "piutang" ? (
          <TabPiutang
            receivables={filterRecvByEntity(finance.receivables, entityFilter)}
            saldoAwalPiutang={finance.saldoAwalPiutang}
            onSaveSaldo={finance.setSaldoAwalPiutang}
            onAdd={finance.addReceivable}
            onDelete={finance.deleteReceivable}
            onMarkPaid={finance.markReceivablePaid}
            defaultEntity={entityFilter === "semua" ? "pribadi" : entityFilter}
          />
        ) : (
          <TabPajak
            transactions={filterTxByEntity(finance.transactions, "bisnis")}
            receivables={finance.receivables.filter((r) => r.entity === "bisnis")}
          />
        )}
      </div>

      {adminOpen ? <AdminSettings onClose={() => setAdminOpen(false)} /> : null}
      {helpOpen ? <HelpGuide onClose={() => setHelpOpen(false)} /> : null}
    </main>
  )
}
