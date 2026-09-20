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

    // Daftar model yang akan dicoba satu per satu sesuai kompatibilitas API Key
    const candidateModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-1.0-pro-vision-latest',
      'gemini-pro-vision'
    ];

    let lastError = null;
    let jsonResult = null;

    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const rawText = data.candidates[0].content.parts[0].text;
          const cleanJson = rawText.replace(/```json|```/g, '').replace(/```/g, '').trim();
          jsonResult = JSON.parse(cleanJson);
          break; // Berhasil! Keluar dari loop
        } else {
          lastError = data.error?.message || JSON.stringify(data);
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (jsonResult) {
      return NextResponse.json(jsonResult);
    } else {
      return NextResponse.json(
        { error: 'Gagal memproses dengan semua model Gemini', details: lastError },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses struk', details: error.message },
      { status: 500 }
    );
  }
}
