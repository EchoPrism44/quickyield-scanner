import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'QuickYield — yield research you can audit, not just trust'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const bg = '#07090d'
const surface = '#10151c'
const border = '#232c38'
const blue = '#2f88ff'
const green = '#00E676'
const text = '#f5f6f8'
const muted = '#a6adba'

const ledgerRows = [
  { date: '·', label: 'weekly snapshot', detail: 'every live pool graded A–F' },
  { date: '·', label: 'recorded first', detail: 'timestamped before outcomes' },
  { date: '·', label: 'graded in the open', detail: 'the record builds in public' },
]

// QuickYield QY monogram — kept in sync with public/brand/qy-mark.svg.
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" rx="24" fill="#0c0f17"/><circle cx="36" cy="50" r="14" fill="none" stroke="#FFFFFF" stroke-width="6.5"/><rect x="43" y="52" width="6.5" height="18" rx="3.25" transform="rotate(-35 48.5 61)" fill="#00E676"/><path d="M 58 35 L 68 49 L 78 35 M 68 49 L 68 65" fill="none" stroke="#00E676" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: green }} />

        {/* brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={markDataUri} width={56} height={56} alt="" />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
            <span style={{ color: text }}>Quick</span>
            <span style={{ color: green }}>Yield</span>
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 8,
              padding: '4px 12px',
              borderRadius: 999,
              border: `1px solid ${border}`,
              color: green,
              fontSize: 16,
              letterSpacing: 2,
            }}
          >
            ● GRADED IN THE OPEN
          </div>
        </div>

        {/* headline */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 56 }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: text, lineHeight: 1.05, letterSpacing: -2 }}>
            Yield research you can
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            <span style={{ color: green }}>audit</span>
            <span style={{ color: text }}>, not just trust.</span>
          </div>
          <div style={{ display: 'flex', fontSize: 27, color: muted, marginTop: 24, maxWidth: 880 }}>
            Every pool graded A–F under a published methodology — every grade on a public, timestamped ledger.
          </div>
        </div>

        {/* mini ledger panel */}
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
          {ledgerRows.map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', fontSize: 22 }}>
              <div style={{ display: 'flex', width: 26, color: green, fontWeight: 800 }}>{row.date}</div>
              <div style={{ display: 'flex', width: 330, color: text, fontWeight: 600 }}>{row.label}</div>
              <div style={{ display: 'flex', color: muted }}>{row.detail}</div>
              <div style={{ display: 'flex', marginLeft: 'auto', color: blue, fontWeight: 700 }}>✓</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
