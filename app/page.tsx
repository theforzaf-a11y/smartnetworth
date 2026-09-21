'use client';

import React, { useState } from 'react';

export default function Dashboard() {
  const [segment, setSegment] = useState<'semua' | 'pribadi' | 'bisnis'>('semua');
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [isScanning, setIsScanning] = useState(false);

  // State Form Input Transaksi
  const [deskripsi, setDeskripsi] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [kategori, setKategori] = useState('Kas');
  const [jenis, setJenis] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');

  // State Data Transaksi & Akun
  const [transaksi, setTransaksi] = useState<Array<{ id: number; deskripsi: string; jumlah: number; jenis: string; kategori: string; tanggal: string }>>([]);
  const [kas, setKas] = useState(0);
  const [piutang, setPiutang] = useState(0);
  const [hutang, setHutang] = useState(0);

  // Fungsi Scan Struk via API Gemini
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
      if (res.ok) {
        const totalScan = data.total || 0;
        const merchantScan = data.merchant || 'Pembelian/Faktur';
        
        setDeskripsi(`Scan: ${merchantScan}`);
        setJumlah(totalScan.toString());
        setJenis('pengeluaran');
        
        alert(`Berhasil Membaca Struk!\nMerchant: ${merchantScan}\nTotal: Rp ${totalScan.toLocaleString('id-ID')}`);
      } else {
        alert(`Gagal scan: ${data.details || data.error}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsScanning(false);
    }
  };

  // Tambah Transaksi Manual
  const handleAddTransaksi = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(jumlah);
    if (!deskripsi || isNaN(val) || val <= 0) return;

    const newTx = {
      id: Date.now(),
      deskripsi,
      jumlah: val,
      jenis,
      kategori,
      tanggal: new Date().toLocaleDateString('id-ID'),
    };

    setTransaksi([newTx, ...transaksi]);

    if (kategori === 'Kas') {
      setKas(prev => jenis === 'pemasukan' ? prev + val : prev - val);
    } else if (kategori === 'Piutang') {
      setPiutang(prev => jenis === 'pemasukan' ? prev - val : prev + val);
    } else if (kategori === 'Hutang') {
      setHutang(prev => jenis === 'pemasukan' ? prev + val : prev - val);
    }

    setDeskripsi('');
    setJumlah('');
  };

  const totalHarta = kas + piutang;
  const kekayaanBersih = totalHarta - hutang;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">SmartNetWorth</h1>
              <p className="text-xs text-slate-500">Kelola kekayaan bersih Anda</p>
            </div>
          </div>

          {/* Tombol Scan Struk */}
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition">
            <span>📷 {isScanning ? 'Memproses Struk...' : 'Scan Faktur / Struk'}</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleScanReceipt}
              disabled={isScanning}
            />
          </label>
        </div>

        {/* Filter Segmentasi */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit text-xs font-semibold">
          {(['semua', 'pribadi', 'bisnis'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              className={`px-4 py-1.5 rounded-lg capitalize transition ${
                segment === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Tab Navigasi */}
        <div className="flex border-b border-slate-200 gap-6 overflow-x-auto text-sm font-medium">
          {[
            { id: 'ringkasan', label: 'Ringkasan' },
            { id: 'catat', label: 'Catat Keuangan' },
            { id: 'harta', label: 'Harta Lancar' },
            { id: 'hutang', label: 'Hutang & Liabilitas' },
            { id: 'piutang', label: 'Piutang' },
            { id: 'pajak', label: 'Pajak' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 whitespace-nowrap transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Konten Tab Ringkasan */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Ringkasan Kekayaan</h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  Kas & kewajiban
                </span>
              </div>
              <p className="text-xs text-slate-400">Ikuti alurnya: uang yang tersedia + piutang - hutang</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600">Sisa Uang (Kas)</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    Rp {kas.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                  <p className="text-xs font-semibold text-sky-600">Total Piutang</p>
                  <p className="text-2xl font-bold text-sky-900 mt-1">
                    Rp {piutang.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                  <p className="text-xs font-semibold text-rose-600">Total Hutang</p>
                  <p className="text-2xl font-bold text-rose-900 mt-1">
                    Rp {hutang.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-600">Kekayaan Bersih</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">
                    Rp {kekayaanBersih.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">(Sisa Uang + Piutang) - Hutang</p>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 font-medium">
                Total Harta = Sisa Uang + Total Piutang = <span className="font-bold text-slate-700">Rp {totalHarta.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Riwayat Transaksi */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-md font-bold text-slate-900">Hasil Scan Faktur & Transaksi Terakhir</h3>
              {transaksi.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                  <p>Belum ada transaksi faktur yang dicatat.</p>
                  <p>Klik tombol <b>Scan Faktur / Struk</b> di kanan atas untuk membaca foto faktur secara otomatis.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transaksi.map(tx => (
                    <div key={tx.id} className="py-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{tx.deskripsi}</p>
                        <p className="text-xs text-slate-400">{tx.tanggal} • {tx.kategori}</p>
                      </div>
                      <span className={`font-bold ${tx.jenis === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.jenis === 'pemasukan' ? '+' : '-'} Rp {tx.jumlah.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Konten Tab Catat Keuangan */}
        {activeTab === 'catat' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Catat Transaksi Manual</h2>
            <form onSubmit={handleAddTransaksi} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi / Keterangan</label>
                <input 
                  type="text" 
                  value={deskripsi}
                  onChange={e => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Belanja Bulanan / Pembayaran Invoice"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah (Rp)</label>
                  <input 
                    type="number" 
                    value={jumlah}
                    onChange={e => setJumlah(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Transaksi</label>
                  <select 
                    value={jenis}
                    onChange={e => setJenis(e.target.value as 'pemasukan' | 'pengeluaran')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pengeluaran">Pengeluaran (-)</option>
                    <option value="pemasukan">Pemasukan (+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Akun</label>
                  <select 
                    value={kategori}
                    onChange={e => setKategori(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Kas">Kas / Bank</option>
                    <option value="Piutang">Piutang</option>
                    <option value="Hutang">Hutang</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl text-sm transition"
              >
                Simpan Transaksi
              </button>
            </form>
          </div>
        )}

        {/* Tab Lainnya */}
        {activeTab === 'harta' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Harta Lancar (Kas & Bank)</h2>
            <p className="text-sm text-slate-600">Total Kas Terseimpan: <span className="font-bold text-blue-600">Rp {kas.toLocaleString('id-ID')}</span></p>
          </div>
        )}

        {activeTab === 'hutang' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Hutang & Liabilitas</h2>
            <p className="text-sm text-slate-600">Total Hutang Aktif: <span className="font-bold text-rose-600">Rp {hutang.toLocaleString('id-ID')}</span></p>
          </div>
        )}

        {activeTab === 'piutang' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Piutang</h2>
            <p className="text-sm text-slate-600">Total Piutang Belum Terbayar: <span className="font-bold text-sky-600">Rp {piutang.toLocaleString('id-ID')}</span></p>
          </div>
        )}

        {activeTab === 'pajak' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Estimasi Pajak</h2>
            <p className="text-sm text-slate-500">Estimasi pencatatan pajak berdasarkan total penghasilan/pemasukan.</p>
          </div>
        )}

      </div>
    </div>
  );
}
