import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftRight, ExternalLink } from 'lucide-react'
import { ProtocolLogo } from '../../../../components/protocol-logo'
import { PoolDetailActions } from '../../../../components/pool-detail-actions'
import { requireDashboardUserId } from '../../../../lib/auth'
import { getOpportunities, getRankReason } from '../../../../lib/opportunities'
import { formatTvl } from '../../../../lib/scoring'
import { getOpportunitySnapshots, getPoolDetail, getWatchlist } from '../../../../lib/store'
import type { Opportunity, PoolDetail } from '../../../../lib/types'

export const dynamic = 'force-dynamic'

export default async function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireDashboardUserId('/dashboard')
  const { id } = await params
  let detail = await getPoolDetail(id)
  if (!detail) detail = await recoverPoolDetail(id)
  if (!detail) notFound()

  const watchlist = await getWatchlist(userId)
  const watched = watchlist.includes(detail.opportunity.id)
  const { opportunity, history, relatedByProtocol, relatedByAsset, relatedByChain } = detail

  const minApy = history.length ? Math.min(...history.map((item) => item.apy)) : opportunity.apy
  const maxApy = history.length ? Math.max(...history.map((item) => item.apy)) : opportunity.apy
  const chartPoints = history.map((item, index) => {
    const x = history.length === 1 ? 8 : 8 + (index / (history.length - 1)) * 584
    const y = 152 - (((item.apy - minApy) / (maxApy - minApy || 1)) * 120)
    return `${x},${y}`
  }).join(' ')

  return (
    <main className="qy-detail-page">
      <div className="qy-container">
        <div className="qy-detail-back">
          <Link href="/dashboard" className="qy-btn qy-btn-secondary qy-btn-sm">
            <ArrowLeftRight size={14} />
            Back to Discover
          </Link>
        </div>

        <section className="qy-detail-hero">
          <div className="qy-detail-hero-main">
            <div className="qy-detail-title-row">
              <ProtocolLogo name={opportunity.platform} logoUrl={opportunity.logoUrl} size={52} />
              <div>
                <span className="qy-overline qy-overline-signal">Pool research</span>
                <h1>{opportunity.platform}</h1>
                <p>{opportunity.asset} / {opportunity.chain} / {opportunity.category}</p>
              </div>
            </div>

            <div className="qy-detail-stat-grid">
              <div className="qy-detail-stat"><span className="qy-overline">APY</span><strong>{opportunity.apy.toFixed(2)}%</strong></div>
              <div className="qy-detail-stat"><span className="qy-overline">TVL</span><strong>{opportunity.tvl}</strong></div>
              <div className="qy-detail-stat"><span className="qy-overline">Safety score</span><strong>{opportunity.confidence}</strong></div>
              <div className="qy-detail-stat"><span className="qy-overline">24h move</span><strong>{opportunity.volatility.toFixed(2)}%</strong></div>
            </div>

            <PoolDetailActions opportunity={opportunity} initiallyWatched={watched} />
          </div>

          <aside className="qy-detail-side">
            <div className="qy-detail-panel">
              <h2>Method</h2>
              <div className="qy-detail-score-grid">
                <div><span className="qy-overline">Liquidity</span><strong>{opportunity.scoreBreakdown.liquidity}</strong></div>
                <div><span className="qy-overline">Stability</span><strong>{opportunity.scoreBreakdown.stability}</strong></div>
                <div><span className="qy-overline">Sustainability</span><strong>{opportunity.scoreBreakdown.sustainability}</strong></div>
                <div><span className="qy-overline">Completeness</span><strong>{opportunity.scoreBreakdown.completeness}</strong></div>
              </div>
              <p className="qy-detail-copy">QuickYield ranks pools using scale, APY behavior, reward quality, and data completeness.</p>
            </div>
          </aside>
        </section>

        <section className="qy-detail-layout">
          <article className="qy-detail-panel">
            <div className="qy-detail-panel-head">
              <h2>Stored APY history</h2>
              <span className="qy-mono">{history.length} snapshots</span>
            </div>
            {history.length > 1 ? (
              <svg className="qy-detail-chart" viewBox="0 0 600 160" role="img" aria-label="APY history">
                <path d="M8 152H592" stroke="rgba(255,255,255,0.08)" />
                <path d="M8 32H592" stroke="rgba(255,255,255,0.05)" />
                <polyline points={chartPoints} fill="none" stroke="#ff6b35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className="qy-empty">
                <h3>History is still building</h3>
                <p>Hourly snapshots will make this panel richer as the cron job keeps running.</p>
              </div>
            )}
            <div className="qy-detail-history-caption">
              <span>30d avg {opportunity.apyMean30d?.toFixed(2) ?? 'N/A'}%</span>
              <span>Base APY {opportunity.apyBase?.toFixed(2) ?? 'N/A'}%</span>
              <span>Reward APY {opportunity.apyReward?.toFixed(2) ?? 'N/A'}%</span>
            </div>
          </article>

          <article className="qy-detail-panel">
            <div className="qy-detail-panel-head">
              <h2>Risk factors</h2>
              <span className={`qy-tag-mini ${opportunity.risk === 'Low' ? 'qy-risk-low' : 'qy-risk-medium'}`}>
                {opportunity.risk === 'Low' ? 'Lower risk screen' : 'Needs review'}
              </span>
            </div>
            <p className="qy-detail-copy">{opportunity.notes}</p>
            <div className="qy-risk-brief">
              <h3>Risk brief</h3>
              <p>{getRankReason(opportunity)}</p>
              <div className="qy-risk-brief-grid">
                <span>Liquidity: {opportunity.scoreBreakdown.liquidity}/100</span>
                <span>Stability: {opportunity.scoreBreakdown.stability}/100</span>
                <span>Reward quality: {opportunity.scoreBreakdown.sustainability}/100</span>
                <span>Data: {opportunity.scoreBreakdown.completeness}/100</span>
              </div>
            </div>
            <ul className="qy-detail-list">
              {opportunity.flags.map((flag) => <li key={flag}>{flag}</li>)}
            </ul>
            <div className="qy-detail-links">
              {opportunity.officialUrl.startsWith('http') ? (
                <a href={opportunity.officialUrl} target="_blank" rel="noreferrer">Protocol site <ExternalLink size={12} /></a>
              ) : null}
            </div>
          </article>
        </section>

        <section className="qy-related-section">
          <RelatedSection title="Same protocol" items={relatedByProtocol} />
          <RelatedSection title="Same asset" items={relatedByAsset} />
          <RelatedSection title="Same chain" items={relatedByChain} />
        </section>
      </div>
    </main>
  )
}

async function recoverPoolDetail(id: string): Promise<PoolDetail | null> {
  const scan = await getOpportunities({ capital: 100000 })
  const opportunity = scan.opportunities.find((item) => item.id === id)
  if (!opportunity) return null
  const [history] = await Promise.all([getOpportunitySnapshots(id, 72)])
  const allOpportunities = scan.opportunities
  return {
    opportunity,
    history,
    relatedByProtocol: allOpportunities.filter((item) => item.id !== id && item.protocolSlug === opportunity.protocolSlug).slice(0, 4),
    relatedByAsset: allOpportunities.filter((item) => item.id !== id && item.asset === opportunity.asset).slice(0, 4),
    relatedByChain: allOpportunities.filter((item) => item.id !== id && item.chain === opportunity.chain).slice(0, 4),
  }
}

function RelatedSection({ title, items }: { title: string; items: Opportunity[] }) {
  if (items.length === 0) return null
  return (
    <div className="qy-detail-panel">
      <div className="qy-detail-panel-head">
        <h2>{title}</h2>
        <span className="qy-mono">{items.length} pools</span>
      </div>
      <div className="qy-related-list">
        {items.map((item) => (
          <Link key={item.id} href={`/dashboard/pools/${encodeURIComponent(item.id)}`} className="qy-related-row">
            <div className="qy-asset-cell">
              <ProtocolLogo name={item.platform} logoUrl={item.logoUrl} />
              <div>
                <div className="qy-asset-name">{item.platform}</div>
                <div className="qy-asset-meta">{item.asset} / {item.chain}</div>
              </div>
            </div>
            <div className="qy-terminal-right">
              <strong>{item.apy.toFixed(2)}%</strong>
              <div className="qy-asset-meta">{formatTvl(item.tvlUsd)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
