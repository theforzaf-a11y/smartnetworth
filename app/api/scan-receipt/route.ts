import { NextResponse } from 'next/server';

// Coba model utama dulu; kalau overload/gagal, otomatis pindah ke model cadangan.
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

async function callGemini(model: string, apiKey: string, prompt: string, mimeType: string, base64Data: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          },
        ],
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

    const { dataUrl } = await req.json();

    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json(
        { error: 'Gambar tidak ditemukan' },
        { status: 400 }
      );
    }

    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: 'Format gambar tidak valid' },
        { status: 400 }
      );
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const prompt = `Analisis foto struk/faktur ini dan kembalikan JSON murni tanpa markdown/backticks.
Format JSON:
{
  "title": "nama toko atau keterangan singkat transaksi",
  "amount": angka_nominal_total,
  "category": "kategori pengeluaran yang paling sesuai, misal Makanan/Transportasi/Belanja/Tagihan/Hiburan/Kesehatan/Lainnya",
  "date": "YYYY-MM-DD"
}`;

    let lastErrorMessage = 'Gagal memproses struk dengan AI';
    let lastStatus = 500;

    // Coba tiap model di daftar, masing-masing dengan beberapa kali retry saat overload.
    for (const model of MODELS) {
      for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
        const result = await callGemini(model, apiKey, prompt, mimeType, base64Data);

        if (result.ok) {
          const textResult = result.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanJson = textResult.replace(/```json|```/g, '').trim();

          let parsed: any;
          try {
            parsed = JSON.parse(cleanJson);
          } catch {
            return NextResponse.json(
              { error: 'Gagal membaca hasil AI, coba foto ulang dengan pencahayaan lebih baik' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            title: parsed.title || parsed.merchant || 'Scan Struk',
            amount: Number(parsed.amount ?? parsed.total ?? 0),
            category: parsed.category || 'Lainnya',
            date: parsed.date || new Date().toISOString().split('T')[0],
          });
        }

        const errMessage = result.data?.error?.message || `Error ${result.status}`;
        lastErrorMessage = errMessage;
        lastStatus = result.status;

        // Kalau bukan masalah overload (misal API key salah / quota habis), tidak perlu retry, langsung lompat ke model berikutnya.
        if (!isOverloadedError(errMessage)) break;

        // Masih ada percobaan tersisa untuk model ini → tunggu sebentar lalu coba lagi.
        if (attempt < MAX_RETRIES_PER_MODEL) {
          await sleep(RETRY_DELAY_MS);
        }
      }
      // Lanjut ke model fallback berikutnya.
    }

    // Semua model & percobaan gagal.
    return NextResponse.json(
      {
        error: isOverloadedError(lastErrorMessage)
          ? 'Server AI sedang sangat sibuk. Coba scan ulang beberapa saat lagi.'
          : lastErrorMessage,
      },
      { status: lastStatus }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses struk dengan AI: ' + error.message },
      { status: 500 }
    );
  }
}
