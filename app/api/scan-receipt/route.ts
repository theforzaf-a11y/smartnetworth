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

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const prompt = `Analisis foto struk/faktur ini dan kembalikan JSON murni tanpa markdown/backticks.
Format JSON:
{
  "merchant": "nama toko",
  "date": "YYYY-MM-DD",
  "total": angka_nominal,
  "items": [{"name": "nama barang", "price": angka_nominal}]
}`;

    // Memanggil model yang diminta Google untuk API Key terbarumu
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error dari Google Gemini API', details: data.error?.message || data },
        { status: response.status }
      );
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = textResult.replace(/```json|```/g, '').replace(/```/g, '').trim();

    try {
      return NextResponse.json(JSON.parse(cleanJson));
    } catch {
      return NextResponse.json({ rawText: textResult });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses struk dengan AI', details: error.message },
      { status: 500 }
    );
  }
}
