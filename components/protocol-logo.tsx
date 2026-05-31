'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import Image from 'next/image'

const accentPairs = [
  ['#ff6b35', '#ffb020'],
  ['#00e599', '#00a3ff'],
  ['#7c3aed', '#ff3366'],
  ['#38bdf8', '#22c55e'],
  ['#f97316', '#eab308'],
  ['#a855f7', '#06b6d4'],
]

function hashName(value: string) {
  return value.split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
}

export function ProtocolLogo({
  name,
  logoUrl,
  size = 32,
}: {
  name: string
  logoUrl?: string
  size?: number
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const initials = name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  const accents = useMemo(() => {
    const index = Math.abs(hashName(name)) % accentPairs.length
    return accentPairs[index]
  }, [name])
  const showImage = Boolean(logoUrl && !imageFailed)

  return (
    <span
      className="qy-protocol-logo"
      style={{ width: size, height: size, '--logo-a': accents[0], '--logo-b': accents[1] } as CSSProperties}
      aria-label={name}
      title={name}
    >
      {showImage && logoUrl ? (
        <Image src={logoUrl} alt={`${name} logo`} width={size} height={size} onError={() => setImageFailed(true)} />
      ) : (
        <span className="qy-protocol-fallback">{initials || '?'}</span>
      )}
    </span>
  )
}
