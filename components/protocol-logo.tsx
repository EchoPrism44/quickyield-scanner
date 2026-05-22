'use client'

import Image from 'next/image'

export function ProtocolLogo({
  name,
  logoUrl,
  size = 32,
}: {
  name: string
  logoUrl?: string
  size?: number
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <span
      className="qy-protocol-logo"
      style={{ width: size, height: size }}
      aria-label={name}
      title={name}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt={`${name} logo`} width={size} height={size} />
      ) : (
        <span className="qy-protocol-fallback">{initials || '?'}</span>
      )}
    </span>
  )
}
