import type { Metadata } from "next"
import Link from "next/link"
import { PiggyBank, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Kebijakan Privasi — SmartNetWorth",
  description: "Kebijakan privasi aplikasi SmartNetWorth",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-base font-semibold text-slate-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}

export default function KebijakanPrivasiPage() {
  const lastUpdated = "2 Oktober 2026"

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-background to-blue-50 px-4 py-10 dark:from-indigo-950/40 dark:via-background dark:to-blue-950/30">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <PiggyBank className="size-7" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SmartNetWorth</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" />
            Kebijakan Privasi
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="mb-6 text-xs text-muted-foreground">Terakhir diperbarui: {lastUpdated}</p>

          <p className="mb-6 text-sm leading-relaxed text-slate-600">
            SmartNetWorth ("Aplikasi") adalah aplikasi pencatatan keuangan untuk UMKM dan pribadi.
            Kebijakan Privasi ini menjelaskan data apa saja yang kami kumpulkan, bagaimana data itu
            digunakan dan disimpan, serta hak Anda atas data tersebut. Dengan menggunakan Aplikasi,
            Anda menyetujui praktik yang dijelaskan di sini, sesuai dengan Undang-Undang Nomor 27
            Tahun 2022 tentang Pelindungan Data Pribadi.
          </p>

          <Section title="1. Data yang Kami Kumpulkan">
            <p>Kami mengumpulkan data berikut saat Anda menggunakan Aplikasi:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <b>Data akun:</b> alamat email dan password (terenkripsi), atau data profil dasar
                (nama, email) bila Anda masuk lewat Google.
              </li>
              <li>
                <b>Data keuangan yang Anda input sendiri:</b> catatan transaksi, saldo awal, data
                harta, hutang, piutang, dan perhitungan pajak. Seluruh data ini Anda masukkan
                sendiri secara sukarela untuk keperluan pencatatan pribadi/usaha Anda.
              </li>
              <li>
                <b>Foto struk & rekaman suara (opsional):</b> hanya jika Anda memakai fitur Scan
                Struk atau Catat Suara, untuk diproses menjadi catatan transaksi otomatis.
              </li>
            </ul>
          </Section>

          <Section title="2. Bagaimana Data Digunakan">
            <p>Data yang Anda berikan digunakan semata-mata untuk:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Menjalankan fungsi inti Aplikasi — mencatat dan menampilkan data keuangan Anda.</li>
              <li>Mengautentikasi Anda saat masuk ke akun.</li>
              <li>Memproses foto struk/rekaman suara menjadi catatan transaksi (fitur opsional).</li>
            </ul>
            <p>
              Kami tidak menjual, menyewakan, atau membagikan data Anda ke pihak ketiga untuk
              tujuan pemasaran.
            </p>
          </Section>

          <Section title="3. Di Mana Data Disimpan & Pihak Ketiga">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <b>Supabase</b> — menyimpan data akun dan data keuangan Anda di server cloud yang
                aman, terenkripsi saat transit (HTTPS).
              </li>
              <li>
                <b>Vercel</b> — menghosting aplikasi web SmartNetWorth.
              </li>
              <li>
                <b>Google (Sign-in & Gemini API)</b> — bila Anda masuk lewat Google, atau memakai
                fitur Scan Struk/Catat Suara, data terkait diproses lewat layanan Google sesuai
                kebijakan privasi Google.
              </li>
            </ul>
          </Section>

          <Section title="4. Keamanan & Akses Data">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Data keuangan Anda hanya dapat diakses oleh akun Anda sendiri (dan siapa pun yang
                Anda beri email/password akun yang sama secara sengaja, misalnya staf usaha Anda).
              </li>
              <li>
                Fitur <b>Mode Edit / Mode Lihat Saja</b> dan <b>PIN Edit</b> membantu mencegah
                perubahan data yang tidak disengaja dari perangkat lain.
              </li>
              <li>Password akun disimpan terenkripsi, tidak pernah dalam bentuk teks biasa.</li>
            </ul>
          </Section>

          <Section title="5. Hak Anda">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <b>Menghapus seluruh data:</b> tersedia lewat tombol "Hapus Semua Data" di dalam
                Aplikasi (memerlukan Mode Edit aktif).
              </li>
              <li>
                <b>Menghapus akun sepenuhnya:</b> hubungi kami melalui kontak di bagian 7.
              </li>
              <li>
                <b>Mengubah password & PIN Edit:</b> tersedia mandiri lewat menu "Pengaturan Akun
                Saya" tanpa perlu menghubungi kami.
              </li>
            </ul>
          </Section>

          <Section title="6. Anak di Bawah Umur">
            <p>
              Aplikasi ini ditujukan untuk pengguna dewasa yang mengelola keuangan pribadi/usaha,
              dan tidak secara sengaja mengumpulkan data dari anak di bawah umur.
            </p>
          </Section>

          <Section title="7. Kontak">
            <p>
              Pertanyaan seputar privasi atau permintaan terkait data Anda dapat disampaikan ke:{" "}
              <a href="mailto:theforzaf@gmail.com" className="font-medium text-indigo-600 underline">
                theforzaf@gmail.com
              </a>
            </p>
          </Section>

          <Section title="8. Perubahan Kebijakan">
            <p>
              Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan dicerminkan
              pada tanggal "Terakhir diperbarui" di atas.
            </p>
          </Section>

          <div className="mt-8 border-t border-border pt-4 text-center">
            <Link href="/" className="text-sm font-medium text-indigo-600 underline">
              Kembali ke SmartNetWorth
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
