import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key belum terpasang" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const prompt = `Analisis foto kwitansi/struk ini. Ekstrak data dalam format JSON persis seperti berikut:
    {
      "merchant": "Nama Klinik / Merchant",
      "total": 123456,
      "category": "Kesehatan",
      "description": "Deskripsi singkat layanan/barang",
      "date": "YYYY-MM-DD"
    }
    Jika ini kwitansi klinik/dokter, pastikan category adalah "Kesehatan".
    Hanya kembalikan JSON tanpa teks tambahan/markdown format codeblock.`;

    const imagePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type || "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();
    
    // Clean JSON response
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json({
      title: `Struk: ${data.merchant || "Klinik/Toko"}`,
      amount: data.total || 0,
      category: data.category || "Kesehatan",
      description: data.description || "",
      date: data.date || new Date().toISOString().split("T")[0],
    });
  } catch (error: any) {
    console.error("Error scanning receipt:", error);
    return NextResponse.json(
      { error: "Gagal memproses struk dengan AI" },
      { status: 500 }
    );
  }
}
