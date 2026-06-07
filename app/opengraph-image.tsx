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

// QuickYield QY monogram — kept in sync with public/brand/qy-mark.svg.
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 96" fill="none"><defs><linearGradient id="g" x1="10" y1="14" x2="112" y2="86" gradientUnits="userSpaceOnUse"><stop stop-color="#FFB020"/><stop offset=".5" stop-color="#FF7A00"/><stop offset="1" stop-color="#FF6B35"/></linearGradient></defs><g stroke="url(#g)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"><circle cx="46" cy="48" r="30"/><path d="M54 58 70 74"/><path d="M62 26 84 52 106 26"/><path d="M84 52 84 76"/></g></svg>`
const markDataUri = `data:image/svg+xml;base64,${btoa(markSvg)}`

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={markDataUri} width={66} height={53} alt="" />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
            <span style={{ color: text }}>Quick</span>
            <span style={{ color: accent }}>Yield</span>
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
