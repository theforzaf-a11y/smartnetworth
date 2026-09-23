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
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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
  return dateStr.slice(0, 7)
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return ((current - previous) / previous) * 100
}

export function getReferenceMonths() {
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

  export function totalSalesRevenue(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "income" && t.category === SALES_CATEGORY)
  }

export function totalExpense(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "expense")
}

export function isCashExpense(t: Transaction): boolean {
  return t.type === "expense" && t.paymentMethod !== "credit"
}

export function totalCashExpense(txs: Transaction[]): number {
  return sumBy(txs, isCashExpense)
}

export function totalCreditExpense(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "expense" && t.paymentMethod === "credit")
}

export function totalAssetTransfers(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "asset")
}

export function netCashflow(txs: Transaction[]): number {
  return totalIncome(txs) - totalCashExpense(txs)
}

export function totalLiquidAssets(txs: Transaction[], saldoAwal: number): number {
  return saldoAwal + totalAssetTransfers(txs) + netCashflow(txs)
}

export function netWorth(txs: Transaction[], saldoAwal: number): number {
  return saldoAwal + totalAssetTransfers(txs) + netCashflow(txs)
}

export function totalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((acc, l) => acc + Math.max(0, l.principal), 0)
}

export function totalMonthlyInstallments(liabilities: Liability[]): number {
  return liabilities.reduce((acc, l) => acc + Math.max(0, l.monthlyPayment), 0)
}

export function totalDebtPayments(txs: Transaction[]): number {
  return sumBy(txs, (t) => t.type === "expense" && t.title.startsWith("Bayar Cicilan"))
}

export function totalDebtIncurred(liabilities: Liability[], txs: Transaction[]): number {
  return totalLiabilities(liabilities) + totalDebtPayments(txs)
}

export function netWorthWithLiabilities(
  txs: Transaction[],
  saldoAwal: number,
  liabilities: Liability[],
): number {
  return totalLiquidAssets(txs, saldoAwal) - totalLiabilities(liabilities)
}

function lastDayOfMonth(year: number, monthIdx: number): number {
  return new Date(year, monthIdx + 1, 0).getDate()
}

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

export function daysUntilDate(dateStr: string, from: Date = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const target = new Date(dateStr + "T00:00:00")
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((targetMidnight.getTime() - today.getTime()) / 86_400_000)
}

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
  active: number
  dueThisMonth: number
  paid: number
}

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

export function totalReceivables(list: Receivable[]): number {
  return list.reduce((acc, r) => acc + Math.max(0, r.amount), 0)
}

export function businessOmzet(salesTxs: Transaction[], businessReceivables: Receivable[]): number {
  return totalSalesRevenue(salesTxs) + totalReceivables(businessReceivables)
}

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function seedTransactions(): Transaction[] {
  return []
}

export function seedReceivables(): Receivable[] {
  return []
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Makanan: ["makan", "makanan", "sarapan", "resto", "restoran", "warung", "kafe", "cafe", "kopi", "jajan", "nasi", "ayam", "bakso", "mie", "snack", "minuman", "catering"],
  Transportasi: ["bensin", "bbm", "grab", "gojek", "ojek", "taxi", "taksi", "parkir", "tol", "transportasi", "bus", "kereta", "pesawat", "tiket", "angkot", "servis motor", "servis mobil", "bengkel"],
  Belanja: ["belanja", "beli", "baju", "sepatu", "elektronik", "supermarket", "minimarket", "indomaret", "alfamart", "mall", "shopping"],
  Tagihan: ["tagihan", "listrik", "pln", "air", "pdam", "internet", "wifi", "telepon", "pulsa", "token", "bpjs", "asuransi", "cicilan", "sewa", "kontrakan", "kos", "iuran"],
  Hiburan: ["hiburan", "nonton", "bioskop", "netflix", "spotify", "game", "konser", "liburan", "wisata", "karaoke"],
  Kesehatan: ["dokter", "obat", "klinik", "rumah sakit", "apotek", "gigi", "kesehatan", "vitamin", "vaksin", "terapi", "berobat"],
  Penjualan: ["jual", "penjualan", "dagang", "toko", "laku", "order", "pesanan", "omzet", "omset"],
  Gaji: ["gaji", "salary", "upah"],
  Bonus: ["bonus", "thr", "insentif"],
  Freelance: ["freelance", "project", "proyek", "klien", "honor", "jasa"],
  Investasi: ["dividen", "bunga", "profit", "cuan", "saham"],
}

export function suggestCategory(title: string, categories: readonly string[]): string | null {
  const text = title.toLowerCase().trim()
  if (!text) return null
  for (const category of categories) {
    const keywords = CATEGORY_KEYWORDS[category]
    if (!keywords) continue
    if (keywords.some((kw) => text.includes(kw))) {
      return category
    }
  }
  return null
}
