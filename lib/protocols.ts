import type { ProtocolMeta } from './types'

const protocolCatalog: ProtocolMeta[] = [
  { slug: 'aave', name: 'Aave', aliases: ['aave-v2', 'aave-v3'], logoUrl: '/protocols/aave.svg', officialUrl: 'https://app.aave.com/' },
  { slug: 'compound', name: 'Compound', aliases: ['compound-v2', 'compound-v3'], logoUrl: '/protocols/compound.svg', officialUrl: 'https://app.compound.finance/' },
  { slug: 'curve', name: 'Curve', aliases: ['curve-dex', 'curve-finance'], logoUrl: '/protocols/curve.svg', officialUrl: 'https://curve.fi/' },
  { slug: 'jito', name: 'Jito', aliases: ['jito-sol'], logoUrl: '/protocols/jito.svg', officialUrl: 'https://www.jito.network/staking/' },
  { slug: 'kelp', name: 'Kelp', aliases: ['kelp-dao', 'kelpdao'], logoUrl: '/protocols/kelp.svg', officialUrl: 'https://kelpdao.xyz/' },
  { slug: 'lido', name: 'Lido', aliases: ['lido-finance'], logoUrl: '/protocols/lido.svg', officialUrl: 'https://lido.fi/' },
  { slug: 'maple', name: 'Maple', aliases: ['maple-finance'], logoUrl: '/protocols/maple.svg', officialUrl: 'https://app.maple.finance/' },
  { slug: 'morpho', name: 'Morpho', aliases: ['morpho-blue'], logoUrl: '/protocols/morpho.svg', officialUrl: 'https://app.morpho.org/' },
  { slug: 'pendle', name: 'Pendle', aliases: ['pendle-finance'], logoUrl: '/protocols/pendle.svg', officialUrl: 'https://app.pendle.finance/' },
  { slug: 'rocket-pool', name: 'Rocket Pool', aliases: ['rocketpool'], logoUrl: '/protocols/rocket-pool.svg', officialUrl: 'https://rocketpool.net/' },
  { slug: 'spark', name: 'Spark', aliases: ['spark-protocol'], logoUrl: '/protocols/spark.svg', officialUrl: 'https://app.spark.fi/' },
  { slug: 'yearn', name: 'Yearn', aliases: ['yearn-finance'], logoUrl: '/protocols/yearn.svg', officialUrl: 'https://yearn.fi/' },
  { slug: 'balancer', name: 'Balancer', aliases: ['balancer-v2'], officialUrl: 'https://balancer.fi/' },
  { slug: 'beefy', name: 'Beefy', aliases: ['beefy-finance'], officialUrl: 'https://beefy.com/' },
  { slug: 'benqi', name: 'Benqi', officialUrl: 'https://benqi.fi/' },
  { slug: 'camelot', name: 'Camelot', officialUrl: 'https://camelot.exchange/' },
  { slug: 'convex', name: 'Convex', aliases: ['convex-finance'], officialUrl: 'https://www.convexfinance.com/' },
  { slug: 'euler', name: 'Euler', aliases: ['euler-v2'], officialUrl: 'https://www.euler.finance/' },
  { slug: 'etherfi', name: 'Ether.fi', aliases: ['ether-fi', 'etherfi-stake'], officialUrl: 'https://www.ether.fi/' },
  { slug: 'frax', name: 'Frax', aliases: ['frax-ether', 'frax-finance'], officialUrl: 'https://frax.finance/' },
  { slug: 'kamino', name: 'Kamino', aliases: ['kamino-lend'], officialUrl: 'https://app.kamino.finance/' },
  { slug: 'marginfi', name: 'Marginfi', aliases: ['mrgn'], officialUrl: 'https://app.marginfi.com/' },
  { slug: 'marinade', name: 'Marinade', aliases: ['marinade-finance'], officialUrl: 'https://marinade.finance/' },
  { slug: 'meteora', name: 'Meteora', officialUrl: 'https://meteora.ag/' },
  { slug: 'orca', name: 'Orca', officialUrl: 'https://www.orca.so/' },
  { slug: 'raydium', name: 'Raydium', officialUrl: 'https://raydium.io/' },
  { slug: 'silo', name: 'Silo', aliases: ['silo-finance'], officialUrl: 'https://app.silo.finance/' },
  { slug: 'uniswap', name: 'Uniswap', aliases: ['uniswap-v2', 'uniswap-v3', 'uniswap-v4'], officialUrl: 'https://app.uniswap.org/' },
]

export function normalizeProtocolSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** DeFiLlama icon CDN — works for almost any protocol slug, no key required. */
export function llamaProtocolIcon(slug: string) {
  return `https://icons.llamao.fi/icons/protocols/${slug}?w=48&h=48`
}

export function getProtocolMeta(project: string): ProtocolMeta {
  const normalized = normalizeProtocolSlug(project)
  const match = protocolCatalog.find((item) => [item.slug, ...(item.aliases ?? [])].some((alias) => normalized === alias || normalized.includes(alias)))
  if (match) return match

  return {
    slug: normalized || 'protocol',
    name: project,
    logoUrl: undefined,
    officialUrl: undefined,
  }
}
