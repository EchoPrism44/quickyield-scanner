/**
 * Harm-event source for the safety-signal validation (Phase 1 feasibility slice).
 * ------------------------------------------------------------------------------
 * The lift-test proved the composite grade adds no predictive lift over raw TVL
 * for *TVL-collapse* — but TVL-collapse is a size proxy, not harm. To validate
 * the grade as a SAFETY signal we need real harm events (exploits, rugs, oracle
 * manipulation, access-control drains). This module sources them from DeFiLlama's
 * public, key-less /hacks endpoint and bridges each event's protocol onto the
 * `project` slug used in data/grades/<date>.json.
 *
 * Pattern mirrors lib/llama-protocols.ts: global fetch, revalidate cache, an
 * AbortSignal timeout, and try/catch -> [] on any failure. No new deps, no key.
 *
 * This module only READS public data and maps it to slugs — it never touches the
 * append-only grade ledger.
 */

const HACKS_URL = 'https://api.llama.fi/hacks'
const PROTOCOLS_URL = 'https://api.llama.fi/protocols'

/** Raw shape of a DeFiLlama /hacks record (only the fields we use). */
type RawHack = {
  date?: number // unix SECONDS, day-aligned
  name?: string
  classification?: string
  technique?: string
  amount?: number | null // USD lost
  chain?: string[] | null
  bridgeHack?: boolean
  targetType?: string
  defillamaId?: string | null // joins to /protocols `id`
  parentProtocolId?: string | null // e.g. "parent#aave"
}

/** Normalized harm event, ready to join against the grade ledger. */
export type HarmEvent = {
  date: string // ISO yyyy-mm-dd (UTC) of the event
  t: number // ms epoch of the event date
  protocolName: string
  defillamaId: string | null // /protocols numeric id (as string)
  parentSlug: string | null // slug from a "parent#<slug>" id, if any
  chains: string[]
  classification: string
  technique: string
  amountUsd: number | null
  targetType: string
  bridgeHack: boolean
}

/** Minimal /protocols record used to build the id/parent -> yields-slug bridge. */
type RawProtocol = {
  id?: string
  slug?: string
  name?: string
  parentProtocol?: string // "parent#<slug>"
  parentProtocolSlug?: string
}

/** "parent#aave" -> "aave"; anything else passed through untouched. */
function parentIdToSlug(id: string | null | undefined): string | null {
  if (!id) return null
  const i = id.indexOf('#')
  return i >= 0 ? id.slice(i + 1) : id
}

/** Lowercase, non-alphanumeric -> single hyphen (matches normalizeProtocolSlug in lib/protocols.ts). */
export function normName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Fetch + normalize DeFiLlama harm events. Returns [] on any failure so a caller
 * (e.g. a coverage script) degrades to "no data" rather than throwing.
 */
export async function fetchHarmEvents(): Promise<HarmEvent[]> {
  try {
    const r = await fetch(HACKS_URL, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) return []
    const raw = (await r.json()) as RawHack[]
    if (!Array.isArray(raw)) return []
    const out: HarmEvent[] = []
    for (const h of raw) {
      if (typeof h.date !== 'number' || !h.name) continue
      const t = h.date * 1000
      const iso = new Date(t).toISOString().slice(0, 10)
      out.push({
        date: iso,
        t,
        protocolName: h.name,
        defillamaId: h.defillamaId ?? null,
        parentSlug: parentIdToSlug(h.parentProtocolId),
        chains: Array.isArray(h.chain) ? h.chain : [],
        classification: h.classification ?? 'Unknown',
        technique: h.technique ?? '',
        amountUsd: typeof h.amount === 'number' ? h.amount : null,
        targetType: h.targetType ?? '',
        bridgeHack: Boolean(h.bridgeHack),
      })
    }
    return out
  } catch {
    return []
  }
}

/**
 * The protocol->yields-slug bridge. The grade ledger keys pools by `project`, a
 * DeFiLlama *yields* slug (e.g. "aave-v3", "ether.fi-stake"). Harm events key by
 * numeric `defillamaId` or a "parent#<slug>" id. This resolver lets a harm event
 * match a graded pool three ways, from most to least reliable:
 *
 *   1. defillamaId -> /protocols `id` -> that protocol's own `slug` + its
 *      `parentProtocolSlug` (so a hack tagged to the parent matches versioned
 *      children like aave-v2 / aave-v3, and vice-versa).
 *   2. parent#<slug> from the hack, matched against project or its parent slug.
 *   3. normalized-name equality as a last resort.
 *
 * Returns a matcher: given a ledger `project` slug, does this harm event hit it?
 */
export type ProtocolIndex = {
  /** /protocols `id` -> { slug, parentSlug } */
  byId: Map<string, { slug: string; parentSlug: string | null }>
  /** yields/project slug -> its parent slug (from /protocols), for family collapse */
  parentOf: Map<string, string | null>
  /** set of all known slugs (own + parent), normalized */
  knownSlugs: Set<string>
}

export async function fetchProtocolIndex(): Promise<ProtocolIndex> {
  const byId = new Map<string, { slug: string; parentSlug: string | null }>()
  const parentOf = new Map<string, string | null>()
  const knownSlugs = new Set<string>()
  try {
    const r = await fetch(PROTOCOLS_URL, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) return { byId, parentOf, knownSlugs }
    const data = (await r.json()) as RawProtocol[]
    if (!Array.isArray(data)) return { byId, parentOf, knownSlugs }
    for (const p of data) {
      if (!p.slug) continue
      const slug = normName(p.slug)
      const parentSlug = p.parentProtocolSlug
        ? normName(p.parentProtocolSlug)
        : parentIdToSlug(p.parentProtocol)
        ? normName(parentIdToSlug(p.parentProtocol) as string)
        : null
      if (p.id) byId.set(p.id, { slug, parentSlug })
      parentOf.set(slug, parentSlug)
      knownSlugs.add(slug)
      if (parentSlug) knownSlugs.add(parentSlug)
    }
    return { byId, parentOf, knownSlugs }
  } catch {
    return { byId, parentOf, knownSlugs }
  }
}

/**
 * Resolve the set of ledger-project slugs a harm event should match. We collapse
 * to the PROTOCOL FAMILY: an event on "aave" matches aave-v2/aave-v3 because they
 * share a parent. Returns normalized slugs; matching is family-aware via parentOf.
 */
export function eventSlugKeys(ev: HarmEvent, idx: ProtocolIndex): Set<string> {
  const keys = new Set<string>()
  const add = (s: string | null | undefined) => {
    if (s) keys.add(normName(s))
  }
  // 1. via defillamaId -> protocol slug + its parent
  if (ev.defillamaId && idx.byId.has(ev.defillamaId)) {
    const rec = idx.byId.get(ev.defillamaId)!
    add(rec.slug)
    add(rec.parentSlug)
  }
  // 2. via the hack's own parent#<slug>
  add(ev.parentSlug)
  // 3. last resort: normalized protocol name
  add(ev.protocolName)
  return keys
}

/**
 * Does harm event `ev` hit ledger project `project`? True if the event's slug
 * family contains `project`, OR `project`'s own parent is in the event's family
 * (covers the child->parent direction).
 */
export function eventHitsProject(ev: HarmEvent, project: string, idx: ProtocolIndex): boolean {
  const proj = normName(project)
  const keys = eventSlugKeys(ev, idx)
  if (keys.has(proj)) return true
  const projParent = idx.parentOf.get(proj)
  if (projParent && keys.has(projParent)) return true
  return false
}
