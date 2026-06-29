# QuickYield GradeLedger — on-chain anchor (Base)

A minimal contract that anchors QuickYield's weekly **public Safety-Grade ledger**
on Base. Each Monday the GitHub Action grades every live DeFi pool, commits a dated
snapshot (`data/grades/<date>.json`), and records the **keccak256 of that file** here.
Snapshots are **write-once** on-chain → the record is cryptographically tamper-proof
and anyone can verify it on BaseScan.

The contract holds **no funds**. The only privileged action is recording a hash, so
even if the recorder key leaks, the worst case is spurious dates — existing entries
are immutable and no value is at risk.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`)
- A **dedicated throwaway wallet** with a few dollars of Base ETH (deploy + weekly gas)
- (optional) a [BaseScan](https://basescan.org/myapikey) API key for source verification

```bash
cd onchain
forge install foundry-rs/forge-std   # one-time: pulls the test/script lib
cp .env.example .env                  # fill in PRIVATE_KEY, RPC URLs, BASESCAN_API_KEY
forge test -vvv                       # all tests should pass
```

## Deploy — testnet first

```bash
# 1) Get free Base Sepolia ETH: https://docs.base.org/tools/network-faucets
source .env
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify

# note the "GradeLedger deployed at: 0x…" address from the output
```

Validate the full flow on testnet by pointing the recorder at it:

```bash
GRADE_LEDGER_ADDRESS=0xYourSepoliaAddr \
RECORDER_PRIVATE_KEY=$PRIVATE_KEY \
BASE_RPC_URL=$BASE_SEPOLIA_RPC_URL \
npx tsx ../scripts/record-onchain.ts
```

Check it on https://sepolia.basescan.org/address/0xYourSepoliaAddr — you should see the
`SnapshotRecorded` event and the `latest()` hash.

## Deploy — mainnet (once testnet works)

```bash
source .env
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
```

## Wire up the weekly Action

In the repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `GRADE_LEDGER_ADDRESS` | the mainnet contract address |
| `RECORDER_PRIVATE_KEY` | the recorder wallet key (the contract owner) |
| `BASE_RPC_URL` | `https://mainnet.base.org` |

Once set, the existing **Weekly grade snapshot** Action anchors every new snapshot
automatically (the "Anchor snapshot on Base" step). Until they're set, that step
skips cleanly and the git-based ledger keeps working unchanged.

## Verify any snapshot (anyone, trustless)

```bash
# hash the committed file and compare to the on-chain value
HASH=$(cast keccak "$(cat ../data/grades/2026-06-30.json)")
cast call $GRADE_LEDGER_ADDRESS "hashByDate(uint32)(bytes32)" 20260630 --rpc-url base
# the two must match
```
