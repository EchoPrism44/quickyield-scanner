/**
 * On-chain anchor config (client-safe — no fs).
 *
 * The Base "public ledger" is the GradeLedger contract that anchors each
 * weekly snapshot's hash on-chain. It is NOT deployed yet: while
 * GRADE_LEDGER_CONTRACT is null the UI shows an honest "launching soon"
 * state. Once the contract is live on Base mainnet, set the address here and
 * every "Verified on Base" badge + Basescan link activates automatically.
 */

/** Deployed GradeLedger address on Base mainnet, or null until deployed. */
export const GRADE_LEDGER_CONTRACT = null as string | null

/** Base mainnet chain id. */
export const BASE_CHAIN_ID = 8453

/** True once the on-chain anchor is live. */
export const isAnchorLive: boolean = GRADE_LEDGER_CONTRACT !== null

export function basescanAddressUrl(address: string): string {
  return `https://basescan.org/address/${address}`
}

/** Convenience: the contract's Basescan page, or null if not deployed. */
export function ledgerBasescanUrl(): string | null {
  return GRADE_LEDGER_CONTRACT ? basescanAddressUrl(GRADE_LEDGER_CONTRACT) : null
}
