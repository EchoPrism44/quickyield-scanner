import type { Opportunity } from './types'

/**
 * RWA (real-world asset) classification — tokenized treasuries, T-bills, and
 * on-chain private credit. These pools are already in the DeFiLlama feed and
 * already graded; this just identifies them so we can surface an "RWA yields"
 * view. Matched by protocol slug / platform, with a fallback on well-known
 * tokenized-treasury asset symbols. Curated and honest — extend the lists as
 * new RWA protocols appear in the feed.
 */

const RWA_PROTOCOL_ROOTS = [
  'ondo', 'maple', 'centrifuge', 'blackrock', 'buidl', 'usyc', 'openeden',
  'superstate', 'goldfinch', 'hashnote', 'mountain-protocol', 'franklin',
  'matrixdock', 'midas', 'provenance', 'usual',
]

const RWA_ASSET_TOKENS = [
  'USYC', 'BUIDL', 'USDY', 'OUSG', 'USTB', 'USD0', 'USDM', 'BENJI', 'TBILL', 'USDO',
]

export function isRwaOpportunity(o: Pick<Opportunity, 'protocolSlug' | 'platform' | 'asset'>): boolean {
  const slug = `${o.protocolSlug ?? ''} ${o.platform ?? ''}`.toLowerCase()
  if (RWA_PROTOCOL_ROOTS.some((r) => slug.includes(r))) return true
  const asset = (o.asset ?? '').toUpperCase()
  return RWA_ASSET_TOKENS.some((t) => asset.includes(t))
}
