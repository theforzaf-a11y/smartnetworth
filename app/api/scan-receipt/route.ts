import { GoogleGenerativeAI } from '@google/generative-ai';
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
    const buffer = Buffer.from(arrayBuffer);

    const genAI = new GoogleGenerativeAI(apiKey);
    // Menggunakan model Gemini 2.5 Flash yang aktif
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Analisis foto struk/faktur ini dan kembalikan JSON dengan struktur berikut:
    {
      "merchant": "nama toko",
      "date": "YYYY-MM-DD",
      "total": angka_nominal,
      "items": [{"name": "nama barang", "price": angka_nominal}]
    }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type || 'image/jpeg',
        },
      },
    ]);

    const responseText = result.response.text();
    return NextResponse.json(JSON.parse(responseText));
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memproses struk dengan AI', details: error.message },
      { status: 500 }
    );
  }
}
