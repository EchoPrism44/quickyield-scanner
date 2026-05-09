export async function fetchSparkline(poolId: string): Promise<number[]> {
  const apiPoolId = poolId.replace(/^live-/, '')
  try {
    const r = await fetch(`https://yields.llama.fi/chart/${apiPoolId}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) return []
    const json = await r.json()
    const data = json.data as { timestamp: string; apy: number }[] | undefined
    if (!data || data.length === 0) return []
    return data.slice(-7).map((d) => d.apy)
  } catch {
    return []
  }
}

export function renderSparklineSvg(data: number[], width = 60, height = 20): string | null {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const xs = data.map((_, i) => (i / (data.length - 1)) * width)
  const ys = data.map((v) => height - ((v - min) / range) * (height - 2) - 1)
  const points = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const color = data[data.length - 1] >= data[0] ? '#16a34a' : '#ff3366'
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}
