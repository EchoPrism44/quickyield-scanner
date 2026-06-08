/**
 * DeFiLlama protocol directory — used to enrich pools with official site URLs
 * that the /pools feed doesn't include. Free, public, heavily cached.
 */
export async function getProtocolUrlIndex(): Promise<Map<string, string>> {
  try {
    const r = await fetch('https://api.llama.fi/protocols', {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return new Map()
    const data = (await r.json()) as Array<{ slug?: string; url?: string }>
    const map = new Map<string, string>()
    for (const p of data) {
      if (p.slug && p.url && p.url.startsWith('http')) map.set(p.slug, p.url)
    }
    return map
  } catch {
    return new Map()
  }
}
