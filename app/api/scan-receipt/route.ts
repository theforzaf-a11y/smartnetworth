import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const genAI = new GoogleGenerativeAI(apiKey);
    // Menggunakan model standar gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analisis foto struk/faktur ini dan kembalikan JSON murni tanpa markdown/backticks.
Format JSON:
{
  "merchant": "nama toko",
  "date": "YYYY-MM-DD",
  "total": angka_nominal,
  "items": [{"name": "nama barang", "price": angka_nominal}]
}`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    const cleanJson = responseText
      .replace(/```json|```/g, '')
      .replace(/```/g, '')
      .trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json(parsedData);
    } catch (e) {
      return NextResponse.json({ rawText: responseText });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses struk dengan AI', details: error.message },
      { status: 500 }
    );
  }
}
