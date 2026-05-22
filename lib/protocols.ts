import type { ProtocolMeta } from './types'

const protocolCatalog: ProtocolMeta[] = [
  { slug: 'aave', name: 'Aave', logoUrl: '/protocols/aave.svg', officialUrl: 'https://app.aave.com/' },
  { slug: 'compound', name: 'Compound', logoUrl: '/protocols/compound.svg', officialUrl: 'https://app.compound.finance/' },
  { slug: 'curve', name: 'Curve', logoUrl: '/protocols/curve.svg', officialUrl: 'https://curve.fi/' },
  { slug: 'jito', name: 'Jito', logoUrl: '/protocols/jito.svg', officialUrl: 'https://www.jito.network/staking/' },
  { slug: 'kelp', name: 'Kelp', logoUrl: '/protocols/kelp.svg', officialUrl: 'https://kelpdao.xyz/' },
  { slug: 'lido', name: 'Lido', logoUrl: '/protocols/lido.svg', officialUrl: 'https://lido.fi/' },
  { slug: 'maple', name: 'Maple', logoUrl: '/protocols/maple.svg', officialUrl: 'https://app.maple.finance/' },
  { slug: 'morpho', name: 'Morpho', logoUrl: '/protocols/morpho.svg', officialUrl: 'https://app.morpho.org/' },
  { slug: 'pendle', name: 'Pendle', logoUrl: '/protocols/pendle.svg', officialUrl: 'https://app.pendle.finance/' },
  { slug: 'rocket-pool', name: 'Rocket Pool', logoUrl: '/protocols/rocket-pool.svg', officialUrl: 'https://rocketpool.net/' },
  { slug: 'spark', name: 'Spark', logoUrl: '/protocols/spark.svg', officialUrl: 'https://app.spark.fi/' },
  { slug: 'yearn', name: 'Yearn', logoUrl: '/protocols/yearn.svg', officialUrl: 'https://yearn.fi/' },
]

export function normalizeProtocolSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function getProtocolMeta(project: string): ProtocolMeta {
  const normalized = normalizeProtocolSlug(project)
  const match = protocolCatalog.find((item) => normalized.includes(item.slug))
  if (match) return match

  return {
    slug: normalized || 'protocol',
    name: project,
    logoUrl: undefined,
    officialUrl: undefined,
  }
}
