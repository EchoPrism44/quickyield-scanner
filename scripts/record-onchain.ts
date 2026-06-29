/**
 * Anchor the latest weekly grade snapshot on Base.
 *
 * Reads the newest data/grades/<YYYY-MM-DD>.json, computes keccak256 of the file
 * bytes, and calls GradeLedger.recordSnapshot(date, hash) on Base. Run by the
 * weekly GitHub Action right after the snapshot is committed.
 *
 * Verification (anyone): keccak256(<the committed file bytes>) === on-chain
 * hashByDate(YYYYMMDD). Snapshots are write-once on-chain, so the record is
 * tamper-proof.
 *
 * Required env (skips cleanly if absent, so the ledger keeps working pre-deploy):
 *   GRADE_LEDGER_ADDRESS   deployed contract address on Base
 *   RECORDER_PRIVATE_KEY   key of the contract owner/recorder wallet (0x…)
 *   BASE_RPC_URL           Base RPC endpoint (mainnet or sepolia)
 *
 * Run: npx tsx scripts/record-onchain.ts
 */
import { readdirSync, readFileSync } from 'node:fs'
import { keccak256, createWalletClient, createPublicClient, http, getAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const ABI = [
  {
    type: 'function',
    name: 'recordSnapshot',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'date', type: 'uint32' },
      { name: 'hash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'hashByDate',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint32' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const

function latestSnapshotFile(): string {
  const files = readdirSync('data/grades')
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
  if (files.length === 0) throw new Error('No snapshot files in data/grades')
  return files[files.length - 1]
}

async function main() {
  const address = process.env.GRADE_LEDGER_ADDRESS
  const pk = process.env.RECORDER_PRIVATE_KEY
  const rpc = process.env.BASE_RPC_URL

  if (!address || !pk || !rpc) {
    console.log('on-chain anchoring skipped — GRADE_LEDGER_ADDRESS / RECORDER_PRIVATE_KEY / BASE_RPC_URL not set.')
    return
  }

  const file = latestSnapshotFile()
  const date = Number(file.slice(0, 10).replace(/-/g, '')) // YYYYMMDD
  const bytes = readFileSync(`data/grades/${file}`)
  const hash = keccak256(bytes)

  const contract = getAddress(address)
  const account = privateKeyToAccount(pk.startsWith('0x') ? (pk as `0x${string}`) : `0x${pk}`)
  const transport = http(rpc)
  const publicClient = createPublicClient({ transport })
  const walletClient = createWalletClient({ account, transport })

  // Idempotent: skip if this date is already anchored (write-once on-chain).
  const existing = (await publicClient.readContract({
    address: contract,
    abi: ABI,
    functionName: 'hashByDate',
    args: [date],
  })) as `0x${string}`
  if (existing && /[1-9a-f]/i.test(existing.slice(2))) {
    console.log(`Snapshot ${file} (${date}) already anchored on-chain: ${existing}`)
    return
  }

  const chainId = await publicClient.getChainId()
  const txHash = await walletClient.sendTransaction({
    to: contract,
    data: encodeRecord(date, hash),
    chain: null,
  })
  console.log(`Anchored ${file} on Base (chainId ${chainId})`)
  console.log(`  date=${date} hash=${hash}`)
  console.log(`  tx=${txHash}`)

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  if (receipt.status !== 'success') throw new Error(`tx reverted: ${txHash}`)
  console.log(`  confirmed in block ${receipt.blockNumber}`)
}

// Minimal calldata encoder for recordSnapshot(uint32,bytes32) to avoid relying
// on viem's ABI encoder typings across versions.
function encodeRecord(date: number, hash: `0x${string}`): `0x${string}` {
  const selector = keccak256(new TextEncoder().encode('recordSnapshot(uint32,bytes32)')).slice(0, 10)
  const dateWord = date.toString(16).padStart(64, '0')
  const hashWord = hash.slice(2).padStart(64, '0')
  return `${selector}${dateWord}${hashWord}` as `0x${string}`
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
