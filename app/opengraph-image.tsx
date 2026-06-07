import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'QuickYield — the Bloomberg Terminal for DeFi yield'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const bg = '#050a12'
const surface = '#0d1a2b'
const border = '#1a2d42'
const accent = '#ff6b35'
const text = '#f4f8ff'
const muted = '#8baabf'
const up = '#34d399'

const tickerRows = [
  { asset: 'stETH', chain: 'Ethereum', apy: '3.12%', grade: 'A' },
  { asset: 'USDC', chain: 'Base', apy: '8.00%', grade: 'B' },
  { asset: 'SOL', chain: 'Solana', apy: '6.44%', grade: 'A' },
]

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: bg,
          padding: 64,
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: accent }} />

        {/* brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: bg,
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            Q
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: text, letterSpacing: -0.5 }}>
            QuickYield
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 8,
              padding: '4px 12px',
              borderRadius: 999,
              border: `1px solid ${border}`,
              color: up,
              fontSize: 16,
              letterSpacing: 2,
            }}
          >
            ● LIVE
          </div>
        </div>

        {/* headline */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 56 }}>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, color: text, lineHeight: 1.05, letterSpacing: -2 }}>
            The Bloomberg Terminal
          </div>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            <span style={{ color: text }}>for&nbsp;</span>
            <span style={{ color: accent }}>DeFi yield</span>
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: muted, marginTop: 24, maxWidth: 820 }}>
            Scan live pools, grade their safety A–F, and get alerted before yields turn.
          </div>
        </div>

        {/* mini terminal panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            backgroundColor: surface,
            border: `1px solid ${border}`,
            borderRadius: 14,
            padding: 24,
            gap: 14,
          }}
        >
          {tickerRows.map((row) => (
            <div key={row.asset} style={{ display: 'flex', alignItems: 'center', fontSize: 22 }}>
              <div style={{ display: 'flex', width: 360, color: text, fontWeight: 600 }}>
                {row.asset}
                <span style={{ color: muted, fontWeight: 400 }}>&nbsp;· {row.chain}</span>
              </div>
              <div style={{ display: 'flex', width: 160, color: up, fontWeight: 700 }}>{row.apy}</div>
              <div style={{ display: 'flex', color: muted }}>Safety grade&nbsp;</div>
              <div
                style={{
                  display: 'flex',
                  marginLeft: 8,
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: row.grade === 'A' ? up : accent,
                  color: bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}
              >
                {row.grade}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
