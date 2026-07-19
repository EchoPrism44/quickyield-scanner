import { BadgeCheck, Clock } from 'lucide-react'
import { GRADE_LEDGER_CONTRACT, ledgerBasescanUrl } from '../../lib/onchain'

/**
 * Trust chip for the Base on-chain anchor.
 * - Live (contract deployed): green "Verified on Base" + Basescan link.
 * - Gated (not deployed yet): muted "On-chain anchor · launching soon".
 * Never claims on-chain verification that doesn't exist.
 */
export function OnChainBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const href = ledgerBasescanUrl()
  const cls = `ql-onchain ql-onchain--${size}`

  if (GRADE_LEDGER_CONTRACT && href) {
    return (
      <a className={`${cls} ql-onchain--live`} href={href} target="_blank" rel="noreferrer">
        <BadgeCheck size={size === 'sm' ? 13 : 15} />
        Verified on Base
      </a>
    )
  }

  return (
    <span className={`${cls} ql-onchain--soon`}>
      <Clock size={size === 'sm' ? 13 : 15} />
      On-chain anchor · launching soon
    </span>
  )
}
