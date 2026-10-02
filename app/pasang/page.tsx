"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Smartphone,
  Apple,
  Check,
  MessageCircle,
  Sparkles,
  Clock,
  Copy,
  CheckCircle2,
  Receipt,
  Wallet,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const WA_NUMBER_DISPLAY = "089673478796"
const WA_LINK = "https://wa.me/6289673478796"
const APP_LINK = "smartnetworth.vantageglobalinsights.com"

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400">
        {num}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

function PlanCard({
  name,
  price,
  period,
  features,
  bonus,
  plus,
  featured,
  badge,
}: {
  name: string
  price: string
  period: string
  features: string[]
  bonus?: string
  plus?: string
  featured?: boolean
  badge?: string
}) {
  return (
    <div
      className={`relative rounded-2xl border p-5 ${
        featured ? "border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-border"
      } bg-card`}
    >
      {badge ? (
        <span
          className={`absolute -top-3 left-5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${
            featured ? "bg-indigo-600" : "bg-emerald-500"
          }`}
        >
          {badge}
        </span>
      ) : null}
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-bold">{name}</span>
        <span className="font-bold">
          {price} <span className="text-xs font-medium text-muted-foreground">/{period}</span>
        </span>
      </div>
      <ul className="space-y-2 text-[13px]">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <span>{f}</span>
          </li>
        ))}
        {bonus ? (
          <li className="flex items-start gap-2 font-medium text-indigo-600 dark:text-indigo-400">
            <MessageCircle className="mt-0.5 size-4 shrink-0" />
            <span>{bonus}</span>
          </li>
        ) : null}
        {plus ? (
          <li className="flex items-start gap-2 font-medium text-emerald-600 dark:text-emerald-400">
            <Sparkles className="mt-0.5 size-4 shrink-0" />
            <span>{plus}</span>
          </li>
        ) : null}
      </ul>
      {bonus ? (
        <p className="mt-2 pl-6 text-[11px] text-muted-foreground">
          *Sharing pengalaman praktis, bukan pengganti konsultasi pajak resmi/berbayar.
        </p>
      ) : null}
    </div>
  )
}

export default function PasangPage() {
  const [tab, setTab] = useState<"android" | "ios">("android")
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APP_LINK)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // noop — clipboard may be unavailable
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-background to-blue-50 px-4 py-10 dark:from-indigo-950/40 dark:via-background dark:to-blue-950/30">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <Wallet className="size-7" />
          </span>
          <h1 className="text-xl font-bold tracking-tight">SmartNetWorth</h1>
          <p className="mt-1 text-sm text-muted-foreground">Panduan pemasangan & paket berlangganan</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-bold">
            Catat keuangan UMKM & pribadi, lengkap dengan kontrol pajak otomatis
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            SmartNetWorth membantu Anda mencatat transaksi harian, memantau harta, hutang, piutang,
            dan laba/rugi — sekaligus menghitung Pajak UMKM & Pajak Profesi secara otomatis dari data
            yang Anda catat sendiri.
          </p>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3.5 dark:border-indigo-900 dark:bg-indigo-950/40">
            <Store className="mt-0.5 size-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                Baru: Monitor PPh 22 Marketplace (PMK 37/2025)
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
                Sejak 1 Oktober 2026, Shopee, Tokopedia, Blibli & Lazada motong PPh Pasal 22 dari tiap
                transaksi jualan online Anda. SmartNetWorth otomatis mencocokkan potongan ini dengan
                PPh Final UMKM Anda — langsung kelihatan kurang bayar atau lebih bayar, tanpa hitung manual.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
            <Clock className="size-4 shrink-0" />
            Coba gratis 3 hari untuk semua paket — tanpa perlu kartu kredit.
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-1 text-base font-bold">Pasang di layar utama HP Anda</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Setelah dipasang, SmartNetWorth bisa dibuka langsung dari ikon di layar utama — tanpa
            perlu buka browser atau ketik alamat web lagi.
          </p>

          <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setTab("android")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                tab === "android"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="size-4" /> Android
            </button>
            <button
              type="button"
              onClick={() => setTab("ios")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                tab === "ios"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Apple className="size-4" /> iPhone
            </button>
          </div>

          {tab === "android" ? (
            <div className="space-y-2.5">
              <Step num={1} title="Buka link di Chrome">
                Ketuk link SmartNetWorth di bawah ini menggunakan <b>Chrome</b>.
              </Step>
              <Step num={2} title="Ketuk titik tiga">
                Ketuk ikon ⋮ (titik tiga) di pojok kanan atas layar Chrome.
              </Step>
              <Step num={3} title='Pilih "Install app"'>
                Cari dan ketuk <b>"Install app"</b> atau <b>"Add to Home screen"</b> di menu tersebut.
              </Step>
              <Step num={4} title='Ketuk "Install"'>
                Muncul kotak konfirmasi dengan logo SmartNetWorth — ketuk <b>Install</b>.
              </Step>
            </div>
          ) : (
            <div className="space-y-2.5">
              <Step num={1} title="Buka link di Safari">
                Ketuk link SmartNetWorth di bawah ini menggunakan <b>Safari</b> (harus Safari, bukan Chrome).
              </Step>
              <Step num={2} title="Ketuk ikon Bagikan">
                Ketuk ikon Share/Bagikan (kotak dengan panah ke atas) di bagian bawah layar Safari.
              </Step>
              <Step num={3} title='Pilih "Add to Home Screen"'>
                Geser ke bawah pada menu yang muncul, lalu ketuk <b>"Add to Home Screen"</b>.
              </Step>
              <Step num={4} title='Ketuk "Add"'>
                Ketuk <b>Add</b> di pojok kanan atas untuk menyelesaikan pemasangan.
              </Step>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            Selesai! Ikon SmartNetWorth akan muncul di layar utama, siap dibuka kapan saja.
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background p-2.5">
            <a
              href={`https://${APP_LINK}`}
              className="flex-1 truncate text-xs font-medium text-indigo-600 underline underline-offset-2"
            >
              {APP_LINK}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                copied ? "bg-emerald-500/15 text-emerald-600" : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <Copy className="size-3.5" />
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
            Tap tulisan link di atas untuk langsung buka halaman Daftar/Masuk SmartNetWorth.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-1 text-base font-bold">Paket Berlangganan</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Semua paket termasuk pencatatan kekayaan, hutang, piutang, dan laba/rugi tanpa batas.
          </p>

          <div className="space-y-3">
            <PlanCard
              name="Hemat"
              price="Rp19.900"
              period="bulan"
              features={["Input manual tanpa batas", "Scan struk & catat suara — 5x / bulan"]}
            />
            <PlanCard
              name="Lengkap"
              price="Rp29.900"
              period="bulan"
              featured
              badge="Paling Populer"
              features={["Input manual tanpa batas", "Scan struk & catat suara — 50x / bulan"]}
              bonus="Bonus: tanya-jawab ringan seputar pajak UMKM & Pajak Profesi lewat grup WhatsApp komunitas — langsung ke pembuat aplikasi, mantan konsultan pajak Big Four (top dunia/Indonesia)"
            />
            <PlanCard
              name="Tahunan"
              price="Rp299.000"
              period="tahun"
              badge="Hemat 2 Bulan"
              features={[
                "Input manual tanpa batas",
                "Scan struk & catat suara — 50x / bulan",
                "Cukup bayar 10 bulan, gratis 2 bulan (setara Rp24.900/bulan)",
              ]}
              bonus="Bonus: tanya-jawab ringan seputar pajak UMKM & Pajak Profesi lewat grup WhatsApp komunitas"
              plus="Plus: prioritas dijawab & bisa tanya personal, serta diundang ke live webinar tanya-jawab pajak berkala bersama founder"
            />
          </div>

          <div className="mt-4 rounded-xl bg-muted/60 p-3.5 text-[13px] leading-relaxed text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Cara berlangganan:</p>
            1. Pasang & daftar akun — otomatis dapat <b>trial gratis 3 hari</b>.<br />
            2. Setelah trial, pilih paket & chat admin via WhatsApp untuk info rekening transfer.<br />
            3. Kirim bukti transfer via WhatsApp — akun diaktifkan maksimal 1x24 jam.
          </div>
        </div>

        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-lg shadow-emerald-500/20"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <MessageCircle className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Butuh bantuan atau mau berlangganan?</span>
            <span className="block text-xs opacity-90">{WA_NUMBER_DISPLAY}</span>
          </span>
          <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-700">Chat WA</span>
        </a>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-indigo-600 underline">
            Kembali ke SmartNetWorth
          </Link>
        </div>
      </div>
    </main>
  )
}
