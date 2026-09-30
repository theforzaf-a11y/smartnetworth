"use client"

export interface PrintRow {
  label: string
  value: string
  bold?: boolean
}

export interface PrintLineItem {
  label: string
  date: string
  amount: string
}

interface TaxPrintReportProps {
  title: string
  subtitle: string
  taxpayerName: string
  taxpayerNpwp: string
  periodLabel: string
  rows: PrintRow[]
  lineItems?: PrintLineItem[]
  lineItemsTitle?: string
  totalLabel: string
  totalValue: string
}

/**
 * Laporan versi cetak/PDF — disembunyikan di layar (hidden), hanya tampil saat
 * mencetak/menyimpan PDF lewat browser (print:block). Dipakai sebagai lampiran
 * pendukung laporan pajak (UMKM/Profesi), bukan dokumen resmi DJP.
 */
export function TaxPrintReport({
  title,
  subtitle,
  taxpayerName,
  taxpayerNpwp,
  periodLabel,
  rows,
  lineItems = [],
  lineItemsTitle,
  totalLabel,
  totalValue,
}: TaxPrintReportProps) {
  const printedAt = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="hidden print:block print:text-black">
      <style>{`
        @media print {
          @page { margin: 16mm; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="mb-4 border-b-2 border-black pb-3">
        <p className="text-lg font-bold">SmartNetWorth</p>
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm">{subtitle}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="font-semibold">Nama Wajib Pajak:</span> {taxpayerName || "-"}
        </div>
        <div>
          <span className="font-semibold">NPWP:</span> {taxpayerNpwp || "-"}
        </div>
        <div className="col-span-2">
          <span className="font-semibold">Periode:</span> {periodLabel}
        </div>
      </div>

      <table className="mb-4 w-full border-collapse text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-black/20">
              <td className={"py-1.5 pr-3 " + (r.bold ? "font-bold" : "")}>{r.label}</td>
              <td className={"py-1.5 text-right " + (r.bold ? "font-bold" : "")}>{r.value}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-black">
            <td className="py-2 pr-3 font-bold">{totalLabel}</td>
            <td className="py-2 text-right font-bold">{totalValue}</td>
          </tr>
        </tbody>
      </table>

      {lineItems.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold">{lineItemsTitle}</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-1 pr-2">Keterangan</th>
                <th className="py-1 pr-2">Tanggal</th>
                <th className="py-1 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i} className="border-b border-black/10">
                  <td className="py-1 pr-2">{li.label}</td>
                  <td className="py-1 pr-2">{li.date}</td>
                  <td className="py-1 text-right">{li.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-6 text-[10px] leading-relaxed text-black/70">
        Laporan ini dihasilkan otomatis oleh aplikasi SmartNetWorth pada {printedAt}, berdasarkan data
        yang diinput sendiri oleh Wajib Pajak. Bukan dokumen resmi Direktorat Jenderal Pajak — gunakan
        sebagai lampiran pendukung perhitungan pribadi, dan pastikan kesesuaiannya dengan bukti/catatan
        asli sebelum dilaporkan.
      </p>
    </div>
  )
}
