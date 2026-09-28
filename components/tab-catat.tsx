"use client"

import { useEffect, useRef, useState } from "react"
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
  PROFESI_CATEGORY,
  suggestCategory,
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

  // Pemasukan kategori Freelance = penghasilan praktik/jasa profesi.
  // Selalu dicatat sebagai "Pribadi" agar masuk Pajak Profesi, bukan Omset UMKM.
  const isProfesi = sub === "income" && category === PROFESI_CATEGORY

  useEffect(() => {
    if (isProfesi && entity !== "pribadi") setEntity("pribadi")
  }, [isProfesi, entity])

  function handleEntityChange(next: Entity) {
    if (isProfesi) return
    setEntity(next)
  }

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
      entity: isProfesi ? ("pribadi" as Entity) : entity,
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
        const detectedType: SubTab = result.type === "income" ? "income" : "expense"
        if (sub !== detectedType) switchSub(detectedType)
        const categoryList = detectedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
        setTitle(result.title)
        setAmount(String(result.amount))
        setCategory(categoryList.includes(result.category as never) ? result.category : "Lainnya")
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
