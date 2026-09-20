'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    if (!file) return alert('Pilih foto faktur/struk dulu!');
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Gagal memproses faktur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-lg mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">SmartNetWorth - Scan Faktur</h1>
      <div className="space-y-4 border p-4 rounded-xl shadow-sm">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          onClick={handleScan}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium disabled:bg-gray-400"
        >
          {loading ? 'Memproses...' : 'Scan Faktur'}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 border rounded-xl">
          <h2 className="font-semibold mb-2">Hasil Ekstraksi Gemini:</h2>
          <pre className="text-xs overflow-x-auto bg-white p-3 rounded border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
