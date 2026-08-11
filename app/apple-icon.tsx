import { ImageResponse } from 'next/og'

/**
 * Apple touch icon — used when someone adds the site to a phone home screen.
 * Same geometry as public/brand/litmus-mark.svg.
 */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="t" cx="50%" cy="45%" r="65%"><stop offset="0%" stop-color="#141418"/><stop offset="60%" stop-color="#0a0a0c"/><stop offset="100%" stop-color="#050506"/></radialGradient><linearGradient id="m" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="50%" stop-color="#f0ece1"/><stop offset="100%" stop-color="#dfd7c6"/></linearGradient></defs><rect width="100" height="100" fill="url(#t)"/><g fill="url(#m)" transform="translate(50 50) scale(0.6) translate(-256 -169)"><path d="M 211,136 L 219,128 L 219,230 L 273,230 L 265,238 L 211,238 Z"/><path d="M 225,122 L 233,114 L 233,216 L 287,216 L 279,224 L 225,224 Z"/><path d="M 239,108 L 247,100 L 247,202 L 301,202 L 293,210 L 239,210 Z"/></g></svg>`

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        <img src={`data:image/svg+xml;base64,${btoa(markSvg)}`} width={180} height={180} alt="" />
      </div>
    ),
    { ...size },
  )
}
