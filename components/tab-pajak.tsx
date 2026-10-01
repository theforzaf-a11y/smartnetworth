"use client"

import { useEffect, useMemo, useState } from "react"
import { Receipt, Info, Wand2, Check, Printer, Store } from "lucide-react"
import { Card, CardTitle } from "@/components/finance-ui"
import { TaxPrintReport } from "@/components/tax-print-report"
import {
  businessOmzet,
  formatRp,
  MONTH_NAMES_ID,
  SALES_CATEGORY,
  type Receivable,
  type Transaction,
} from "@/lib/finance"

interface SalesLine {
  id: string
  label: string
  detail: string
  date: string
  amount: number
  kind: "penjualan" | "piutang"
}

const EXEMPTION = 500_000_000
const RATE = 0.005

interface TabPajakProps {
  transactions: Transaction[]
  /** Business (bisnis) receivables — recognized as turnover whether paid or not. */
  receivables?: Receivable[]
  /** Persisted "Akumulasi Omset s.d. Bulan Lalu" untuk entity bisnis. */
  saldoAwalOmset: number
  onSaveSaldoOmset: (value: number) => void
  /** Persisted "Akumulasi Bukti Potong PPh 22 s.d. Bulan Lalu" (PMK 37/2025, input manual). */
  saldoAwalBuktiPotong: number
  onSaveSaldoBuktiPotong: (value: number) => void
  /** Persisted "Bukti Potong PPh 22 Periode Berjalan" (PMK 37/2025, input manual). */
  buktiPotongBerjalan: number
  onSaveBuktiPotongBerjalan: (value: number) => void
}

export function TabPajak({
  transactions,
  receivables = [],
  saldoAwalOmset,
  onSaveSaldoOmset,
  saldoAwalBuktiPotong,
  onSaveSaldoBuktiPotong,
  buktiPotongBerjalan,
  onSaveBuktiPotongBerjalan,
}: TabPajakProps) {
  // Peredaran bruto UMKM = pemasukan kategori "Penjualan" + seluruh piutang bisnis
  // (dibukukan sebagai omset saat terjadi transaksi, baik lunas maupun belum).
  const salesRevenue = useMemo(
    () => businessOmzet(transactions, receivables),
    [transactions, receivables],
  )

  // Rincian setiap item yang membentuk omset: penjualan (kategori Penjualan) + piutang bisnis.
  const salesLines = useMemo<SalesLine[]>(() => {
    const lines: SalesLine[] = []
    for (const t of transactions) {
      if (t.type === "income" && t.category === SALES_CATEGORY) {
        lines.push({
          id: t.id,
          label: t.title,
          detail: "Penjualan",
          date: t.date,
          amount: t.amount,
          kind: "penjualan",
        })
      }
    }
    for (const r of receivables) {
      lines.push({
        id: r.id,
        label: r.customer,
        detail: r.status === "paid" ? "Piutang (Lunas)" : "Piutang (Belum Lunas)",
        date: r.date,
        amount: r.amount,
        kind: "piutang",
      })
    }
    return lines.sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, receivables])

  // Akumulasi omset s.d. bulan lalu (saldo awal omset) — tersimpan permanen di database
  const [priorOmzet, setPriorOmzet] = useState(saldoAwalOmset ? String(saldoAwalOmset) : "")
  // Omset periode berjalan bila diinput manual
  const [manualCurrent, setManualCurrent] = useState("")
  // Toggle: gunakan omset penjualan aplikasi sebagai omset periode berjalan
  const [useAppIncome, setUseAppIncome] = useState(true)

  // Akumulasi bukti potong PPh 22 s.d. bulan lalu (saldo awal) — tersimpan permanen di database
  const [priorBPInput, setPriorBPInput] = useState(saldoAwalBuktiPotong ? String(saldoAwalBuktiPotong) : "")
  // Bukti potong PPh 22 periode berjalan — input manual, tersimpan permanen
  const [currentBPInput, setCurrentBPInput] = useState(buktiPotongBerjalan ? String(buktiPotongBerjalan) : "")

  useEffect(() => {
    setPriorOmzet(saldoAwalOmset ? String(saldoAwalOmset) : "")
  }, [saldoAwalOmset])

  useEffect(() => {
    setPriorBPInput(saldoAwalBuktiPotong ? String(saldoAwalBuktiPotong) : "")
  }, [saldoAwalBuktiPotong])

  useEffect(() => {
    setCurrentBPInput(buktiPotongBerjalan ? String(buktiPotongBerjalan) : "")
  }, [buktiPotongBerjalan])

  const prior = Number(priorOmzet) || 0
  const current = useAppIncome ? salesRevenue : Number(manualCurrent) || 0

  const totalOmzet = prior + current

  // Sisa batas bebas pajak setelah memperhitungkan omset periode lalu
  const remainingExemption = Math.max(0, EXEMPTION - prior)
  // Omzet kena pajak untuk periode berjalan
  const taxableCurrent = Math.max(0, current - remainingExemption)
  const taxCurrent = Math.round(taxableCurrent * RATE)

  // Gambaran setahun penuh
  const taxableYear = Math.max(0, totalOmzet - EXEMPTION)
  const taxYear = Math.round(taxableYear * RATE)
  const monthly = Math.round(taxCurrent / 12)

  const priorBP = Number(priorBPInput) || 0
  const currentBP = Number(currentBPInput) || 0
  const totalBP = priorBP + currentBP

  // PPh Final terutang setahun dikurangi bukti potong PPh 22 (PMK 37/2025):
  // positif = masih kurang bayar, negatif = lebih bayar (bukti potong melebihi PPh terutang)
  const selisihBP = taxYear - totalBP
  const lebihBayarBP = selisihBP < 0
  const taxMonthlyAfterBP = Math.round(Math.max(0, selisihBP) / 12)

  // Data untuk laporan cetak/PDF (lampiran laporan pajak)
  const [taxpayerName, setTaxpayerName] = useState("")
  const [taxpayerNpwp, setTaxpayerNpwp] = useState("")
  const now = new Date()
  const periodLabel = `${MONTH_NAMES_ID[now.getMonth()]} ${now.getFullYear()}`

  return (
    <>
    <div className="space-y-5 print:hidden">
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Printer className="size-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold">Cetak Laporan (PDF)</h3>
            <p className="text-xs text-muted-foreground">Untuk lampiran laporan pajak UMKM</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={taxpayerName}
            onChange={(e) => setTaxpayerName(e.target.value)}
            placeholder="Nama Wajib Pajak (opsional)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <input
            value={taxpayerNpwp}
            onChange={(e) => setTaxpayerNpwp(e.target.value)}
            placeholder="NPWP (opsional)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900"
        >
          <Printer className="size-4" />
          Cetak / Simpan sebagai PDF
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Muncul jendela cetak dari browser — pilih <b>"Simpan sebagai PDF"</b> sebagai tujuan cetak.
        </p>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Receipt className="size-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold">Kalkulator Pajak UMKM</h3>
            <p className="text-xs text-muted-foreground">PPh Final 0,5% — PP 55/2022</p>
          </div>
        </div>

        <label htmlFor="prior-omzet" className="mb-1.5 block text-sm font-medium">
          Akumulasi Omset s.d. Bulan Lalu
          <span className="ml-1 font-normal text-muted-foreground">(Saldo Awal Omset)</span>
        </label>
        <MoneyInput
          id="prior-omzet"
          value={priorOmzet}
          onChange={setPriorOmzet}
          onBlurCommit={() => onSaveSaldoOmset(Number(priorOmzet) || 0)}
          placeholder="0"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Total peredaran bruto yang sudah tercatat sejak awal tahun pajak hingga bulan lalu. Angka ini
          tersimpan otomatis dan juga dipakai di tab Laba/Rugi.
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="current-omzet" className="block text-sm font-medium">
              Omset Periode Berjalan{" "}
              <span className="font-normal text-muted-foreground">(Khusus Kategori Penjualan)</span>
            </label>
          </div>
          <MoneyInput
            id="current-omzet"
            value={useAppIncome ? String(salesRevenue) : manualCurrent}
            onChange={setManualCurrent}
            placeholder="0"
            disabled={useAppIncome}
          />
        </div>

        <button
          type="button"
          onClick={() => setUseAppIncome((v) => !v)}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
            useAppIncome
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-input bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          {useAppIncome ? <Check className="size-3.5" /> : <Wand2 className="size-3.5" />}
          Gunakan Omset Penjualan Aplikasi (Kategori Penjualan)
        </button>
        {useAppIncome ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Omset periode berjalan menghitung pemasukan berkategori{" "}
            <span className="font-medium text-foreground">Penjualan</span> ditambah seluruh{" "}
            <span className="font-medium text-foreground">Piutang Bisnis</span> (lunas maupun belum):{" "}
            {formatRp(salesRevenue)}. Pemasukan lain (Gaji, Bonus, Freelance, Investasi, dll.) tidak
            dihitung.
          </p>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Total Omset Setahun</CardTitle>
        <div className="mt-3 space-y-2.5">
          <Row label="Akumulasi omset s.d. bulan lalu" value={formatRp(prior)} />
          <Row
            label={useAppIncome ? "Omset penjualan periode berjalan" : "Omset periode berjalan"}
            value={`+ ${formatRp(current)}`}
          />
          <div className="border-t border-border pt-2.5">
            <Row label="Total omset setahun" value={formatRp(totalOmzet)} bold />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Rincian Penjualan Bulan Ini</CardTitle>
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
          Seluruh penjualan &amp; piutang bisnis yang membentuk omset periode berjalan
        </p>
        {salesLines.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada penjualan atau piutang bisnis tercatat.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Keterangan</th>
                  <th className="py-2 pr-3 font-medium">Jenis</th>
                  <th className="py-2 pr-3 font-medium">Tanggal</th>
                  <th className="py-2 text-right font-medium">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {salesLines.map((line) => (
                  <tr key={line.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium">{line.label}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                          (line.kind === "penjualan"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-sky-500/10 text-sky-600 dark:text-sky-400")
                        }
                      >
                        {line.detail}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{formatTaxDate(line.date)}</td>
                    <td className="py-2 text-right font-semibold">{formatRp(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold">
                  <td className="py-2 pr-3" colSpan={3}>
                    Total Omset Penjualan
                  </td>
                  <td className="py-2 text-right text-amber-700 dark:text-amber-400">
                    {formatRp(salesRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Rincian Perhitungan Periode Ini</CardTitle>
        <div className="mt-3 space-y-2.5">
          <Row label="Batas bebas pajak (setahun)" value={formatRp(EXEMPTION)} />
          <Row label="Sudah terpakai omset bulan lalu" value={`- ${formatRp(Math.min(prior, EXEMPTION))}`} />
          <div className="border-t border-border pt-2.5">
            <Row label="Sisa batas bebas pajak" value={formatRp(remainingExemption)} />
          </div>
          <Row label="Omset periode berjalan" value={formatRp(current)} />
          <Row label="Omzet kena pajak periode ini" value={formatRp(taxableCurrent)} bold />
          <Row label="Tarif PPh Final" value="0,5%" />
        </div>

        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">PPh Final Terutang (periode ini)</span>
            <span className="text-2xl font-bold text-amber-700">{formatRp(taxCurrent)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-amber-200/70 pt-2">
            <span className="text-xs text-muted-foreground">Estimasi setoran per bulan</span>
            <span className="text-sm font-semibold">{formatRp(monthly)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-amber-200/70 pt-2">
            <span className="text-xs text-muted-foreground">Proyeksi PPh Final setahun</span>
            <span className="text-sm font-semibold">{formatRp(taxYear)}</span>
          </div>
        </div>

        {totalOmzet > 0 && taxableCurrent === 0 ? (
          <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
            {prior >= EXEMPTION
              ? "Batas bebas pajak Rp 500 juta sudah habis terpakai, namun omset periode ini belum melampaui sisa batas."
              : "Total omset masih di bawah Rp 500 juta — belum dikenakan PPh Final."}
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Store className="size-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold">Bukti Potong PPh Pasal 22 (Marketplace)</h3>
            <p className="text-xs text-muted-foreground">PMK 37/2025 — rencana berlaku efektif 1 November 2026</p>
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Marketplace/platform perdagangan elektronik akan memungut PPh Pasal 22 sebesar 0,5% dari setiap
          transaksi penjualan online untuk pedagang dengan akumulasi penghasilan di atas Rp 500 juta
          setahun. Bagi pedagang yang dikenai PPh Final UMKM, pungutan ini merupakan bagian dari pelunasan
          PPh Final — isi sesuai bukti potong yang diterima dari marketplace.
        </p>

        <div>
          <label htmlFor="prior-bp-umkm" className="mb-1.5 block text-sm font-medium">
            Akumulasi Bukti Potong PPh 22 s.d. Bulan Lalu
            <span className="ml-1 font-normal text-muted-foreground">(Saldo Awal)</span>
          </label>
          <MoneyInput
            id="prior-bp-umkm"
            value={priorBPInput}
            onChange={setPriorBPInput}
            onBlurCommit={() => onSaveSaldoBuktiPotong(Number(priorBPInput) || 0)}
            placeholder="0"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Total PPh Pasal 22 yang sudah dipotong marketplace (sesuai bukti potong) sejak awal tahun
            pajak hingga bulan lalu. Isi bila Anda baru mulai memakai aplikasi di tengah tahun. Angka ini
            tersimpan otomatis.
          </p>
        </div>

        <div className="mt-4">
          <label htmlFor="current-bp-umkm" className="mb-1.5 block text-sm font-medium">
            Total Bukti Potong PPh 22 Periode Berjalan
          </label>
          <MoneyInput
            id="current-bp-umkm"
            value={currentBPInput}
            onChange={setCurrentBPInput}
            onBlurCommit={() => onSaveBuktiPotongBerjalan(Number(currentBPInput) || 0)}
            placeholder="0"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Isi manual sesuai bukti potong dari marketplace/platform bulan ini (mis. Shopee, Tokopedia,
            dll). Angka ini tersimpan otomatis.
          </p>
        </div>

        <div className="mt-4 space-y-2.5 border-t border-border pt-3">
          <Row label="Akumulasi bukti potong PPh 22 s.d. bulan lalu" value={formatRp(priorBP)} />
          <Row label="Bukti potong PPh 22 periode berjalan" value={`+ ${formatRp(currentBP)}`} />
          <div className="border-t border-border pt-2.5">
            <Row label="Total bukti potong PPh 22 (setahun)" value={formatRp(totalBP)} bold />
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-2.5">
          <Row label="PPh Final Terutang (setahun)" value={formatRp(taxYear)} />
          <Row label="Bukti Potong PPh 22 (setahun)" value={`- ${formatRp(totalBP)}`} />
        </div>

        <div
          className={`mt-3 rounded-xl border p-4 ${
            lebihBayarBP ? "border-emerald-200 bg-emerald-50" : "border-pink-200 bg-pink-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {lebihBayarBP ? "PPh Lebih Bayar (setahun)" : "PPh Kurang Bayar (setahun)"}
            </span>
            <span className={`text-2xl font-bold ${lebihBayarBP ? "text-emerald-700" : "text-pink-700"}`}>
              {formatRp(Math.abs(selisihBP))}
            </span>
          </div>
          {!lebihBayarBP ? (
            <div className="mt-2 flex items-center justify-between border-t border-pink-200/70 pt-2">
              <span className="text-xs text-muted-foreground">Estimasi PPh rata-rata per bulan</span>
              <span className="text-sm font-semibold">{formatRp(taxMonthlyAfterBP)}</span>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Bukti potong melebihi PPh Final terutang; kelebihan dapat dikompensasikan atau diminta
              kembali (restitusi) melalui SPT Tahunan.
            </p>
          )}
        </div>
      </Card>

      <Card className="bg-muted/40">
        <div className="flex gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Tentang PP 55/2022 & PMK 37/2025</p>
            Wajib Pajak orang pribadi UMKM dengan peredaran bruto sampai Rp 4,8 miliar setahun
            dikenai PPh Final 0,5%. Bagian omzet sampai Rp 500 juta pertama dalam satu tahun pajak
            tidak dikenai pajak, sehingga akumulasi omset bulan-bulan sebelumnya ikut menentukan sisa
            batas bebas pajak untuk periode berjalan. PMK 37/2025 menunjuk marketplace/platform
            sebagai pemungut PPh Pasal 22 0,5% atas transaksi perdagangan elektronik (rencana efektif
            1 November 2026); bagi pedagang UMKM, pungutan ini diperhitungkan sebagai pelunasan PPh
            Final. Perhitungan ini adalah estimasi; konsultasikan dengan konsultan pajak untuk
            kepastian.
          </div>
        </div>
      </Card>
    </div>

    <TaxPrintReport
      title="Laporan Pajak UMKM (PPh Final 0,5%)"
      subtitle="PP 55/2022 sebagaimana diubah PP 20/2026 & PMK 37/2025"
      taxpayerName={taxpayerName}
      taxpayerNpwp={taxpayerNpwp}
      periodLabel={periodLabel}
      rows={[
        { label: "Akumulasi omset s.d. bulan lalu", value: formatRp(prior) },
        {
          label: useAppIncome ? "Omset penjualan periode berjalan" : "Omset periode berjalan",
          value: `+ ${formatRp(current)}`,
        },
        { label: "Batas bebas pajak (setahun)", value: formatRp(EXEMPTION) },
        { label: "Sisa batas bebas pajak", value: formatRp(remainingExemption) },
        { label: "Omzet kena pajak periode ini", value: formatRp(taxableCurrent), bold: true },
        { label: "Tarif PPh Final", value: "0,5%" },
        { label: "PPh Final terutang (periode ini)", value: formatRp(taxCurrent), bold: true },
        { label: "Estimasi setoran per bulan", value: formatRp(monthly) },
        { label: "Proyeksi PPh Final setahun", value: formatRp(taxYear) },
        { label: "Akumulasi bukti potong PPh 22 s.d. bulan lalu", value: formatRp(priorBP) },
        { label: "Bukti potong PPh 22 periode berjalan", value: `+ ${formatRp(currentBP)}` },
        { label: "Total bukti potong PPh 22 (setahun)", value: formatRp(totalBP), bold: true },
        { label: "PPh Final Terutang (setahun)", value: formatRp(taxYear) },
        { label: "Bukti Potong PPh 22 (setahun)", value: `- ${formatRp(totalBP)}` },
        {
          label: lebihBayarBP ? "PPh Lebih Bayar (setahun)" : "PPh Kurang Bayar Setelah Bukti Potong (setahun)",
          value: formatRp(Math.abs(selisihBP)),
          bold: true,
        },
        { label: "Estimasi PPh rata-rata per bulan", value: formatRp(taxMonthlyAfterBP) },
      ]}
      lineItemsTitle="Rincian Penjualan & Piutang Bisnis"
      lineItems={salesLines.map((l) => ({
        label: l.label,
        date: formatTaxDate(l.date),
        amount: formatRp(l.amount),
      }))}
      totalLabel="Total Omset Setahun"
      totalValue={formatRp(totalOmzet)}
    />
    </>
  )
}

function MoneyInput({
  id,
  value,
  onChange,
  onBlurCommit,
  placeholder,
  disabled,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  onBlurCommit?: () => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        Rp
      </span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlurCommit}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  )
}

function formatTaxDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]?.slice(0, 3) ?? ""} ${d.getFullYear()}`
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  )
}
