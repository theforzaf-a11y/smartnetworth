"use client"

import { useState } from "react"
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
  HelpCircle,
  TrendingUp,
  Users,
  Briefcase,
} from "lucide-react"
import { FoxLogo } from "@/components/fox-logo"
import { Button } from "@/components/ui/button"
import { TabRingkasan } from "@/components/tab-ringkasan"
import { TabCatat } from "@/components/tab-catat"
import { TabHarta } from "@/components/tab-harta"
import { TabHutang } from "@/components/tab-hutang"
import { TabPiutang } from "@/components/tab-piutang"
import { TabPajak } from "@/components/tab-pajak"
import { TabLabaRugi } from "@/components/tab-laba-rugi"
import { TabPajakProfesi } from "@/components/tab-pajak-profesi"
import { PasswordGate } from "@/components/password-gate"
import { TrialExpired } from "@/components/trial-expired"
import { AdminSettings } from "@/components/admin-settings"
import { AdminCustomers } from "@/components/admin-customers"
import { HelpGuide } from "@/components/help-guide"
import { EntityFilterToggle } from "@/components/entity-toggle"
import { useFinance } from "@/lib/use-finance"
import { filterLiabByEntity, filterRecvByEntity, filterTxByEntity, type EntityFilter } from "@/lib/finance"
import { AccessProvider, useAccess } from "@/lib/access-context"

type Tab = "ringkasan" | "catat" | "harta" | "hutang" | "piutang" | "pajak" | "profesi" | "labarugi"

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
  {
    key: "profesi",
    label: "Pajak Profesi",
    icon: Briefcase,
    activeClass: "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-inset ring-fuchsia-200",
  },
  {
    key: "labarugi",
    label: "Laba/Rugi",
    icon: TrendingUp,
    activeClass: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
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
  const [customersOpen, setCustomersOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("semua")

  const finance = useFinance()
  const access = useAccess()

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

  if (access.trialExpired) {
    return <TrialExpired />
  }

  return (
    <main className="min-h-screen bg-muted/30 pb-8">
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
            <Button variant="ghost" size="icon-sm" onClick={() => setHelpOpen(true)}>
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
              aria-label="Kelola Pelanggan"
              title="Kelola Pelanggan"
              onClick={() => setCustomersOpen(true)}
            >
              <Users className="size-4" />
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
            saldoAwal={
              entityFilter === "semua"
                ? finance.saldoAwal.pribadi + finance.saldoAwal.bisnis
                : finance.saldoAwal[entityFilter]
            }
            saldoAwalHutang={
              entityFilter === "semua"
                ? finance.saldoAwalHutang.pribadi + finance.saldoAwalHutang.bisnis
                : finance.saldoAwalHutang[entityFilter]
            }
            saldoAwalPiutang={
              entityFilter === "semua"
                ? finance.saldoAwalPiutang.pribadi + finance.saldoAwalPiutang.bisnis
                : finance.saldoAwalPiutang[entityFilter]
            }
            liabilities={filterLiabByEntity(finance.liabilities, entityFilter)}
            receivables={filterRecvByEntity(finance.receivables, entityFilter)}
            onDelete={finance.deleteTransaction}
            onPayNow={(id) => {
              setPrefillDebtId(id)
              setTab("catat")
            }}
          />
        ) : tab === "catat" ? (
          <TabCatat
            onAdd={finance.addTransaction}
            liabilities={finance.liabilities}
            onPay={finance.payLiability}
            onAddCredit={finance.addCreditExpense}
            prefillDebtId={prefillDebtId}
            defaultEntity={entityFilter === "semua" ? "pribadi" : entityFilter}
          />
        ) : tab === "harta" ? (
          <TabHarta
            transactions={filterTxByEntity(finance.transactions, entityFilter)}
            saldoAwal={
              entityFilter === "semua"
                ? finance.saldoAwal.pribadi + finance.saldoAwal.bisnis
                : finance.saldoAwal[entityFilter]
            }
            saldoAwalByEntity={finance.saldoAwal}
            onSaveSaldo={finance.setSaldoAwal}
            defaultEntity={entityFilter === "semua" ? "pribadi" : entityFilter}
          />
        ) : tab === "hutang" ? (
          <TabHutang
            transactions={filterTxByEntity(finance.transactions, entityFilter)}
            saldoAwalHutang={
              entityFilter === "semua"
                ? finance.saldoAwalHutang.pribadi + finance.saldoAwalHutang.bisnis
                : finance.saldoAwalHutang[entityFilter]
            }
            saldoAwalHutangByEntity={finance.saldoAwalHutang}
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
            saldoAwalPiutang={
              entityFilter === "semua"
                ? finance.saldoAwalPiutang.pribadi + finance.saldoAwalPiutang.bisnis
                : finance.saldoAwalPiutang[entityFilter]
            }
            saldoAwalPiutangByEntity={finance.saldoAwalPiutang}
            onSaveSaldo={finance.setSaldoAwalPiutang}
            onAdd={finance.addReceivable}
            onDelete={finance.deleteReceivable}
            onMarkPaid={finance.markReceivablePaid}
            defaultEntity={entityFilter === "semua" ? "pribadi" : entityFilter}
          />
        ) : tab === "pajak" ? (
          <TabPajak
            transactions={filterTxByEntity(finance.transactions, "bisnis")}
            receivables={finance.receivables.filter((r) => r.entity === "bisnis")}
            saldoAwalOmset={finance.saldoAwalOmset.bisnis}
            onSaveSaldoOmset={(value) => finance.setSaldoAwalOmset("bisnis", value)}
          />
        ) : tab === "profesi" ? (
          <TabPajakProfesi
            transactions={filterTxByEntity(finance.transactions, "pribadi")}
            saldoAwalProfesi={finance.saldoAwalProfesi.pribadi}
            onSaveSaldoProfesi={(value) => finance.setSaldoAwalProfesi("pribadi", value)}
            saldoAwalBuktiPotong={finance.saldoAwalBuktiPotong.pribadi}
            onSaveSaldoBuktiPotong={(value) => finance.setSaldoAwalBuktiPotong("pribadi", value)}
            buktiPotongBerjalan={finance.buktiPotongBerjalan.pribadi}
            onSaveBuktiPotongBerjalan={(value) => finance.setBuktiPotongBerjalan("pribadi", value)}
          />
        ) : (
          <TabLabaRugi
            transactions={finance.transactions}
            receivables={finance.receivables}
            saldoAwalOmset={finance.saldoAwalOmset.bisnis}
            saldoAwalPengeluaran={finance.saldoAwalPengeluaran.bisnis}
            onSaveSaldoPengeluaran={(value) => finance.setSaldoAwalPengeluaran("bisnis", value)}
          />
        )}
      </div>

      {adminOpen ? <AdminSettings onClose={() => setAdminOpen(false)} /> : null}
      {customersOpen ? <AdminCustomers onClose={() => setCustomersOpen(false)} /> : null}
      {helpOpen ? <HelpGuide onClose={() => setHelpOpen(false)} /> : null}
    </main>
  )
}
