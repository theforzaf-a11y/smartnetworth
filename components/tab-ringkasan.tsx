"use client"

import { useMemo, useState } from "react"
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  Minus,
  Scale,
  Landmark,
  HandCoins,
  Coins,
  AlertTriangle,
  CalendarClock,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardTitle, StatCard } from "@/components/finance-ui"
import {
  EXPENSE_CATEGORIES,
  expenseByCategoryComparison,
  formatPct,
  formatRp,
  getReferenceMonths,
  monthlyIncomeExpense,
  MONTH_NAMES_ID,
  receivableTotals,
  totalExpense,
  totalIncome,
  totalCashExpense,
  totalCreditExpense,
  totalLiabilities,
  upcomingDueAlerts,
  type DueAlert,
  type Liability,
  type Receivable,
  type Transaction,
} from "@/lib/finance"
import { Button } from "@/components/ui/button"

interface TabRingkasanProps {
  transactions: Transaction[]
  saldoAwal: number
  saldoAwalHutang: number
  saldoAwalPiutang: number
  liabilities: Liability[]
  receivables: Receivable[]
  onDelete: (id: string) => void
  onPayNow: (id: string) => void
}

const TYPE_LABEL: Record<string, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
  asset: "Harta",
}

function EquationSign({ symbol }: { symbol: string }) {
  return (
    <div className="col-span-2 hidden items-center justify-center text-xl font-semibold text-muted-foreground lg:col-span-1 lg:flex">
      {symbol}
    </div>
  )
}

export function TabRingkasan({
  transactions,
  saldoAwal,
  saldoAwalHutang,
  saldoAwalPiutang,
  liabilities,
  receivables,
  onDelete,
  onPayNow,
}: TabRingkasanProps) {
  const [filter, setFilter] = useState("Semua")
  const { current, previous, threeMonths } = getReferenceMonths()

  const stats = useMemo(() => {
    const income = totalIncome(transactions)
    const expense = totalExpense(transactions)
    const cashExpense = totalCashExpense(transactions)
    const creditExpense = totalCreditExpense(transactions)
    const debt = saldoAwalHutang + totalLiabilities(liabilities)
    const piutang = saldoAwalPiutang + receivableTotals(receivables).active
    const sisa = saldoAwal + income - cashExpense
    const totalHarta = sisa + piutang
    return {
      income,
      expense,
      cashExpense,
      creditExpense,
      sisa,
      totalHarta,
      debt,
      piutang,
      netWorth: totalHarta - debt,
    }
  }, [transactions, saldoAwal, saldoAwalHutang, saldoAwalPiutang, liabilities, receivables])

  const dueAlerts = useMemo(() => upcomingDueAlerts(liabilities, 5), [liabilities])

  const catCompare = useMemo(
    () => expenseByCategoryComparison(transactions, current, previous),
    [transactions, current, previous],
  )

  const barData = useMemo(
    () => monthlyIncomeExpense(transactions, threeMonths),
    [transactions, threeMonths],
  )

  const filterOptions = ["Semua", "Pemasukan", "Pengeluaran", "Harta", ...EXPENSE_CATEGORIES]

  const filtered = useMemo(() => {
    const list = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
    if (filter === "Semua") return list
    if (filter === "Pemasukan") return list.filter((t) => t.type === "income")
    if (filter === "Pengeluaran") return list.filter((t) => t.type === "expense")
    if (filter === "Harta") return list.filter((t) => t.type === "asset")
    return list.filter((t) => t.category === filter)
  }, [transactions, filter])

  const curLabel = MONTH_NAMES_ID[Number.parseInt(current.slice(5, 7), 10) - 1]
  const prevLabel = MONTH_NAMES_ID[Number.parseInt(previous.slice(5, 7), 10) - 1]

  return (
    <div className="space-y-5">
      {/* Active due-date alert */}
      {dueAlerts.length > 0 ? (
        <DueDateAlert alerts={dueAlerts} onPayNow={onPayNow} />
      ) : null}

      {/* Simple net worth equation: cash + receivables - liabilities */}
      <Card className="border-primary/15 bg-primary/[0.02]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <CardTitle>Ringkasan Kekayaan</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Ikuti alurnya: uang yang tersedia + piutang - hutang</p>
          </div>
          <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary sm:inline-flex">Kas &amp; kewajiban</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.15fr] lg:items-stretch">
          <StatCard label="Sisa Uang (Kas)" value={formatRp(stats.sisa)} icon={<Wallet className="size-4" />} accent="blue" colorValue />
          <EquationSign symbol="+" />
          <StatCard label="Total Piutang" value={formatRp(stats.piutang)} icon={<HandCoins className="size-4" />} accent="sky" colorValue />
          <EquationSign symbol="−" />
          <StatCard label="Total Hutang" value={formatRp(stats.debt)} icon={<Scale className="size-4" />} accent="rose" colorValue />
          <EquationSign symbol="=" />
          <StatCard label="Kekayaan Bersih" value={formatRp(stats.netWorth)} icon={<Landmark className="size-4" />} accent={stats.netWorth < 0 ? "rose" : "emerald"} colorValue subtitle="(Sisa Uang + Piutang) - Hutang" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Total Harta = Sisa Uang + Total Piutang = {formatRp(stats.totalHarta)}</p>
      </Card>

      {/* Cash flow equation: Saldo Awal Kas + Pemasukan Kas − Pengeluaran Kas = Sisa Uang (Kas) */}
      <Card className="border-blue-200/60 bg-blue-500/[0.02] dark:border-blue-500/25">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <CardTitle>Arus Kas (Cash Flow)</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Saldo awal kas + pemasukan kas − pengeluaran kas
            </p>
          </div>
          <span className="hidden rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 sm:inline-flex">
            Kas/Bank saja
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.15fr] lg:items-stretch">
          <StatCard
            label="Saldo Awal Kas"
            value={formatRp(saldoAwal)}
            icon={<Landmark className="size-4" />}
            accent="indigo"
            colorValue
          />
          <EquationSign symbol="+" />
          <StatCard
            label="Total Pemasukan Kas"
            value={formatRp(stats.income)}
            icon={<ArrowUpCircle className="size-4" />}
            accent="emerald"
            colorValue
          />
          <EquationSign symbol="−" />
          <StatCard
            label="Total Pengeluaran Kas"
            value={formatRp(stats.cashExpense)}
            icon={<ArrowDownCircle className="size-4" />}
            accent="rose"
            colorValue
            subtitle="Tanpa Kartu Kredit/PayLater"
          />
          <EquationSign symbol="=" />
          <StatCard
            label="Sisa Uang (Kas)"
            value={formatRp(stats.sisa)}
            icon={<Wallet className="size-4" />}
            accent="blue"
            colorValue
          />
        </div>
      </Card>

      {/* Charts row: 3-month comparison (left) + category comparison (right) */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 3-month bar chart */}
        <Card>
          <CardTitle>Perbandingan 3 Bulan</CardTitle>
          <p className="mb-1 mt-0.5 text-xs text-muted-foreground">Pemasukan vs Pengeluaran</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  formatter={(v: number) => formatRp(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category comparison */}
        <Card>
          <CardTitle>Perbandingan Kategori</CardTitle>
          <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
            Bulan ini ({curLabel}) vs lalu ({prevLabel})
          </p>
          <div className="space-y-2">
            {catCompare.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Belum ada data.</p>
            ) : (
              catCompare.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRp(c.current)}{" "}
                      <span className="text-muted-foreground/60">
                        (lalu {formatRp(c.previous)})
                      </span>
                    </p>
                  </div>
                  <TrendBadge pct={c.pct} invert compact />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-foreground">Transaksi Terbaru</CardTitle>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter kategori"
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          >
            {filterOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Combined expense metric: cash + credit/PayLater */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/70 bg-rose-500/[0.04] px-3 py-2.5 dark:border-rose-500/25">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Total Seluruh Pengeluaran (Kas + PayLater)
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">
              Kas {formatRp(stats.cashExpense)} + PayLater/Kredit {formatRp(stats.creditExpense)}
            </p>
          </div>
          <span className="shrink-0 text-lg font-bold text-rose-600 dark:text-rose-400">
            {formatRp(stats.expense)}
          </span>
        </div>

        <div className="space-y-1.5">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada transaksi untuk filter ini.
            </p>
          ) : (
            filtered.slice(0, 40).map((t) => (
              <div
                key={t.id}
                className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60"
              >
                <span
                  className={
                    "flex size-9 shrink-0 items-center justify-center rounded-lg " +
                    (t.type === "income"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : t.type === "expense"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-sky-500/10 text-sky-600 dark:text-sky-400")
                  }
                >
                  {t.type === "income" ? (
                    <ArrowUpCircle className="size-4" />
                  ) : t.type === "expense" ? (
                    <ArrowDownCircle className="size-4" />
                  ) : (
                    <Coins className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category} · {TYPE_LABEL[t.type]} · {formatDate(t.date)}
                  </p>
                </div>
                <span
                  className={
                    "shrink-0 text-sm font-semibold " +
                    (t.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : t.type === "expense"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-sky-600 dark:text-sky-400")
                  }
                >
                  {t.type === "expense" ? "-" : t.type === "income" ? "+" : ""}
                  {formatRp(t.amount)}
                </span>
                <button
                  onClick={() => onDelete(t.id)}
                  aria-label={`Hapus ${t.title}`}
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()].slice(0, 3)}`
}

/** Prominent warning banner shown when one or more loans are due within 5 days. */
function DueDateAlert({
  alerts,
  onPayNow,
}: {
  alerts: DueAlert[]
  onPayNow: (id: string) => void
}) {
  return (
    <div
      role="alert"
      className="overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10"
    >
      <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-100/60 px-4 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
        <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Perhatian: {alerts.length} cicilan mendekati jatuh tempo
        </p>
      </div>
      <ul className="divide-y divide-amber-200/60 dark:divide-amber-500/20">
        {alerts.map(({ liability, status }) => {
          const urgent = status.tone === "urgent"
          return (
            <li
              key={liability.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {liability.name}{" "}
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {formatRp(liability.monthlyPayment || liability.principal)}
                  </span>
                </p>
                <p
                  className={
                    "mt-0.5 flex items-center gap-1 text-xs font-medium " +
                    (urgent
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-amber-700 dark:text-amber-400")
                  }
                >
                  <CalendarClock className="size-3.5" />
                  {status.days === 0
                    ? "Jatuh tempo hari ini"
                    : `Jatuh tempo dalam ${status.days} hari`}
                </p>
              </div>
              <Button
                size="sm"
                className={
                  urgent
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }
                onClick={() => onPayNow(liability.id)}
              >
                <Wallet className="size-3.5" />
                Bayar Sekarang
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** invert=true means a decrease (negative pct) is "good" (green). */
function TrendBadge({
  pct,
  invert = false,
  compact = false,
}: {
  pct: number
  invert?: boolean
  compact?: boolean
}) {
  const isZero = Math.abs(pct) < 0.05
  const isUp = pct > 0
  const good = invert ? !isUp : isUp
  const color = isZero
    ? "text-muted-foreground bg-muted"
    : good
      ? "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
      : "text-rose-600 bg-rose-500/10 dark:text-rose-400"
  const Icon = isZero ? Minus : isUp ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 font-semibold ${color} ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      <Icon className={compact ? "size-3.5" : "size-4"} />
      {isZero ? "0%" : formatPct(pct)}
    </span>
  )
}
