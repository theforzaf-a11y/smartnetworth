import { NextResponse } from 'next/server';

const MODELS = ['gemini-3.6-flash', 'gemini-3.1-flash-lite'];
const MAX_RETRIES_PER_MODEL = 2;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isOverloadedError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes('overload') ||
    m.includes('high demand') ||
    m.includes('unavailable') ||
    m.includes('try again')
  );
}

async function callGemini(model: string, apiKey: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum dipasang di Vercel' },
        { status: 500 }
      );
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Teks ucapan tidak ditemukan' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const prompt = `Kamu adalah asisten yang mengekstrak informasi transaksi keuangan dari ucapan pengguna berbahasa Indonesia.
Ekstrak informasi berikut dari teks di bawah, lalu kembalikan JSON murni tanpa markdown/backticks.

Format JSON:
{
  "type": "expense atau income",
  "title": "keterangan singkat transaksi",
  "amount": angka_nominal_dalam_rupiah_tanpa_pemisah_ribuan,
  "category": "kategori yang paling sesuai dengan jenis transaksinya",
  "date": "YYYY-MM-DD"
}

Aturan:
- "type" = "income" jika transaksi berupa uang MASUK/diterima, contoh: penjualan, gaji, bonus, terima pembayaran, pendapatan.
- "type" = "expense" jika transaksi berupa uang KELUAR/dibayarkan, contoh: belanja, bayar tagihan, beli sesuatu, berobat, jajan.
- Jika ragu, gunakan "expense".
- Jika tanggal tidak disebutkan secara eksplisit, gunakan tanggal hari ini: ${today}.
- Jika kategori tidak jelas, gunakan "Lainnya".
- "amount" harus berupa angka murni, tanpa "Rp", titik, atau koma.

Teks ucapan pengguna: "${text}"`;

    let lastErrorMessage = 'Gagal memproses ucapan dengan AI';
    let lastStatus = 500;

    for (const model of MODELS) {
      for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
        const result = await callGemini(model, apiKey, prompt);

        if (result.ok) {
          const textResult = result.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanJson = textResult.replace(/```json|```/g, '').trim();

          let parsed: any;
          try {
            parsed = JSON.parse(cleanJson);
          } catch {
            return NextResponse.json(
              { error: 'Gagal memahami ucapan, coba ulangi dengan lebih jelas' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            type: parsed.type === 'income' ? 'income' : 'expense',
            title: parsed.title || 'Transaksi Suara',
            amount: Number(parsed.amount ?? 0),
            category: parsed.category || 'Lainnya',
            date: parsed.date || today,
          });
        }

        const errMessage = result.data?.error?.message || `Error ${result.status}`;
        lastErrorMessage = errMessage;
        lastStatus = result.status;

        if (!isOverloadedError(errMessage)) break;
        if (attempt < MAX_RETRIES_PER_MODEL) await sleep(RETRY_DELAY_MS);
      }
    }

    return NextResponse.json(
      {
        error: isOverloadedError(lastErrorMessage)
          ? 'Server AI sedang sangat sibuk. Coba ulangi beberapa saat lagi.'
          : lastErrorMessage,
      },
      { status: lastStatus }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses ucapan dengan AI: ' + error.message },
      { status: 500 }
    );
  }
}
