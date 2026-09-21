"use client"

import { useRef, useState } from "react"
import {
  Upload,
  Camera,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mic,
  MicOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/finance-ui"
import {
  ASSET_CATEGORIES,
  type Entity,
  EXPENSE_CATEGORIES,
  formatRp,
  INCOME_CATEGORIES,
  type Liability,
  type PaymentMethod,
  type Transaction,
  type TxType,
} from "@/lib/finance"
import { EntitySelector } from "@/components/entity-toggle"
import { fileToDataUrl, scanReceipt, parseVoiceTransaction } from "@/lib/gemini"
import { useAccess } from "@/lib/access-context"

type SubTab = "expense" | "income" | "asset" | "debt"

const SUBTABS: { key: SubTab; label: string }[] = [
  { key: "expense", label: "Pengeluaran" },
  { key: "income", label: "Pemasukan" },
  { key: "asset", label: "Transfer / Investasi Harta" },
  { key: "debt", label: "Bayar Hutang/Cicilan" },
]

const CATEGORY_MAP: Record<Exclude<SubTab, "debt">, readonly string[]> = {
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES,
  asset: ASSET_CATEGORIES,
}

interface TabCatatProps {
  onAdd: (tx: Omit<Transaction, "id">) => void
  liabilities: Liability[]
  onPay: (id: string, amount: number, date: string) => void
  /** Record a credit / PayLater expense; raises a liability instead of using cash. */
  onAddCredit: (tx: Omit<Transaction, "id" | "type" | "paymentMethod">, liabilityId: string | null) => void
  prefillDebtId?: string | null
  defaultEntity?: Entity
}

export function TabCatat({
  onAdd,
  liabilities,
  onPay,
  onAddCredit,
  prefillDebtId,
  defaultEntity = "pribadi",
}: TabCatatProps) {
  const { scanQuota, maxScanQuota, consumeScan, voiceQuota, maxVoiceQuota, consumeVoice } = useAccess()
  const quotaExhausted = scanQuota <= 0
  const voiceQuotaExhausted = voiceQuota <= 0
  const [sub, setSub] = useState<SubTab>(prefillDebtId ? "debt" : "expense")
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [entity, setEntity] = useState<Entity>(defaultEntity)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  // "" = auto-create a new PayLater liability; otherwise an existing liability id.
  const [creditLiabilityId, setCreditLiabilityId] = useState<string>("")
  const [saved, setSaved] = useState(false)

  const [uploadLoading, setUploadLoading] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [ocrError, setOcrError] = useState("")
  const [ocrSuccess, setOcrSuccess] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [voiceProcessing, setVoiceProcessing] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [voiceConfirmPending, setVoiceConfirmPending] = useState(false)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef("")

  const uploadRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  function switchSub(next: SubTab) {
    setSub(next)
    if (next !== "debt") setCategory(CATEGORY_MAP[next][0])
  }

  function resetForm() {
    setTitle("")
    setAmount("")
    if (sub !== "debt") setCategory(CATEGORY_MAP[sub][0])
    setDate(new Date().toISOString().slice(0, 10))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!title.trim() || !amt || amt <= 0) return
    const base = {
      title: title.trim(),
      amount: Math.round(amt),
      category,
      date,
      entity,
    }
    if (sub === "expense" && paymentMethod === "credit") {
      // Credit / PayLater: counts as spending but raises a liability instead of cash.
      onAddCredit(base, creditLiabilityId || null)
    } else {
      onAdd({ ...base, type: sub as TxType })
    }
    resetForm()
    setSaved(true)
    setVoiceConfirmPending(false)
    setOcrSuccess("")
    setTimeout(() => setSaved(false), 2000)
  }

  async function runOcr(file: File, source: "upload" | "camera") {
    setOcrError("")
    setOcrSuccess("")
    // Reserve one scan from the device quota before calling the AI.
    if (!consumeVoice()) {
      setOcrError(
        `Masa uji coba Catat Suara telah habis (0/${maxVoiceQuota}). Hubungi Admin SmartNetWorth untuk upgrade akses.`,
      )
      return
    }
    const setLoading = source === "upload" ? setUploadLoading : setCameraLoading
    setLoading(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      const result = await scanReceipt(dataUrl)
      // OCR always fills the expense form.
      if (sub !== "expense") switchSub("expense")
      setTitle(result.title)
      setAmount(String(result.amount))
      setCategory(EXPENSE_CATEGORIES.includes(result.category as never) ? result.category : "Lainnya")
      setDate(result.date)
      setOcrSuccess(`Struk terbaca: ${result.title}`)
    } catch (err) {
      console.log("[v0] OCR error:", err)
      setOcrError(err instanceof Error ? err.message : "Gagal memindai struk")
    } finally {
      setLoading(false)
    }
  }

  function getSpeechRecognition(): any {
    if (typeof window === "undefined") return null
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    return SpeechRecognitionCtor ? new SpeechRecognitionCtor() : null
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop()
  }

  function startVoiceInput() {
    setOcrError("")
    setOcrSuccess("")
    setVoiceTranscript("")
    setVoiceConfirmPending(false)
    transcriptRef.current = ""

    if (!consumeVoice()) {
      setOcrError(
        `Masa uji coba Catat Suara telah habis (0/${maxVoiceQuota}). Hubungi Admin SmartNetWorth untuk upgrade akses.`,
      )
      return
    }

    const recognition = getSpeechRecognition()
    if (!recognition) {
      setOcrError("Perangkat/browser ini tidak mendukung input suara. Coba gunakan Google Chrome.")
      return
    }

    recognition.lang = "id-ID"
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      let finalText = ""
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript
      }
      transcriptRef.current = finalText
      setVoiceTranscript(finalText)
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      setOcrError(
        event.error === "not-allowed"
          ? "Izin mikrofon ditolak. Aktifkan akses mikrofon di pengaturan browser."
          : "Gagal merekam suara, coba lagi.",
      )
    }

    recognition.onend = async () => {
      setIsListening(false)
      recognitionRef.current = null
      const finalText = transcriptRef.current.trim()
      if (!finalText) {
        setOcrError("Tidak ada suara yang terdeteksi. Coba lagi.")
        return
      }
      setVoiceProcessing(true)
      try {
        const result = await parseVoiceTransaction(finalText)
        if (sub !== "expense") switchSub("expense")
        setTitle(result.title)
        setAmount(String(result.amount))
        setCategory(EXPENSE_CATEGORIES.includes(result.category as never) ? result.category : "Lainnya")
        setDate(result.date)
        setOcrSuccess(`Suara terbaca: "${finalText}" → ${result.title}`)
        setVoiceConfirmPending(true)
      } catch (err) {
        setOcrError(err instanceof Error ? err.message : "Gagal memproses ucapan")
      } finally {
        setVoiceProcessing(false)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const categories = sub === "debt" ? [] : CATEGORY_MAP[sub]

  return (
    <div className="space-y-5">
      {/* OCR Section */}
      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Pindai Struk dengan AI</h3>
              <p className="text-xs text-muted-foreground">Gemini AI Scanner — otomatis mengisi form</p>
            </div>
          </div>
          <span
            className={
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset " +
              (quotaExhausted
                ? "bg-destructive/10 text-destructive ring-destructive/20"
                : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20")
            }
          >
            Sisa Kuota Scan AI: {scanQuota}/{maxScanQuota}
          </span>
        </div>

        {quotaExhausted ? (
          <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            Masa uji coba Scan AI telah habis (0/{maxScanQuota}). Hubungi Admin SmartNetWorth untuk
            upgrade akses.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) runOcr(f, "upload")
              e.target.value = ""
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) runOcr(f, "camera")
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-1.5 py-4"
            disabled={uploadLoading || cameraLoading || isListening || voiceProcessing || quotaExhausted}
            onClick={() => uploadRef.current?.click()}
          >
            {uploadLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
            <span className="text-sm font-medium">
              {uploadLoading ? "Memproses..." : "Unggah Struk"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-1.5 py-4"
            disabled={uploadLoading || cameraLoading || isListening || voiceProcessing || quotaExhausted}
            onClick={() => cameraRef.current?.click()}
          >
            {cameraLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Camera className="size-5" />
            )}
            <span className="text-sm font-medium">
              {cameraLoading ? "Memproses..." : "Ambil Foto"}
            </span>
          </Button>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Catat via Suara (Premium)</span>
            <span
              className={
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset " +
                (voiceQuotaExhausted
                  ? "bg-destructive/10 text-destructive ring-destructive/20"
                  : "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20")
              }
            >
              {voiceQuota}/{maxVoiceQuota}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-auto w-full flex-row items-center justify-center gap-2 py-3"
            disabled={uploadLoading || cameraLoading || voiceProcessing || voiceQuotaExhausted}
            onClick={isListening ? stopVoiceInput : startVoiceInput}
          >
            {isListening ? (
              <MicOff className="size-5 animate-pulse text-rose-600" />
            ) : voiceProcessing ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Mic className="size-5" />
            )}
            <span className="text-sm font-medium">
              {isListening
                ? "Mendengarkan... (ketuk untuk berhenti)"
                : voiceProcessing
                  ? "Memproses ucapan..."
                  : "Catat dengan Suara"}
            </span>
          </Button>
        </div>

        {isListening && voiceTranscript ? (
          <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs italic text-muted-foreground">
            "{voiceTranscript}"
          </p>
        ) : null}

        {ocrError ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {ocrError}
          </p>
        ) : null}
        {ocrSuccess ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            {ocrSuccess}
          </p>
        ) : null}

        {voiceConfirmPending ? (
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
              onClick={() => setVoiceConfirmPending(false)}
            >
              <CheckCircle2 className="size-4" />
              Ya, Sudah Benar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400"
              onClick={() => {
                setTitle("")
                setAmount("")
                setCategory(EXPENSE_CATEGORIES[0])
                setDate(new Date().toISOString().slice(0, 10))
                setVoiceConfirmPending(false)
                setOcrSuccess("")
                startVoiceInput()
              }}
            >
              <Mic className="size-4" />
              Ulangi Rekam
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Form Section */}
      <Card>
        {/* Sub-tab switcher */}
        <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-muted p-1">
          {SUBTABS.map((s) => (
            <button
              key={s.key}
              onClick={() => switchSub(s.key)}
              className={cnTab(sub === s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {sub === "debt" ? (
          <DebtPaymentForm liabilities={liabilities} onPay={onPay} initialId={prefillDebtId} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Entitas</label>
              <EntitySelector value={entity} onChange={setEntity} />
            </div>
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
                Judul / Keterangan
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth. Belanja bulanan"
                className={inputClass}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="amount" className="mb-1.5 block text-sm font-medium">
                  Nominal (Rp)
                </label>
                <input
                  id="amount"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="date" className="mb-1.5 block text-sm font-medium">
                  Tanggal
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-medium">
                Kategori
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {sub === "expense" ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <PaymentMethodOption
                    active={paymentMethod === "cash"}
                    onClick={() => setPaymentMethod("cash")}
                    emoji="💵"
                    title="Kas / Bank"
                    desc="Mengurangi Harta Lancar"
                    tone="emerald"
                  />
                  <PaymentMethodOption
                    active={paymentMethod === "credit"}
                    onClick={() => setPaymentMethod("credit")}
                    emoji="💳"
                    title="Kartu Kredit / PayLater"
                    desc="Menambah Hutang"
                    tone="rose"
                  />
                </div>

                {paymentMethod === "credit" ? (
                  <div className="mt-3">
                    <label htmlFor="credit-liability" className="mb-1.5 block text-sm font-medium">
                      Bebankan ke Kartu Kredit / Hutang
                    </label>
                    <select
                      id="credit-liability"
                      value={creditLiabilityId}
                      onChange={(e) => setCreditLiabilityId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">+ Buat liabilitas PayLater baru otomatis</option>
                      {liabilities.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} — sisa {formatRp(l.principal)}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Pengeluaran ini tidak mengurangi kas, melainkan menambah saldo hutang yang
                      dipilih.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full">
              {saved ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Tersimpan!
                </>
              ) : (
                "Simpan Transaksi"
              )}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}

function DebtPaymentForm({
  liabilities,
  onPay,
  initialId,
}: {
  liabilities: Liability[]
  onPay: (id: string, amount: number, date: string) => void
  initialId?: string | null
}) {
  const active = liabilities.filter((l) => l.principal > 0)
  const prefill =
    initialId && active.some((l) => l.id === initialId) ? initialId : active[0]?.id ?? ""
  const prefillLoan = liabilities.find((l) => l.id === prefill)
  const [selectedId, setSelectedId] = useState<string>(prefill)
  const [amount, setAmount] = useState(() =>
    prefillLoan ? String(Math.min(prefillLoan.monthlyPayment || prefillLoan.principal, prefillLoan.principal)) : "",
  )
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [saved, setSaved] = useState(false)

  const selected = liabilities.find((l) => l.id === selectedId)

  if (active.length === 0) {
    return (
      <p className="rounded-lg bg-muted/60 px-3 py-6 text-center text-sm text-muted-foreground">
        Belum ada hutang aktif. Tambahkan hutang di tab &quot;Hutang &amp; Liabilitas&quot; terlebih
        dahulu.
      </p>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    const amt = Number(amount)
    if (!amt || amt <= 0) return
    onPay(selected.id, Math.round(amt), date)
    setAmount("")
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // Move selection off a loan that just got fully paid.
    const remaining = Math.max(0, selected.principal - Math.round(amt))
    if (remaining <= 0) {
      const next = liabilities.find((l) => l.id !== selected.id && l.principal > 0)
      setSelectedId(next?.id ?? "")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="debt-select" className="mb-1.5 block text-sm font-medium">
          Pilih Hutang / Cicilan
        </label>
        <select
          id="debt-select"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value)
            const l = liabilities.find((x) => x.id === e.target.value)
            if (l) setAmount(String(Math.min(l.monthlyPayment || l.principal, l.principal)))
          }}
          className={inputClass}
        >
          {active.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} — sisa {formatRp(l.principal)}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
          <div>
            <p className="text-muted-foreground">Sisa Pokok</p>
            <p className="mt-0.5 font-semibold text-rose-600 dark:text-rose-400">
              {formatRp(selected.principal)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Angsuran / Bulan</p>
            <p className="mt-0.5 font-semibold">{formatRp(selected.monthlyPayment)}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="debt-amount" className="mb-1.5 block text-sm font-medium">
            Nominal Bayar (Rp)
          </label>
          <input
            id="debt-amount"
            type="number"
            inputMode="numeric"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="debt-date" className="mb-1.5 block text-sm font-medium">
            Tanggal
          </label>
          <input
            id="debt-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Pembayaran akan mengurangi saldo Kas dan otomatis memotong sisa pokok hutang.
      </p>

      <Button type="submit" size="lg" className="w-full">
        {saved ? (
          <>
            <CheckCircle2 className="size-4" />
            Pembayaran Tercatat!
          </>
        ) : (
          "Bayar Cicilan"
        )}
      </Button>
    </form>
  )
}

function PaymentMethodOption({
  active,
  onClick,
  emoji,
  title,
  desc,
  tone,
}: {
  active: boolean
  onClick: () => void
  emoji: string
  title: string
  desc: string
  tone: "emerald" | "rose"
}) {
  const activeClass =
    tone === "emerald"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition " +
        (active ? activeClass : "border-input bg-background hover:bg-muted")
      }
    >
      <span className="text-sm font-semibold">
        <span aria-hidden="true" className="mr-1">
          {emoji}
        </span>
        {title}
      </span>
      <span className="text-[11px] font-normal text-muted-foreground">{desc}</span>
    </button>
  )
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"

function cnTab(active: boolean) {
  return [
    "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm",
    active
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground",
  ].join(" ")
}
