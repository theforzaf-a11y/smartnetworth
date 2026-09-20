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

    // Daftar nama model yang dicoba secara berurutan
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-2.0-flash-exp'
    ];

    let response: Response | null = null;
    let lastErrorData: any = null;

    for (const modelName of modelsToTry) {
      // API Key dikirim lewat header x-goog-api-key agar mendukung format baru (AQ...)
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
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

      if (response.ok) {
        break; // Berhasil terhubung ke model
      } else {
        lastErrorData = await response.json();
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        {
          error: 'Error dari Google Gemini API',
          details: lastErrorData?.error?.message || lastErrorData,
        },
        { status: response ? response.status : 500 }
      );
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = textResult.replace(/```json|```/g, '').replace(/```/g, '').trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json(parsedData);
    } catch (e) {
      return NextResponse.json({ rawText: textResult });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses struk dengan AI', details: error.message },
      { status: 500 }
    );
  }
}
