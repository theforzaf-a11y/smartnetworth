export type TxType = "expense" | "income" | "asset"

/** How an expense was funded. "cash" moves money out of liquid assets;
 *  "credit" (Kartu Kredit / PayLater) adds to liabilities instead. */
export type PaymentMethod = "cash" | "credit"

/** Every financial record belongs to a personal ("pribadi") or business ("bisnis") entity. */
export type Entity = "pribadi" | "bisnis"

/** Filter selection for viewing: all records, or scoped to one entity. */
export type EntityFilter = "semua" | Entity

export const DEFAULT_ENTITY: Entity = "pribadi"

export interface Transaction {
  id: string
  type: TxType
  title: string
  amount: number
  category: string
  date: string // ISO yyyy-mm-dd
  entity: Entity
  /** Only meaningful for expenses. Defaults to "cash" when absent. */
  paymentMethod?: PaymentMethod
}

export const EXPENSE_CATEGORIES = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Lainnya",
] as const

export const INCOME_CATEGORIES = ["Penjualan", "Gaji", "Bonus", "Freelance", "Investasi", "Lainnya"] as const

/** Income category counted as UMKM business turnover (peredaran bruto) for tax. */
export const SALES_CATEGORY = "Penjualan"

export const ASSET_CATEGORIES = ["Tabungan", "Deposito", "Emas", "Saham", "Reksadana"] as const

export const LIABILITY_CATEGORIES = [
  "Hutang Bank",
  "Hutang Dagang",
  "Hutang Personal",
  "Hutang Lembaga Keuangan Non-Bank",
  "PayLater",
  "Lainnya",
] as const

export interface Liability {
  id: string
  name: string // Nama Hutang / Kreditur
  category: string
  principal: number // Total sisa pokok hutang (Rp)
  monthlyPayment: number // Angsuran / cicilan per bulan (Rp)
  dueDay: number // Tanggal jatuh tempo cicilan (1-31)
  createdAt: string // ISO yyyy-mm-dd
  entity: Entity
  /** Total loan tenor in months (optional). */
  tenorMonths?: number
  /** Number of installment payments already made (for remaining-tenor display). */
  paidInstallments?: number
}

export type ReceivableStatus = "unpaid" | "paid"

/** Accounts receivable (piutang) — money owed to the user by a customer/debtor. */
export interface Receivable {
  id: string
  customer: string // Nama Pelanggan / Debitur
  amount: number // Nominal (Rp)
  date: string // Tanggal transaksi (ISO yyyy-mm-dd)
  dueDate: string // Tanggal jatuh tempo pelunasan (ISO yyyy-mm-dd)
  entity: Entity
  status: ReceivableStatus
  paidDate?: string // ISO yyyy-mm-dd, set when marked lunas
}

/** True when a record's entity should be shown under the active filter. */
export function matchesEntity(entity: Entity, filter: EntityFilter): boolean {
  return filter === "semua" || entity === filter
}

export function filterTxByEntity(txs: Transaction[], filter: EntityFilter): Transaction[] {
  return filter === "semua" ? txs : txs.filter((t) => t.entity === filter)
}

export function filterLiabByEntity(liabs: Liability[], filter: EntityFilter): Liability[] {
  return filter === "semua" ? liabs : liabs.filter((l) => l.entity === filter)
}

export function filterRecvByEntity(recvs: Receivable[], filter: EntityFilter): Receivable[] {
  return filter === "semua" ? recvs : recvs.filter((r) => r.entity === filter)
}

export const ENTITY_LABEL: Record<Entity, string> = {
  pribadi: "Pribadi",
  bisnis: "Bisnis",
}

export const STORAGE_KEYS = {
  transactions: "snw_transactions",
  saldoAwal: "snw_saldo_awal",
  saldoAwalHutang: "snw_saldo_awal_hutang",
  saldoAwalPiutang: "snw_saldo_awal_piutang",
  liabilities: "snw_liabilities",
  receivables: "snw_receivables",
  geminiKey: "snw_gemini_key",
  unlocked: "snw_unlocked",
  passcode: "snw_passcode",
  scanQuota: "snw_scan_quota",
  voiceQuota: "snw_voice_quota",
} as const

/** Access control defaults. */
export const DEFAULT_PASSCODE = "SMART2026"
/** Master password required to open the admin access settings panel. */
export const MASTER_ADMIN_PASSWORD = "ADMIN-SMART2026"
/** Maximum number of free AI receipt scans allowed per device. */
export const MAX_SCAN_QUOTA = 5
/** Maximum number of free AI voice-input transactions allowed per device (premium feature). */
export const MAX_VOICE_QUOTA = 3

export const DEFAULT_SALDO_AWAL = 0

export const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

export function formatRp(value: number): string {
  const sign = value < 0 ? "-" : ""
  return (
    sign +
    "Rp " +
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.abs(Math.round(value)))
  )
}

export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export function monthKey(dateStr: string): string {
  // returns "yyyy-mm"
  return dateStr.slice(0, 7)
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return ((current - previous) / previous) * 100
}

/** Reference "current" month for the app. Uses the latest month that has data,
 *  falling back to today. Kept deterministic for the seeded demo (September). */
export function getReferenceMonths() {
  // The seeded demo spans Juli, Agustus, September 2026.
  const year = 2026
  return {
    current: `${year}-09`,
    previous: `${year}-08`,
    threeMonths: [`${year}-07`, `${year}-08`, `${year}-09`],
  }
}

export function sumBy(txs: Transaction[], predicate: (t: Transaction) => boolean): number {
  return txs.reduce((acc, t) => (predicate(t) ? acc + t.amount : acc), 0)
}

export function totalIncome(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "income")
  }

  /** Business turnover only — income transactions categorized as "Penjualan".
   *  Non-business income (Gaji, Bonus, Freelance, Investasi, Lainnya) is excluded. */
  export function totalSalesRevenue(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "income" && t.category === SALES_CATEGORY)
  }

/** All expenses, regardless of payment method (spending reports). */
export function totalExpense(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "expense")
}

/** True for an expense that actually moved cash (not credit / PayLater). */
export function isCashExpense(t: Transaction): boolean {
  return t.type === "expense" && t.paymentMethod !== "credit"
}

/** Expenses paid with cash/bank only. Credit & PayLater spend is excluded
 *  because it increases liabilities rather than reducing liquid assets. */
export function totalCashExpense(txs: Transaction[]): number {
  return sumBy(txs, isCashExpense)
}

/** Expenses funded by credit / PayLater. */
export function totalCreditExpense(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "expense" && t.paymentMethod === "credit")
}

export function totalAssetTransfers(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "asset")
}

/** Net movement of actual cash: income minus cash-funded expenses only. */
export function netCashflow(txs: Transaction[]): number {
  return totalIncome(txs) - totalCashExpense(txs)
}

/** Total liquid assets = starting balance + asset transfers + net cashflow */
export function totalLiquidAssets(txs: Transaction[], saldoAwal: number): number {
  return saldoAwal + totalAssetTransfers(txs) + netCashflow(txs)
}

/** Net worth = liquid assets (transfers already invested still count as assets) */
export function netWorth(txs: Transaction[], saldoAwal: number): number {
  return saldoAwal + totalAssetTransfers(txs) + netCashflow(txs)
}

/** Total outstanding principal across all loans. */
export function totalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((acc, l) => acc + Math.max(0, l.principal), 0)
}

/** Total of monthly installments across all loans. */
export function totalMonthlyInstallments(liabilities: Liability[]): number {
  return liabilities.reduce((acc, l) => acc + Math.max(0, l.monthlyPayment), 0)
}

/** Total debt repayments recorded as cash expenses. Every installment logged by
 *  `payLiability` is titled "Bayar Cicilan: …", so this recovers how much
 *  principal has been paid down over the loans' lifetime. */
export function totalDebtPayments(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "expense" && t.title.startsWith("Bayar Cicilan"))
}

/** Total debt ever incurred = still-outstanding principal + everything already
 *  repaid. Used as "Hutang Baru" in the monthly rollover breakdown so that
 *  [Saldo Awal] + [Hutang Baru] − [Pembayaran] reconciles to the outstanding total. */
export function totalDebtIncurred(liabilities: Liability[], txs: Transaction[]): number {
  return totalLiabilities(liabilities) + totalDebtPayments(txs)
}

/** Net worth including liabilities = liquid assets minus total outstanding debt. */
export function netWorthWithLiabilities(
  txs: Transaction[],
  saldoAwal: number,
  liabilities: Liability[],
): number {
  return totalLiquidAssets(txs, saldoAwal) - totalLiabilities(liabilities)
}

/** Last calendar day of the month that contains `d`. */
function lastDayOfMonth(year: number, monthIdx: number): number {
  return new Date(year, monthIdx + 1, 0).getDate()
}

/** Days until the next occurrence of a monthly due day (1-31). 0 means due today.
 *  Handles short months by clamping the day to the month's last day. */
export function daysUntilDue(dueDay: number, from: Date = new Date()): number {
  const day = Math.min(Math.max(1, Math.round(dueDay)), 31)
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const thisMonthDay = Math.min(day, lastDayOfMonth(today.getFullYear(), today.getMonth()))
  let due = new Date(today.getFullYear(), today.getMonth(), thisMonthDay)
  if (due.getTime() < today.getTime()) {
    const nextDay = Math.min(day, lastDayOfMonth(today.getFullYear(), today.getMonth() + 1))
    due = new Date(today.getFullYear(), today.getMonth() + 1, nextDay)
  }
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

/** Whole days from today until an ISO date. Negative when already past. */
export function daysUntilDate(dateStr: string, from: Date = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const target = new Date(dateStr + "T00:00:00")
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((targetMidnight.getTime() - today.getTime()) / 86_400_000)
}

/** Remaining loan tenor in months, or null when no tenor is set. */
export function remainingTenor(l: Liability): { paid: number; total: number; left: number } | null {
  if (!l.tenorMonths || l.tenorMonths <= 0) return null
  const total = Math.round(l.tenorMonths)
  const paid = Math.min(total, Math.max(0, Math.round(l.paidInstallments ?? 0)))
  return { paid, total, left: Math.max(0, total - paid) }
}

export type DueTone = "overdue" | "urgent" | "soon" | "normal"

export interface DueStatus {
  days: number
  label: string
  tone: DueTone
}

/** Human-readable due-date status with a color tone for badges/alerts.
 *  Red = today / overdue, Yellow = under 5 days, otherwise neutral. */
export function dueStatus(dueDay: number, from: Date = new Date()): DueStatus {
  const days = daysUntilDue(dueDay, from)
  if (days === 0) return { days, label: "Jatuh tempo hari ini", tone: "urgent" }
  if (days < 5) return { days, label: `Jatuh tempo ${days} hari lagi`, tone: "soon" }
  return {
    days,
    label: `Jatuh tempo tgl ${Math.min(Math.max(1, Math.round(dueDay)), 31)} tiap bulan`,
    tone: "normal",
  }
}

export interface DueAlert {
  liability: Liability
  status: DueStatus
}

/** Active loans whose next installment is due within `withinDays` (default 5),
 *  sorted by urgency (soonest first). Fully-paid loans are excluded. */
export function upcomingDueAlerts(
  liabilities: Liability[],
  withinDays = 5,
  from: Date = new Date(),
): DueAlert[] {
  return liabilities
    .filter((l) => l.principal > 0)
    .map((l) => ({ liability: l, status: dueStatus(l.dueDay, from) }))
    .filter((a) => a.status.days <= withinDays)
    .sort((a, b) => a.status.days - b.status.days)
}

/** Distribution of outstanding principal grouped by loan category (for the donut chart). */
export function liabilityDistribution(liabilities: Liability[]): AssetSlice[] {
  const totals = new Map<string, number>()
  for (const l of liabilities) {
    if (l.principal > 0) {
      totals.set(l.category, (totals.get(l.category) ?? 0) + l.principal)
    }
  }
  return Array.from(totals, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

export interface AssetSlice {
  name: string
  value: number
}

/** Distribution for the donut chart. "Kas" = saldoAwal + net cashflow,
 *  each asset category summed separately. */
export function assetDistribution(txs: Transaction[], saldoAwal: number): AssetSlice[] {
  const kas = saldoAwal + netCashflow(txs)
  const slices: AssetSlice[] = [{ name: "Kas / Rekening", value: Math.max(kas, 0) }]
  for (const cat of ASSET_CATEGORIES) {
    const v = sumBy(txs, (t) => t.type === "asset" && t.category === cat)
    if (v > 0) slices.push({ name: cat, value: v })
  }
  return slices.filter((s) => s.value > 0)
}

export interface CategoryComparison {
  category: string
  current: number
  previous: number
  diff: number
  pct: number
}

export function expenseByCategoryComparison(
  txs: Transaction[],
  currentMonth: string,
  previousMonth: string,
): CategoryComparison[] {
  return EXPENSE_CATEGORIES.map((cat) => {
    const current = sumBy(
      txs,
      (t) => t.type === "expense" && t.category === cat && monthKey(t.date) === currentMonth,
    )
    const previous = sumBy(
      txs,
      (t) => t.type === "expense" && t.category === cat && monthKey(t.date) === previousMonth,
    )
    return {
      category: cat,
      current,
      previous,
      diff: current - previous,
      pct: pctChange(current, previous),
    }
  }).filter((c) => c.current > 0 || c.previous > 0)
}

export interface MonthlyBar {
  month: string
  label: string
  income: number
  expense: number
}

export function monthlyIncomeExpense(txs: Transaction[], months: string[]): MonthlyBar[] {
  return months.map((m) => {
    const income = sumBy(txs, (t) => t.type === "income" && monthKey(t.date) === m)
    const expense = sumBy(txs, (t) => t.type === "expense" && monthKey(t.date) === m)
    const monthIdx = Number.parseInt(m.slice(5, 7), 10) - 1
    return { month: m, label: MONTH_NAMES_ID[monthIdx] ?? m, income, expense }
  })
}

export function filterReceivablesByEntity(list: Receivable[], filter: EntityFilter): Receivable[] {
  return filter === "semua" ? list : list.filter((r) => r.entity === filter)
}

export interface ReceivableTotals {
  active: number // outstanding (belum lunas)
  dueThisMonth: number // outstanding & jatuh tempo in current calendar month
  paid: number // sudah lunas
}

/** Summary figures for the Piutang dashboard cards. */
export function receivableTotals(list: Receivable[], from: Date = new Date()): ReceivableTotals {
  const ym = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`
  let active = 0
  let dueThisMonth = 0
  let paid = 0
  for (const r of list) {
    if (r.status === "paid") {
      paid += r.amount
    } else {
      active += r.amount
      if (monthKey(r.dueDate) === ym) dueThisMonth += r.amount
    }
  }
  return { active, dueThisMonth, paid }
}

/** Sum of all receivable amounts (any status). Represents recognized sales. */
export function totalReceivables(list: Receivable[]): number {
  return list.reduce((acc, r) => acc + Math.max(0, r.amount), 0)
}

/** UMKM turnover = sales-category income + every business receivable booked
 *  (paid or unpaid), since a credit sale is recognized as revenue when it occurs. */
export function businessOmzet(salesTxs: Transaction[], businessReceivables: Receivable[]): number {
  return totalSalesRevenue(salesTxs) + totalReceivables(businessReceivables)
}

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** New users start with a completely empty ledger. */
export function seedTransactions(): Transaction[] {
  return []
}

/** New users start with no receivables. */
export function seedReceivables(): Receivable[] {
  return []
}
