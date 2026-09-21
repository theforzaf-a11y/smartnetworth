import { NextResponse } from 'next/server';

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
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

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Error dari Google Gemini API' },
        { status: response.status }
      );
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses struk dengan AI: ' + error.message },
      { status: 500 }
    );
  }
}
