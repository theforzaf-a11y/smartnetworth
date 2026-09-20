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

    // 1. Cek daftar model yang TERSEDIA untuk API Key ini secara real-time
    const listModelsResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const listModelsData = await listModelsResp.json();

    if (!listModelsResp.ok) {
      return NextResponse.json(
        {
          error: 'API Key ditolak oleh Google AI Studio. Pastikan API Key aktif dan tidak dibatasi.',
          details: listModelsData.error?.message || listModelsData,
        },
        { status: listModelsResp.status }
      );
    }

    const availableModels: string[] = (listModelsData.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace('models/', ''));

    if (availableModels.length === 0) {
      return NextResponse.json(
        { error: 'API Key valid tetapi tidak memiliki akses ke model generateContent apapun.' },
        { status: 400 }
      );
    }

    // 2. Pilih model vision/flash terbaik dari daftar model yang tersedia
    const selectedModel =
      availableModels.find((m) => m.includes('1.5-flash') || m.includes('flash')) ||
      availableModels.find((m) => m.includes('pro') || m.includes('vision')) ||
      availableModels[0];

    const prompt = `Analisis foto struk/faktur ini dan kembalikan JSON murni tanpa markdown/backticks.
Format JSON:
{
  "merchant": "nama toko",
  "date": "YYYY-MM-DD",
  "total": angka_nominal,
  "items": [{"name": "nama barang", "price": angka_nominal}]
}`;

    // 3. Eksekusi request menggunakan model yang dipastikan ADA untuk API Key ini
    const generateResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
      {
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
      }
    );

    const generateData = await generateResp.json();

    if (!generateResp.ok) {
      return NextResponse.json(
        {
          error: `Gagal generate content dengan model ${selectedModel}`,
          details: generateData.error?.message || generateData,
        },
        { status: generateResp.status }
      );
    }

    const textResult = generateData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = textResult.replace(/```json|```/g, '').replace(/```/g, '').trim();

    try {
      return NextResponse.json(JSON.parse(cleanJson));
    } catch {
      return NextResponse.json({ rawText: textResult });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses request', details: error.message },
      { status: 500 }
    );
  }
}
