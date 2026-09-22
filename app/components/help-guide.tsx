"use client"

import { useState } from "react"
import {
  X,
  HelpCircle,
  BookOpen,
  MessageCircleQuestion,
  ChevronDown,
  LayoutDashboard,
  PlusCircle,
  Coins,
  Scale,
  HandCoins,
  Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface HelpGuideProps {
  onClose: () => void
}

type HelpTab = "panduan" | "faq"

const PAGE_GUIDES = [
  {
    icon: LayoutDashboard,
    color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15",
    title: "Ringkasan",
    desc:
      "Menampilkan gambaran umum kekayaan bersih Anda: total harta, total hutang, dan selisih pemasukan-pengeluaran. Gunakan tombol Semua / Pribadi / Bisnis di atas untuk menyaring data yang ditampilkan.",
  },
  {
    icon: PlusCircle,
    color: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/15",
    title: "Catat Keuangan",
    desc:
      "Tempat mencatat semua transaksi. Ada 4 jenis (warna beda-beda saat aktif): Pengeluaran (merah), Pemasukan (hijau), Transfer / Investasi Harta (biru), dan Bayar Hutang/Cicilan (kuning). Bisa diisi manual, difoto pakai Pindai Struk dengan AI, atau diucapkan lewat Catat dengan Suara.",
  },
  {
    icon: Coins,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15",
    title: "Harta Lancar",
    desc:
      "Daftar aset yang mudah dicairkan seperti kas, saldo bank, dan tabungan. Angka di sini otomatis berubah setiap kali Anda mencatat transaksi yang memakai metode 'Kas / Bank'.",
  },
  {
    icon: Scale,
    color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15",
    title: "Hutang & Liabilitas",
    desc:
      "Daftar hutang, cicilan, atau PayLater yang masih berjalan beserta sisa pokok dan angsuran per bulan. Gunakan tab 'Bayar Hutang/Cicilan' di Catat Keuangan untuk mencatat pembayaran, yang otomatis mengurangi sisa hutang di sini.",
  },
  {
    icon: HandCoins,
    color: "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/15",
    title: "Piutang",
    desc:
      "Daftar uang yang dipinjamkan ke orang lain atau tagihan yang belum dibayar pelanggan. Berguna untuk memantau siapa saja yang masih berhutang kepada Anda.",
  },
  {
    icon: Receipt,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/15",
    title: "Pajak",
    desc:
      "Rekap yang membantu memperkirakan kewajiban pajak dari transaksi Bisnis yang sudah dicatat, sehingga tidak perlu menghitung manual satu per satu.",
  },
]

const FAQ_ITEMS = [
  {
    q: "Bagaimana cara mencatat transaksi baru?",
    a: "Buka tab 'Catat Keuangan', pilih jenis transaksi (Pengeluaran, Pemasukan, Transfer/Investasi Harta, atau Bayar Hutang/Cicilan), lalu isi Judul, Nominal, Tanggal, dan Kategori. Anda juga bisa memakai Pindai Struk dengan AI (foto/upload struk) atau Catat dengan Suara supaya form terisi otomatis.",
  },
  {
    q: "Kenapa Kategori berubah otomatis saat saya mengetik Judul/Keterangan?",
    a: "Aplikasi mendeteksi kata kunci dari judul yang Anda ketik (misalnya 'listrik' akan otomatis memilih kategori Tagihan) supaya Anda tidak perlu memilih kategori secara manual. Anda tetap bisa mengganti kategori secara manual kapan saja lewat dropdown Kategori.",
  },
  {
    q: "Apa bedanya metode pembayaran Kas/Bank dan Kartu Kredit/PayLater?",
    a: "'Kas / Bank' berarti uang langsung keluar dari saldo Harta Lancar Anda. 'Kartu Kredit / PayLater' berarti transaksi menambah hutang baru di halaman Hutang & Liabilitas, karena Anda belum membayar tunai saat itu.",
  },
  {
    q: "Kenapa fitur Scan Struk dan Catat Suara ada batas kuota?",
    a: "Kedua fitur ini memakai AI (Gemini) yang berbayar per pemakaian, jadi kuota dibatasi supaya biaya tetap terkendali. Kuota bisa diatur ulang oleh admin lewat ikon kunci di pojok kanan atas (perlu Master Admin Password).",
  },
  {
    q: "Apa beda entitas Pribadi dan Bisnis?",
    a: "Setiap transaksi dicatat di bawah salah satu entitas: Pribadi atau Bisnis. Ini memudahkan memisahkan keuangan pribadi dan usaha dalam satu aplikasi. Gunakan tombol Semua / Pribadi / Bisnis di bagian atas untuk melihat data gabungan atau salah satunya saja.",
  },
  {
    q: "Di mana data saya disimpan? Apakah aman?",
    a: "Data disimpan di perangkat/browser yang Anda pakai. Karena itu, gunakan perangkat yang sama secara konsisten, dan hindari menekan tombol Reset (ikon putar ulang) kecuali memang ingin mengembalikan data ke contoh awal.",
  },
  {
    q: "Bagaimana cara mengganti kode akses aplikasi?",
    a: "Tekan ikon kunci (KeyRound) di pojok kanan atas, masukkan Master Admin Password, lalu isi kode akses baru pada bagian 'Ubah Kode Akses'.",
  },
  {
    q: "Kenapa transaksi Pemasukan sempat tersimpan sebagai Pengeluaran (atau sebaliknya) lewat Catat Suara?",
    a: "Ini sudah diperbaiki. Sistem sekarang mendeteksi otomatis jenis transaksi (pemasukan/pengeluaran) dari isi ucapan Anda sebelum mengisi form, jadi tab yang aktif akan mengikuti jenis transaksi yang benar.",
  },
]

export function HelpGuide({ onClose }: HelpGuideProps) {
  const [tab, setTab] = useState<HelpTab>("panduan")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Penggunaan"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400">
              <HelpCircle className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight">Panduan & FAQ</h2>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Cara pakai SmartNetWorth
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Tutup" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1">
          <button
            onClick={() => setTab("panduan")}
            className={[
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              tab === "panduan"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <BookOpen className="size-4" />
            Panduan
          </button>
          <button
            onClick={() => setTab("faq")}
            className={[
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              tab === "faq"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <MessageCircleQuestion className="size-4" />
            FAQ
          </button>
        </div>

        <div className="-mx-1 overflow-y-auto px-1">
          {tab === "panduan" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Penjelasan singkat tiap halaman di SmartNetWorth:
              </p>
              {PAGE_GUIDES.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="flex gap-3 rounded-xl border border-border p-3"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {FAQ_ITEMS.map((item, i) => {
                const open = openFaq === i
                return (
                  <div key={item.q} className="rounded-xl border border-border">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                    >
                      <span className="text-sm font-medium">{item.q}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {open ? (
                      <p className="px-3 pb-3 text-xs leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
