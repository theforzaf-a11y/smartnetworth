"use client"

import { useEffect, useMemo, useState } from "react"
import { TrendingUp, TrendingDown, Wallet, Minus } from "lucide-react"
import { Card, CardTitle, StatCard, BreakdownRow } from "@/components/finance-ui"
import {
  type Transaction,
  type Receivable,
  filterTxByEntity,
  filterRecvByEntity,
  monthKey,
  SALES_CATEGORY,
  formatRp,
} from "@/lib/finance"

interface TabLabaRugiProps {
  transactions: Transaction[]
  receivables: Receivable[]
  /** Akumulasi omset (penjualan) Bisnis s.d. bulan lalu — sinkron dengan tab Pajak UMKM. */
  saldoAwalOmset: number
  /** Akumulasi pengeluaran Bisnis s.d. bulan lalu — diisi manual di tab ini. */
  saldoAwalPengeluaran: number
  onSaveSaldoPengeluaran: (value: number) => void
}

function prevMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function TabLabaRugi({
  transactions,
  receivables,
  saldoAwalOmset,
  saldoAwalPengeluaran,
  onSaveSaldoPengeluaran,
}: TabLabaRugiProps) {
  const [pengeluaranInput, setPengeluaranInput] = useState(
    saldoAwalPengeluaran ? String(saldoAwalPengeluaran) : "",
  )

  useEffect(() => {
    setPengeluaranInput(saldoAwalPengeluaran ? String(saldoAwalPengeluaran) : "")
  }, [saldoAwalPengeluaran])

  const data = useMemo(() => {
    const bisnisTx = filterTxByEntity(transactions, "bisnis")
    const bisnisRecv = filterRecvByEntity(receivables, "bisnis")

    const currentMonth = monthKey(new Date().toISOString())
    const priorMonth = prevMonthKey(currentMonth)

    const sumSales = (predicate: (mk: string) => boolean) =>
      bisnisTx
        .filter((t) => t.type === "income" && t.category === SALES_CATEGORY && predicate(monthKey(t.date)))
        .reduce((sum, t) => sum + t.amount, 0) +
      bisnisRecv.filter((r) => predicate(monthKey(r.date))).reduce((sum, r) => sum + r.amount, 0)

    const sumExpense = (predicate: (mk: string) => boolean) =>
      bisnisTx
        .filter((t) => t.type === "expense" && predicate(monthKey(t.date)))
        .reduce((sum, t) => sum + t.amount, 0)

    const salesThisMonth = sumSales((mk) => mk === currentMonth)
    const salesPriorInApp = sumSales((mk) => mk < currentMonth)
    const salesPrior = saldoAwalOmset + salesPriorInApp
    const salesToDate = salesThisMonth + salesPrior

    const expenseThisMonth = sumExpense((mk) => mk === currentMonth)
    const expensePriorInApp = sumExpense((mk) => mk < currentMonth)
    const expensePrior = saldoAwalPengeluaran + expensePriorInApp
    const expenseToDate = expenseThisMonth + expensePrior

    const labaBulanIni = salesThisMonth - expenseThisMonth
    const labaAkumulasi = salesToDate - expenseToDate

    const salesBulanLalu = sumSales((mk) => mk === priorMonth)
    const expenseBulanLalu = sumExpense((mk) => mk === priorMonth)
    const labaBulanLalu = salesBulanLalu - expenseBulanLalu

    let changePct: number | null = null
    if (labaBulanLalu !== 0) {
      changePct = ((labaBulanIni - labaBulanLalu) / Math.abs(labaBulanLalu)) * 100
    } else if (labaBulanIni === 0) {
      changePct = 0
    }

    return {
      salesThisMonth,
      salesPrior,
      salesToDate,
      expenseThisMonth,
      expensePrior,
      expenseToDate,
      labaBulanIni,
      labaAkumulasi,
      labaBulanLalu,
      changePct,
    }
  }, [transactions, receivables, saldoAwalOmset, saldoAwalPengeluaran])

  const isProfitBulanIni = data.labaBulanIni >= 0
  const isProfitAkumulasi = data.labaAkumulasi >= 0
  const isProfitBulanLalu = data.labaBulanLalu >= 0
  const maxAbsCompare = Math.max(Math.abs(data.labaBulanLalu), Math.abs(data.labaBulanIni), 1)

  return (
    <div className="space-y-4">
      <StatCard
        label="Total Penjualan s.d. Bulan Ini"
        value={formatRp(data.salesToDate)}
        icon={<Wallet className="size-4" />}
        accent="sky"
      />

      <Card>
        <CardTitle>Rincian Penjualan</CardTitle>
        <div className="space-y-1">
          <BreakdownRow label="Penjualan Bulan Ini" value={data.salesThisMonth} tone="sky" />
          <BreakdownRow label="Akumulasi Bulan Lalu" value={data.salesPrior} tone="default" />
          <BreakdownRow label="Total s.d. Bulan Ini" value={data.salesToDate} op="=" tone="sky" emphasize />
        </div>
        <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          "Akumulasi Bulan Lalu" sinkron dengan "Akumulasi Omset s.d. Bulan Lalu" di tab{" "}
          <span className="font-medium text-foreground">Pajak UMKM</span> (saat ini {formatRp(saldoAwalOmset)}),
          ditambah penjualan &amp; piutang yang tercatat di aplikasi sebelum bulan ini. Untuk mengubah angka
          akumulasi, buka tab Pajak UMKM.
        </p>
      </Card>

      <Card>
        <CardTitle>Rincian Pengeluaran</CardTitle>
        <div className="space-y-1">
          <BreakdownRow label="Pengeluaran Bulan Ini" value={data.expenseThisMonth} tone="rose" />
          <BreakdownRow label="Akumulasi Bulan Lalu" value={data.expensePrior} tone="default" />
          <BreakdownRow label="Total s.d. Bulan Ini" value={data.expenseToDate} op="=" tone="rose" emphasize />
        </div>

        <label htmlFor="prior-pengeluaran" className="mb-1.5 mt-4 block text-sm font-medium">
          Akumulasi Pengeluaran s.d. Bulan Lalu
          <span className="ml-1 font-normal text-muted-foreground">(Saldo Awal Pengeluaran)</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            Rp
          </span>
          <input
            id="prior-pengeluaran"
            type="number"
            inputMode="numeric"
            min="0"
            value={pengeluaranInput}
            onChange={(e) => setPengeluaranInput(e.target.value)}
            onBlur={() => onSaveSaldoPengeluaran(Number(pengeluaranInput) || 0)}
            placeholder="0"
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Isi total pengeluaran Bisnis yang sudah terjadi sebelum mulai memakai aplikasi ini di tahun
          berjalan (kalau mulai pakai di tengah tahun). Tersimpan otomatis.
        </p>
      </Card>

      <StatCard
        label={isProfitBulanIni ? "Laba Bulan Ini" : "Rugi Bulan Ini"}
        value={formatRp(Math.abs(data.labaBulanIni))}
        icon={isProfitBulanIni ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
        accent={isProfitBulanIni ? "emerald" : "rose"}
        colorValue
      />

      <Card>
        <CardTitle>Perbandingan Laba/Rugi: Bulan Ini vs Bulan Lalu</CardTitle>
        <div className="mt-4 flex items-end justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end justify-center">
              <div
                className={`w-12 rounded-t-md ${isProfitBulanLalu ? "bg-indigo-400" : "bg-rose-400"}`}
                style={{ height: `${Math.max(6, (Math.abs(data.labaBulanLalu) / maxAbsCompare) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">Bulan Lalu</span>
            <span className="text-xs font-semibold">{formatRp(Math.abs(data.labaBulanLalu))}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end justify-center">
              <div
                className={`w-12 rounded-t-md ${isProfitBulanIni ? "bg-indigo-600" : "bg-rose-600"}`}
                style={{ height: `${Math.max(6, (Math.abs(data.labaBulanIni) / maxAbsCompare) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">Bulan Ini</span>
            <span className="text-xs font-semibold">{formatRp(Math.abs(data.labaBulanIni))}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2.5 text-center">
          {data.changePct === null ? (
            <span className="text-xs text-muted-foreground">
              Belum ada data laba/rugi bulan lalu untuk dibandingkan.
            </span>
          ) : (
            <>
              {data.changePct > 0 ? (
                <TrendingUp className="size-4 text-emerald-600" />
              ) : data.changePct < 0 ? (
                <TrendingDown className="size-4 text-rose-600" />
              ) : (
                <Minus className="size-4 text-muted-foreground" />
              )}
              <span
                className={`text-sm font-semibold ${
                  data.changePct > 0
                    ? "text-emerald-600"
                    : data.changePct < 0
                      ? "text-rose-600"
                      : "text-muted-foreground"
                }`}
              >
                {data.changePct > 0 ? "Naik" : data.changePct < 0 ? "Turun" : "Sama"}{" "}
                {Math.abs(data.changePct).toFixed(1)}% dibanding bulan lalu
              </span>
            </>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>Akumulasi Laba/Rugi s.d. Bulan Ini</CardTitle>
        <div className="space-y-1">
          <BreakdownRow label="Total Penjualan" value={data.salesToDate} tone="sky" />
          <BreakdownRow label="Total Pengeluaran" value={data.expenseToDate} tone="rose" />
          <BreakdownRow
            label={isProfitAkumulasi ? "Akumulasi Laba" : "Akumulasi Rugi"}
            value={data.labaAkumulasi}
            op="="
            tone={isProfitAkumulasi ? "violet" : "rose"}
            emphasize
            signed
          />
        </div>
      </Card>

      <p className="px-1 text-center text-[11px] leading-relaxed text-muted-foreground">
        Penjualan mencakup seluruh transaksi kategori Bisnis (tunai maupun piutang, lunas atau belum).
        Pengeluaran mencakup seluruh biaya kategori Bisnis (tunai maupun melalui hutang). Penerimaan
        hutang (pinjaman) hanya menambah kas dan tidak dihitung sebagai penjualan. Transaksi kategori
        Pribadi tidak mempengaruhi perhitungan ini.
      </p>
    </div>
  )
}
