"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { Card, CardTitle, StatCard, BreakdownRow } from "@/components/finance-ui"
import {
  type Transaction,
  type Receivable,
  filterTxByEntity,
  filterRecvByEntity,
  monthKey,
  SALES_CATEGORY,
} from "@/lib/finance"

interface TabLabaRugiProps {
  transactions: Transaction[]
  receivables: Receivable[]
}

function formatRupiah(n: number) {
  return "Rp" + Math.round(n).toLocaleString("id-ID")
}

export function TabLabaRugi({ transactions, receivables }: TabLabaRugiProps) {
  const data = useMemo(() => {
    const bisnisTx = filterTxByEntity(transactions, "bisnis")
    const bisnisRecv = filterRecvByEntity(receivables, "bisnis")

    const currentMonth = monthKey(new Date().toISOString())

    const salesTxThisMonth = bisnisTx.filter(
      (t) => t.type === "income" && t.category === SALES_CATEGORY && monthKey(t.date) === currentMonth,
    )
    const salesTxPrior = bisnisTx.filter(
      (t) => t.type === "income" && t.category === SALES_CATEGORY && monthKey(t.date) < currentMonth,
    )
    const recvThisMonth = bisnisRecv.filter((r) => monthKey(r.date) === currentMonth)
    const recvPrior = bisnisRecv.filter((r) => monthKey(r.date) < currentMonth)

    const salesThisMonth =
      salesTxThisMonth.reduce((sum, t) => sum + t.amount, 0) +
      recvThisMonth.reduce((sum, r) => sum + r.amount, 0)
    const salesPrior =
      salesTxPrior.reduce((sum, t) => sum + t.amount, 0) +
      recvPrior.reduce((sum, r) => sum + r.amount, 0)
    const salesToDate = salesThisMonth + salesPrior

    const expenseTxThisMonth = bisnisTx.filter(
      (t) => t.type === "expense" && monthKey(t.date) === currentMonth,
    )
    const expenseTxPrior = bisnisTx.filter(
      (t) => t.type === "expense" && monthKey(t.date) < currentMonth,
    )
    const expenseThisMonth = expenseTxThisMonth.reduce((sum, t) => sum + t.amount, 0)
    const expensePrior = expenseTxPrior.reduce((sum, t) => sum + t.amount, 0)
    const expenseToDate = expenseThisMonth + expensePrior

    const labaBulanIni = salesThisMonth - expenseThisMonth
    const labaAkumulasi = salesToDate - expenseToDate

    return {
      salesThisMonth,
      salesPrior,
      salesToDate,
      expenseThisMonth,
      expensePrior,
      expenseToDate,
      labaBulanIni,
      labaAkumulasi,
    }
  }, [transactions, receivables])

  const isProfitBulanIni = data.labaBulanIni >= 0
  const isProfitAkumulasi = data.labaAkumulasi >= 0

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Total Penjualan s.d. Bulan Ini</CardTitle>
        <StatCard
          label="Total Penjualan"
          value={formatRupiah(data.salesToDate)}
          icon={Wallet}
          tone="sky"
        />
      </Card>

      <Card>
        <CardTitle>Rincian Penjualan</CardTitle>
        <div className="space-y-1">
          <BreakdownRow label="Penjualan Bulan Ini" value={formatRupiah(data.salesThisMonth)} tone="sky" />
          <BreakdownRow label="Akumulasi Bulan Lalu" value={formatRupiah(data.salesPrior)} tone="default" />
          <BreakdownRow label="Total s.d. Bulan Ini" value={formatRupiah(data.salesToDate)} tone="indigo" />
        </div>
      </Card>

      <Card>
        <CardTitle>Rincian Pengeluaran</CardTitle>
        <div className="space-y-1">
          <BreakdownRow label="Pengeluaran Bulan Ini" value={formatRupiah(data.expenseThisMonth)} tone="rose" />
          <BreakdownRow label="Akumulasi Bulan Lalu" value={formatRupiah(data.expensePrior)} tone="default" />
          <BreakdownRow label="Total s.d. Bulan Ini" value={formatRupiah(data.expenseToDate)} tone="indigo" />
        </div>
      </Card>

      <Card>
        <CardTitle>Laba/Rugi Bulan Ini</CardTitle>
        <StatCard
          label={isProfitBulanIni ? "Laba Bulan Ini" : "Rugi Bulan Ini"}
          value={formatRupiah(Math.abs(data.labaBulanIni))}
          icon={isProfitBulanIni ? TrendingUp : TrendingDown}
          tone={isProfitBulanIni ? "indigo" : "rose"}
        />
      </Card>

      <Card>
        <CardTitle>Akumulasi Laba/Rugi s.d. Bulan Ini</CardTitle>
        <div className="space-y-1">
          <BreakdownRow label="Total Penjualan" value={formatRupiah(data.salesToDate)} tone="sky" />
          <BreakdownRow label="Total Pengeluaran" value={formatRupiah(data.expenseToDate)} tone="rose" />
          <BreakdownRow
            label={isProfitAkumulasi ? "Akumulasi Laba" : "Akumulasi Rugi"}
            value={formatRupiah(Math.abs(data.labaAkumulasi))}
            tone={isProfitAkumulasi ? "indigo" : "rose"}
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
