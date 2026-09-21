'use client';

import { useState } from 'react';

interface Transaction {
  id: string;
  merchant: string;
  date: string;
  total: number;
  items: { name: string; price: number }[];
  category: string;
}

export default function Home() {
  const [activeScope, setActiveScope] = useState<'Semua' | 'Pribadi' | 'Bisnis'>('Semua');
  const [activeTab, setActiveTab] = useState<string>('Ringkasan');
  
  // State untuk Scan Struk / Faktur
  const [isScanning, setIsScanning] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentScan, setRecentScan] = useState<Transaction | null>(null);

  // Perhitungan Keuangan Dinamis
  const totalPengeluaran = transactions.reduce((acc, curr) => acc + curr.total, 0);
  const sisaKas = 0 - totalPengeluaran; // Saldo kas disesuaikan dengan pengeluaran terdeteksi

  // Handler Upload & Scan Faktur via API Gemini
  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Gagal scan: ${data.details || data.error || 'Terjadi kesalahan'}`);
        return;
      }

      const newTx: Transaction = {
        id: Date.now().toString(),
        merchant: data.merchant || 'Toko / Vendor Tidak Dikenal',
        date: data.date || new Date().toISOString().split('T')[0],
        total: Number(data.total) || 0,
        items: Array.isArray(data.items) ? data.items : [],
        category: 'Pengeluaran',
      };

      setTransactions((prev) => [newTx, ...prev]);
      setRecentScan(newTx);
      alert(`Struk Berhasil Dibaca!\nMerchant: ${newTx.merchant}\nTotal: Rp ${newTx.total.toLocaleString('id-ID')}`);
    } catch (err: any) {
      alert(`Error memproses faktur: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans p-4 md:p-8 max-w-7xl mx-auto">
      {/* HEADER UTAMA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-blue-200 shadow-lg">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SmartNetWorth</h1>
            <p className="text-xs text-slate-500">Kelola kekayaan bersih Anda</p>
          </div>
        </div>

        {/* TOMBOL UTAMA SCAN FAKTUR */}
        <div className="flex items-center gap-3">
          <label className={`cursor-pointer px-4 py-2.5 rounded-xl font-medium text-sm transition flex items-center gap-2 shadow-sm ${
            isScanning ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
          }`}>
            <span>📷</span>
            <span>{isScanning ? 'Menganalisis Struk...' : 'Scan Faktur / Struk'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleScanReceipt}
              disabled={isScanning}
            />
          </label>
        </div>
      </header>

      {/* NAVIGASI CHIP KATEGORI (Semua / Pribadi / Bisnis) */}
      <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl w-fit mb-6 text-xs font-semibold">
        {(['Semua', 'Pribadi', 'Bisnis'] as const).map((scope) => (
          <button
            key={scope}
            onClick={() => setActiveScope(scope)}
            className={`px-5 py-2 rounded-lg transition ${
              activeScope === scope ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {scope}
          </button>
        ))}
      </div>

      {/* TAB NAVIGATION MENU */}
      <div className="flex gap-6 border-b border-slate-200/80 mb-6 text-sm overflow-x-auto pb-1 scrollbar-none">
        {['Ringkasan', 'Catat Keuangan', 'Harta Lancar', 'Hutang & Liabilitas', 'Piutang', 'Pajak'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-medium whitespace-nowrap pb-3 transition relative ${
              activeTab === tab ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* KONTEN TAB: RINGKASAN KEKAYAAN */}
      {activeTab === 'Ringkasan' && (
        <div className="space-y-6">
          {/* RINGKASAN KEKAYAAN CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-800">Ringkasan Kekayaan</h2>
                <p className="text-xs text-slate-400">Ikuti alurnya: uang yang tersedia + piutang - hutang</p>
              </div>
              <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-600 rounded-full">
                Kas & kewajiban
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sisa Uang / Kas */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <span className="text-xs font-medium text-blue-600">Sisa Uang (Kas)</span>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  Rp {sisaKas.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Total Piutang */}
              <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                <span className="text-xs font-medium text-sky-600">Total Piutang</span>
                <p className="text-2xl font-bold text-sky-700 mt-1">Rp 0</p>
              </div>

              {/* Total Hutang */}
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <span className="text-xs font-medium text-rose-600">Total Hutang</span>
                <p className="text-2xl font-bold text-rose-700 mt-1">Rp 0</p>
              </div>

              {/* Kekayaan Bersih */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-xs font-medium text-emerald-600">Kekayaan Bersih</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  Rp {sisaKas.toLocaleString('id-ID')}
                </p>
                <span className="text-[10px] text-emerald-500 font-normal">
                  (Sisa Uang + Piutang) - Hutang
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-4">
              Total Harta = Sisa Uang + Total Piutang = Rp {sisaKas.toLocaleString('id-ID')}
            </p>
          </div>

          {/* RIWAYAT TRANSAKSI DARI SCAN FAKTUR */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Hasil Scan Faktur & Transaksi Terakhir</h3>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm">Belum ada transaksi faktur yang dicatat.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Klik tombol <strong>Scan Faktur / Struk</strong> di kanan atas untuk membaca foto faktur secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{tx.merchant}</span>
                        <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-medium">
                          {tx.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{tx.date}</p>

                      {tx.items.length > 0 && (
                        <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                          {tx.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between max-w-xs text-slate-500">
                              <span>• {item.name}</span>
                              <span>Rp {item.price.toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400">Total Pengeluaran</span>
                      <p className="text-base font-bold text-rose-600">
                        - Rp {tx.total.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KONTEN TAB LAINNYA */}
      {activeTab !== 'Ringkasan' && (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400">
          <p className="text-base font-medium text-slate-600 mb-1">Menu {activeTab}</p>
          <p className="text-xs">Halaman menu ini siap dikembangkan lebih lanjut sesuai kebutuhan pencatatan keuangan Anda.</p>
        </div>
      )}
    </div>
  );
}
