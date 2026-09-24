"use client"

import { useMemo, useState } from "react"
import {
  CreditCard,
  Landmark,
  Plus,
  Trash2,
  CheckCircle2,
  CalendarClock,
  Scale,
  Wallet,
  HandCoins,
  Pencil,
} from "lucide-react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { BreakdownRow, Card, CardTitle, CHART_COLORS } from "@/components/finance-ui"
import {
  dueStatus,
  type Entity,
  formatRp,
  liabilityDistribution,
  LIABILITY_CATEGORIES,
  remainingTenor,
  suggestCategory,
  totalDebtIncurred,
  totalDebtPayments,
  totalLiabilities,
  totalMonthlyInstallments,
  type DueTone,
  type Liability,
  type Transaction,
} from "@/lib/finance"
import { EntitySelector } from "@/components/entity-toggle"

interface TabHutangProps {
  transactions: Transaction[]
  saldoAwalHutang: number
  onSaveSaldo: (value: number) => void
  liabilities: Liability[]
  onAdd: (liab: Omit<Liability, "id" | "createdAt">, addToCash: boolean) => void
  onDelete: (id: string) => void
  onPay: (id: string, amount: number, date: string) => void
  defaultEntity?: Entity
}

export function TabHutang({
  transactions,
  saldoAwalHutang,
  onSaveSaldo,
  liabilities,
  onAdd,
  onDelete,
  onPay,
  defaultEntity = "pribadi",
}: TabHutangProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingSaldo, setEditingSaldo] = useState(false)

  const outstanding = useMemo(() => totalLiabilities(liabilities), [liabilities])
  const payments = useMemo(() => totalDebtPayments(transactions), [transactions])
  const newDebt = useMemo(() => totalDebtIncurred(liabilities, transactions), [liabilities, transactions])
  // Rollover: opening debt + new debt this period − repayments.
  const totalDebt = saldoAwalHutang + newDebt - payments
  const monthlyTotal = useMemo(() => totalMonthlyInstallments(liabilities), [liabilities])
  const distribution = useMemo(() => liabilityDistribution(liabilities), [liabilities])

  return (
    <div className="space-y-5">
      {/* Summary banner */}
      <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50">
        <div className="flex items-center gap-2 text-rose-700">
          <span className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
            <Scale className="size-4" />
          </span>
          <span className="text-sm font-medium">Saldo Akhir Hutang</span>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-rose-700 sm:text-4xl">
          {formatRp(totalDebt)}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
          <BannerStat label="Cicilan / Bulan" value={formatRp(monthlyTotal)} tone="neutral" />
        </div>
      </Card>

      {/* Rincian Saldo Akhir Hutang — explicit rollover formula */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Rincian Saldo Akhir Hutang</CardTitle>
          {!editingSaldo ? (
            <Button variant="outline" size="sm" onClick={() => setEditingSaldo(true)}>
              <Pencil className="size-3.5" />
              Ubah Saldo Awal Hutang
            </Button>
          ) : null}
        </div>
        <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
          Saldo Awal + Hutang Baru − Pembayaran/Cicilan = Saldo Akhir
        </p>

        {editingSaldo ? (
          <SaldoAwalEditor
            initial={saldoAwalHutang}
            onCancel={() => setEditingSaldo(false)}
            onSave={(v) => {
              onSaveSaldo(v)
              setEditingSaldo(false)
            }}
          />
        ) : null}

        <div className="mt-1 space-y-1">
          <BreakdownRow label="Saldo Awal Hutang" value={saldoAwalHutang} />
          <BreakdownRow label="Hutang Baru Bulan Ini" value={newDebt} op="+" tone="rose" />
          <BreakdownRow label="Pembayaran Hutang / Cicilan" value={-payments} op="−" tone="default" />
          <BreakdownRow
            label="Saldo Akhir Hutang"
            value={totalDebt}
            op="="
            emphasize
            tone="rose"
          />
        </div>
      </Card>

      {/* Distribusi Hutang donut chart */}
      {distribution.length > 0 ? (
        <Card>
          <CardTitle>Distribusi Hutang</CardTitle>
          <p className="mb-1 mt-0.5 text-xs text-muted-foreground">
            Persentase sisa pokok per kategori
          </p>
          <div className="mt-4 grid items-center gap-4 sm:grid-cols-2">
            <div className="h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {distribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatRp(v)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    iconType="circle"
                    layout="horizontal"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-2">
              {distribution.map((s, i) => {
                const pct = totalDebt > 0 ? (s.value / totalDebt) * 100 : 0
                return (
                  <li key={s.name} className="flex items-center gap-2.5">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                    <span className="shrink-0 text-sm font-semibold">{pct.toFixed(1)}%</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRp(s.value)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </Card>
      ) : null}

      {/* Add loan trigger / form */}
      {showForm ? (
        <AddLoanForm
          defaultEntity={defaultEntity}
          onCancel={() => setShowForm(false)}
          onSubmit={(liab, addToCash) => {
            onAdd(liab, addToCash)
            setShowForm(false)
          }}
        />
      ) : (
        <Button size="lg" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          Tambah Hutang Baru
        </Button>
      )}

      {/* Loan list */}
      <Card>
        <CardTitle>Daftar Hutang &amp; Liabilitas</CardTitle>
        {liabilities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CreditCard className="size-5" />
            </span>
            <p className="text-sm font-medium">Belum ada hutang tercatat</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Semua saldo hutang dimulai dari Rp 0. Tambahkan hutang untuk mulai memantau cicilan dan
              jatuh tempo.
            </p>
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            {liabilities.map((l) => (
              <LoanRow key={l.id} liability={l} onDelete={onDelete} onPay={onPay} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function LoanRow({
  liability,
  onDelete,
  onPay,
}: {
  liability: Liability
  onDelete: (id: string) => void
  onPay: (id: string, amount: number, date: string) => void
}) {
  const status = useMemo(() => dueStatus(liability.dueDay), [liability.dueDay])
  const tenor = useMemo(() => remainingTenor(liability), [liability])
  const paid = liability.principal <= 0

  function handlePay() {
    if (paid) return
    const suggested = Math.min(liability.monthlyPayment || liability.principal, liability.principal)
    const input = prompt(
      `Bayar cicilan untuk "${liability.name}"\nSisa pokok: ${formatRp(liability.principal)}\n\nMasukkan nominal pembayaran (Rp):`,
      String(Math.round(suggested)),
    )
    if (input == null) return
    const amount = Number(input)
    if (!amount || amount <= 0) return
    onPay(liability.id, amount, new Date().toISOString().slice(0, 10))
  }

  return (
    <div className="rounded-xl border border-border/70 p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <Landmark className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{liability.name}</p>
              <p className="text-xs text-muted-foreground">{liability.category}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {formatRp(liability.principal)}
              </p>
              <p className="text-[11px] text-muted-foreground">sisa pokok</p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
              <HandCoins className="size-3" />
              {formatRp(liability.monthlyPayment)}/bln
            </span>
            {tenor ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <CalendarClock className="size-3" />
                Sisa {tenor.left} dari {tenor.total} Bulan
              </span>
            ) : null}
            {paid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                Lunas
              </span>
            ) : (
              <DueBadge label={status.label} tone={status.tone} />
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={paid}
              onClick={handlePay}
            >
              <Wallet className="size-3.5" />
              Bayar Cicilan
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus ${liability.name}`}
              onClick={() => {
                if (confirm(`Hapus hutang "${liability.name}"?`)) onDelete(liability.id)
              }}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const DUE_TONE_CLASS: Record<DueTone, string> = {
  overdue: "bg-destructive/10 text-destructive",
  urgent: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  soon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  normal: "bg-muted text-muted-foreground",
}

function DueBadge({ label, tone }: { label: string; tone: DueTone }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold " +
        DUE_TONE_CLASS[tone]
      }
    >
      <CalendarClock className="size-3" />
      {label}
    </span>
  )
}

function AddLoanForm({
  onSubmit,
  onCancel,
  defaultEntity = "pribadi",
}: {
  onSubmit: (liab: Omit<Liability, "id" | "createdAt">, addToCash: boolean) => void
  onCancel: () => void
  defaultEntity?: Entity
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState<string>(LIABILITY_CATEGORIES[0])
  const [principal, setPrincipal] = useState("")
  const [monthlyPayment, setMonthlyPayment] = useState("")
  const [dueDay, setDueDay] = useState("5")
  const [tenorMonths, setTenorMonths] = useState("")
  const [addToCash, setAddToCash] = useState(false)
  const [entity, setEntity] = useState<Entity>(defaultEntity)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const p = Number(principal)
    if (!name.trim() || !p || p <= 0) return
    const tenor = Math.max(0, Math.round(Number(tenorMonths) || 0))
    onSubmit(
      {
        name: name.trim(),
        category,
        principal: Math.round(p),
        monthlyPayment: Math.max(0, Math.round(Number(monthlyPayment) || 0)),
        dueDay: Math.min(Math.max(1, Math.round(Number(dueDay) || 1)), 31),
        entity,
        ...(tenor > 0 ? { tenorMonths: tenor } : {}),
      },
      addToCash,
    )
  }

  return (
    <Card>
      <CardTitle>Tambah Hutang Baru</CardTitle>
      <form onSubmit={handleSubmit} className="mt-3 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Entitas</label>
          <EntitySelector value={entity} onChange={setEntity} />
        </div>
        <div>
          <label htmlFor="liab-name" className="mb-1.5 block text-sm font-medium">
            Nama Hutang / Kreditur
          </label>
          <input
            id="liab-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth. KPR Bank Mandiri"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="liab-category" className="mb-1.5 block text-sm font-medium">
            Kategori Hutang
          </label>
          <select
            id="liab-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {LIABILITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="liab-principal" className="mb-1.5 block text-sm font-medium">
            Saldo Awal / Sisa Pokok Hutang (Rp)
          </label>
          <input
            id="liab-principal"
            type="number"
            inputMode="numeric"
            min="0"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="0"
            className={inputClass}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Masukkan saldo awal hutang atau sisa pokok terkini sebagai titik awal pemantauan.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="liab-monthly" className="mb-1.5 block text-sm font-medium">
              Angsuran / Bulan (Rp)
            </label>
            <input
              id="liab-monthly"
              type="number"
              inputMode="numeric"
              min="0"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="liab-due" className="mb-1.5 block text-sm font-medium">
              Tgl Jatuh Tempo Bulanan (1-31)
            </label>
            <select
              id="liab-due"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className={inputClass}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Tanggal {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="liab-tenor" className="mb-1.5 block text-sm font-medium">
            Tenor / Durasi (Bulan)
            <span className="ml-1 font-normal text-muted-foreground">(opsional)</span>
          </label>
          <input
            id="liab-tenor"
            type="number"
            inputMode="numeric"
            min="0"
            value={tenorMonths}
            onChange={(e) => setTenorMonths(e.target.value)}
            placeholder="cth. 12"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Total lama pinjaman. Digunakan untuk menampilkan sisa durasi cicilan (cth. &quot;Sisa 8
            dari 12 Bulan&quot;).
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 bg-muted/40 p-3">
          <input
            type="checkbox"
            checked={addToCash}
            onChange={(e) => setAddToCash(e.target.checked)}
            className="mt-0.5 size-4 rounded border-input accent-emerald-600"
          />
          <span className="text-sm">
            <span className="font-medium">Tambahkan ke Kas / Harta Lancar</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Catat pokok hutang sebagai pemasukan kas (cash inflow) saat pencairan.
            </span>
          </span>
        </label>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" size="lg" className="flex-1">
            <Plus className="size-4" />
            Simpan Hutang
          </Button>
        </div>
      </form>
    </Card>
  )
}

function SaldoAwalEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: number
  onSave: (value: number) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(String(initial || ""))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(Math.max(0, Math.round(Number(value) || 0)))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-3 rounded-lg border border-border/70 bg-muted/40 p-3"
    >
      <label htmlFor="saldo-awal-hutang" className="mb-1.5 block text-sm font-medium">
        Saldo Awal Hutang (Rp)
      </label>
      <input
        id="saldo-awal-hutang"
        type="number"
        inputMode="numeric"
        min="0"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0"
        className={inputClass}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Titik awal saldo hutang sebelum transaksi periode ini dihitung.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" size="sm" className="flex-1">
          Simpan Saldo Awal
        </Button>
      </div>
    </form>
  )
}

function BannerStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "neutral" | "good" | "bad"
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "bad"
        ? "text-rose-600 dark:text-rose-400"
        : "text-foreground"
  return (
    <div className="rounded-lg border border-rose-100 bg-white/70 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className={"mt-0.5 font-semibold " + valueClass}>{value}</p>
    </div>
  )
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
