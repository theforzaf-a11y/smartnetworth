"use client"

import { useEffect, useMemo, useState } from "react"
import { Briefcase, Info, Wand2, Check } from "lucide-react"
import { Card, CardTitle } from "@/components/finance-ui"
import {
  formatRp,
  MONTH_NAMES_ID,
  PROFESI_CATEGORY,
  totalProfesiIncome,
  type Transaction,
} from "@/lib/finance"

const PROFESI_PRESET = [
  { id: "tenaga-ahli", label: "Dokter / Pengacara / Notaris / Konsultan", pct: 50 },
  { id: "custom", label: "Profesi lain (isi tarif sendiri)", pct: 50 },
] as const

const TANGGUNGAN_UNIT = 4_500_000
const PTKP_BASE = 54_000_000
const MAX_TANGGUNGAN = 3

const BRACKETS = [
  { upTo: 60_000_000, rate: 0.05 },
  { upTo: 250_000_000, rate: 0.15 },
  { upTo: 500_000_000, rate: 0.25 },
  { upTo: 5_000_000_000, rate: 0.3 },
  { upTo: Infinity, rate: 0.35 },
]

function progressiveTax(pkp: number): { total: number; rows: { range: string; rate: number; base: number; tax: number }[] } {
  let remaining = Math.max(0, pkp)
  let lower = 0
  let total = 0
  const rows: { range: string; rate: number; base: number; tax: number }[] = []
  for (const b of BRACKETS) {
    if (remaining <= 0) break
    const bracketSize = b.upTo - lower
    const taxableInBracket = Math.min(remaining, bracketSize)
    if (taxableInBracket > 0) {
      const tax = taxableInBracket * b.rate
      total += tax
      rows.push({
        range:
          b.upTo === Infinity
            ? `> ${formatRp(lower)}`
            : `${formatRp(lower)} – ${formatRp(b.upTo)}`,
        rate: b.rate,
        base: taxableInBracket,
        tax,
      })
      remaining -= taxableInBracket
    }
    lower = b.upTo
  }
  return { total, rows }
}

interface TabPajakProfesiProps {
  /** Transaksi entity "pribadi" (pemasukan praktik profesi dicatat di sini). */
  transactions: Transaction[]
  /** Persisted "Akumulasi Penghasilan s.d. Bulan Lalu" untuk penghasilan profesi. */
  saldoAwalProfesi: number
  onSaveSaldoProfesi: (value: number) => void
}

export function TabPajakProfesi({
  transactions,
  saldoAwalProfesi,
  onSaveSaldoProfesi,
}: TabPajakProfesiProps) {
  const [profesiId, setProfesiId] = useState<(typeof PROFESI_PRESET)[number]["id"]>("tenaga-ahli")
  const [customPct, setCustomPct] = useState("50")
  const [kawin, setKawin] = useState(false)
  const [tanggungan, setTanggungan] = useState(0)

  const pct = profesiId === "custom" ? Number(customPct) || 0 : 50

  // Penghasilan periode berjalan dari kategori "Freelance" (praktik/jasa profesi) di Catat Keuangan.
  const periodeIncome = useMemo(() => totalProfesiIncome(transactions), [transactions])

  const profesiLines = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income" && t.category === PROFESI_CATEGORY)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions])

  // Akumulasi penghasilan s.d. bulan lalu (saldo awal) — tersimpan permanen di database
  const [priorInput, setPriorInput] = useState(saldoAwalProfesi ? String(saldoAwalProfesi) : "")
  // Penghasilan periode berjalan bila diinput manual
  const [manualCurrent, setManualCurrent] = useState("")
  // Toggle: gunakan penghasilan kategori Freelance dari Catat Keuangan sebagai periode berjalan
  const [useAppIncome, setUseAppIncome] = useState(true)

  useEffect(() => {
    setPriorInput(saldoAwalProfesi ? String(saldoAwalProfesi) : "")
  }, [saldoAwalProfesi])

  const prior = Number(priorInput) || 0
  const current = useAppIncome ? periodeIncome : Number(manualCurrent) || 0

  const bruto = prior + current
  const netto = Math.round(bruto * (pct / 100))

  const ptkp = useMemo(() => {
    const tanggunganTerhitung = Math.min(tanggungan, MAX_TANGGUNGAN)
    return PTKP_BASE + (kawin ? TANGGUNGAN_UNIT : 0) + tanggunganTerhitung * TANGGUNGAN_UNIT
  }, [kawin, tanggungan])

  const pkp = Math.max(0, netto - ptkp)
  const { total: taxYear, rows: taxRows } = useMemo(() => progressiveTax(pkp), [pkp])
  const taxMonthly = Math.round(taxYear / 12)

  const statusLabel = `${kawin ? "K" : "TK"}/${Math.min(tanggungan, MAX_TANGGUNGAN)}`

  return (
    <div className="space-y-5">
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-700">
            <Briefcase className="size-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold">Kalkulator Pajak Profesi (NPPN)</h3>
            <p className="text-xs text-muted-foreground">Norma Penghitungan Penghasilan Neto — Pasal 17 UU PPh</p>
          </div>
        </div>

        <label className="mb-1.5 block text-sm font-medium">Jenis Profesi</label>
        <select
          value={profesiId}
          onChange={(e) => setProfesiId(e.target.value as (typeof PROFESI_PRESET)[number]["id"])}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
        >
          {PROFESI_PRESET.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        <div className="mt-4">
          <label htmlFor="pct-netto" className="mb-1.5 block text-sm font-medium">
            % Norma Penghasilan Neto
          </label>
          <div className="relative">
            <input
              id="pct-netto"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              value={profesiId === "custom" ? customPct : "50"}
              onChange={(e) => setCustomPct(e.target.value)}
              disabled={profesiId !== "custom"}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-8 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Default 50% untuk dokter, pengacara, notaris &amp; konsultan. Persentase norma berbeda-beda
            tergantung jenis profesi &amp; wilayah — ubah sendiri bila berbeda.
          </p>
        </div>

        <div className="mt-4">
          <label htmlFor="prior-profesi" className="mb-1.5 block text-sm font-medium">
            Akumulasi Penghasilan s.d. Bulan Lalu
            <span className="ml-1 font-normal text-muted-foreground">(Saldo Awal)</span>
          </label>
          <MoneyInput
            id="prior-profesi"
            value={priorInput}
            onChange={setPriorInput}
            onBlurCommit={() => onSaveSaldoProfesi(Number(priorInput) || 0)}
            placeholder="0"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Total penghasilan bruto praktik/jasa profesi yang sudah tercatat sejak awal tahun pajak
            hingga bulan lalu. Angka ini tersimpan otomatis.
          </p>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="current-profesi" className="block text-sm font-medium">
              Penghasilan Periode Berjalan{" "}
              <span className="font-normal text-muted-foreground">(Khusus Kategori Freelance)</span>
            </label>
          </div>
          <MoneyInput
            id="current-profesi"
            value={useAppIncome ? String(periodeIncome) : manualCurrent}
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
              ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700"
              : "border-input bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          {useAppIncome ? <Check className="size-3.5" /> : <Wand2 className="size-3.5" />}
          Gunakan Penghasilan dari Catat Keuangan (Kategori Freelance)
        </button>
        {useAppIncome ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Penghasilan periode berjalan menghitung pemasukan berkategori{" "}
            <span className="font-medium text-foreground">Freelance</span> (praktik/jasa profesi):{" "}
            {formatRp(periodeIncome)}. Pemasukan lain (Penjualan, Gaji, Bonus, Investasi, dll.) tidak
            dihitung. Catat penghasilan praktik/jasa Anda di tab "Catat Keuangan" dengan kategori{" "}
            <span className="font-medium text-foreground">Freelance</span> agar otomatis masuk ke sini.
          </p>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Total Penghasilan Bruto Setahun</CardTitle>
        <div className="mt-3 space-y-2.5">
          <Row label="Akumulasi penghasilan s.d. bulan lalu" value={formatRp(prior)} />
          <Row
            label={useAppIncome ? "Penghasilan profesi periode berjalan" : "Penghasilan periode berjalan"}
            value={`+ ${formatRp(current)}`}
          />
          <div className="border-t border-border pt-2.5">
            <Row label="Total penghasilan bruto setahun" value={formatRp(bruto)} bold />
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Rincian Penghasilan Profesi</CardTitle>
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
          Seluruh pemasukan berkategori Freelance yang membentuk penghasilan periode berjalan
        </p>
        {profesiLines.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada penghasilan profesi (kategori Freelance) tercatat.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Keterangan</th>
                  <th className="py-2 pr-3 font-medium">Tanggal</th>
                  <th className="py-2 text-right font-medium">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {profesiLines.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 font-medium">{t.title}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{formatTaxDate(t.date)}</td>
                    <td className="py-2 text-right font-semibold">{formatRp(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold">
                  <td className="py-2 pr-3" colSpan={2}>
                    Total Penghasilan Profesi
                  </td>
                  <td className="py-2 text-right text-fuchsia-700">{formatRp(periodeIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Rincian Penghasilan Neto</CardTitle>
        <div className="mt-3 space-y-2.5">
          <Row label="Penghasilan bruto setahun" value={formatRp(bruto)} />
          <Row label={`Norma penghasilan neto (${pct}%)`} value={formatRp(netto)} bold />
          <div className="border-t border-border pt-2.5">
            <Row label="Penghasilan Tidak Kena Pajak (PTKP)" value={`- ${formatRp(ptkp)}`} />
          </div>
          <div className="border-t border-border pt-2.5">
            <Row label="Penghasilan Kena Pajak (PKP)" value={formatRp(pkp)} bold />
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setKawin(false)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
            !kawin
              ? "border-fuchsia-600 bg-fuchsia-600 text-white"
              : "border-input bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          Tidak Kawin
        </button>
        <button
          type="button"
          onClick={() => setKawin(true)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
            kawin
              ? "border-fuchsia-600 bg-fuchsia-600 text-white"
              : "border-input bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          Kawin
        </button>
      </div>

      <Card>
        <label htmlFor="tanggungan" className="mb-1.5 block text-sm font-medium">
          Jumlah Tanggungan <span className="font-normal text-muted-foreground">(maks. 3)</span>
        </label>
        <select
          id="tanggungan"
          value={tanggungan}
          onChange={(e) => setTanggungan(Number(e.target.value))}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
        >
          <option value={0}>0</option>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Status PTKP: <span className="font-medium text-foreground">{statusLabel}</span> — {formatRp(ptkp)}
          /tahun
        </p>
      </Card>

      {pkp > 0 ? (
        <Card>
          <CardTitle>Rincian Tarif Progresif Pasal 17</CardTitle>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Lapisan PKP</th>
                  <th className="py-2 pr-3 text-right font-medium">Tarif</th>
                  <th className="py-2 text-right font-medium">Pajak</th>
                </tr>
              </thead>
              <tbody>
                {taxRows.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3">{r.range}</td>
                    <td className="py-2 pr-3 text-right">{(r.rate * 100).toFixed(0)}%</td>
                    <td className="py-2 text-right font-semibold">{formatRp(r.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">PPh Terutang (setahun)</span>
            <span className="text-2xl font-bold text-fuchsia-700">{formatRp(taxYear)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-fuchsia-200/70 pt-2">
            <span className="text-xs text-muted-foreground">Estimasi rata-rata per bulan</span>
            <span className="text-sm font-semibold">{formatRp(taxMonthly)}</span>
          </div>
        </div>
        {bruto > 0 && pkp === 0 ? (
          <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
            Penghasilan neto masih di bawah PTKP — belum ada PPh terutang.
          </p>
        ) : null}
      </Card>

      <Card className="bg-muted/40">
        <div className="flex gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Tentang NPPN (Norma Penghitungan Penghasilan Neto)</p>
            Wajib Pajak orang pribadi yang menjalankan pekerjaan bebas (dokter, pengacara, notaris,
            konsultan, dll.) dan memenuhi syarat boleh menghitung penghasilan neto memakai persentase
            norma dari Direktorat Jenderal Pajak, alih-alih pembukuan penuh. Persentase norma berbeda
            menurut jenis pekerjaan &amp; wilayah (KLU). Hasil penghasilan neto dikurangi PTKP, sisanya
            dikenai tarif progresif Pasal 17 UU PPh. Perhitungan ini adalah estimasi; konsultasikan
            dengan konsultan pajak untuk kepastian & penentuan KLU/persentase norma yang berlaku.
          </div>
        </div>
      </Card>
    </div>
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
