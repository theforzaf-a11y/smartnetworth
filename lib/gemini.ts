export interface OcrResult {
  type?: "expense" | "income"
  title: string
  amount: number
  category: string
  date: string
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"))
    reader.readAsDataURL(file)
  })
}

/**
 * Send the receipt image to our own server route, which holds the Gemini
 * API key and calls Google on the backend. The key never touches the browser.
 */
export async function scanReceipt(dataUrl: string): Promise<OcrResult> {
  const res = await fetch("/api/scan-receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error || `Gagal memindai struk (${res.status})`)
  }

  return data as OcrResult
}

/**
 * Send transcribed voice text to our server, which asks Gemini to extract
 * structured transaction data (title, amount, category, date).
 */
export async function parseVoiceTransaction(text: string): Promise<OcrResult> {
  const res = await fetch("/api/parse-voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error || `Gagal memproses ucapan (${res.status})`)
  }

  return data as OcrResult
}
