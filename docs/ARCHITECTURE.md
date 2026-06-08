# ProofPoll architecture

ProofPoll is **Stripe-for-verified-human-surveys** on Celo: an organizer escrows a cUSD reward
pool, and every unique, Self-verified human who answers is paid a guaranteed reward instantly. This
doc explains how the pieces fit together and where trust lives.

## System map

```
                         ┌─────────────────────────────────────────────┐
                         │                 Celo (Sepolia)               │
   Organizer             │                                              │
   ──────────►  approve cUSD ─────────►  ┌───────────────┐              │
                createSurvey(reward,max,schemaHash) ───►  │ RewardEscrow  │  escrow + payout  │
                                         └───────┬───────┘              │
                                                 │ verify(subject)      │
                                                 ▼                      │
                                         ┌───────────────────┐          │
                                         │ SelfHumanVerifier │ IHumanVerifier
                                         └───────▲───────────┘          │
                                                 │ onVerificationSuccess │
                                                 │ (nullifier, address)  │
                                         ┌───────┴───────────┐          │
   Respondent (MiniPay) ── Self proof ─► │ Identity Verif. Hub│ (real on mainnet; │
                                         │  / MockSelfHub     │  mock on testnet) │
                                         └───────────────────┘          │
                         └─────────────────────────────────────────────┘
        ▲                                          │
        │ encrypt answer (AES-GCM)                 │ instant cUSD reward
        │ pin ciphertext → IPFS (Lighthouse)       ▼
        └──── @proofpoll/sdk ────────────────► submitResponse(id, responseHash, proof)
```

## Components

### 1. `RewardEscrow.sol` (contracts/src)
The value layer. An organizer funds a survey (`createSurvey` escrows `reward × maxResponses` cUSD).
Each accepted response pays the fixed reward **in the same transaction** (`submitResponse`), and the
organizer can `closeSurvey` early to reclaim the unspent remainder. Key properties:
- **Non-gambling:** fixed, guaranteed reward per accepted response — no pot, no draw.
- **Reentrancy-safe:** checks-effects-interactions + `ReentrancyGuard`; SafeERC20 transfers.
- **Sybil-resistant:** uniqueness is keyed on the human's **nullifier**, not the wallet.

### 2. `IHumanVerifier` + `SelfHumanVerifier.sol` (contracts/src)
The personhood layer, pluggable behind a one-method interface
(`verify(address) → nullifier`). `SelfHumanVerifier` is the Self Protocol adapter:
1. A respondent completes the Self flow once. The **Identity Verification Hub** verifies their
   zero-knowledge proof and calls `onVerificationSuccess`, binding their wallet to an app-scoped
   **nullifier**.
2. `RewardEscrow` then reads that nullifier via a cheap `verify()` lookup on every submission and
   blocks repeat humans — even across different wallets of the same person.

Decoupling verification (step 1) from claiming (step 2) matches how Self actually delivers results
(an async Hub callback) and lets one verification gate many surveys.

> **Testnet vs mainnet.** `contracts/src/self/` is an in-tree *mirror* of the Self V2 integration
> surface, so the adapter builds, tests, and deploys on Celo Sepolia without vendoring the full Self
> dependency. On testnet the Hub is a `MockSelfHub` (Self uses *mock passports* on testnet). Mainnet
> swaps in the official `SelfVerificationRoot` base + Self's deployed Hub V2 — a drop-in change.

### 3. `@proofpoll/sdk` (packages/sdk)
The integration layer. A framework-agnostic TypeScript SDK over viem:
- `createProofPollClient` — typed reads/writes over `RewardEscrow`.
- `prepareResponse` — the client-side privacy pipeline: **encrypt** answers (AES-256-GCM) →
  *optionally* **pin** the ciphertext to IPFS (Lighthouse) → compute the on-chain `responseHash`
  commitment binding ciphertext + consent + survey.
- crypto, hashing, calldata encoders, chain + address constants, generated ABIs.

### 4. `apps/miniapp` (planned)
A MiniPay Mini App demoing the full loop end-to-end against the deployed contracts.

## Data & privacy flow

1. **Schema** (questions + metadata) lives off-chain; its keccak256 is committed on-chain as
   `schemaHash` at survey creation, so the question set can't be swapped after funding.
2. **Answers** are encrypted client-side. Only ciphertext is stored off-chain (IPFS); only its
   keccak256 (`responseHash`, bound to the consent record) is committed on-chain.
3. **Consent** is part of the response commitment, giving an immutable record of what the respondent
   agreed to — without putting personal data on-chain.

## Trust boundaries

| Trusted | Why |
|---|---|
| The Self Identity Verification Hub | Performs ZK proof verification; only it may call `onVerificationSuccess`. |
| The organizer (for schema honesty) | Funds escrow; schema is hash-committed so it can't change post-funding. |
| Off-chain storage availability | Ciphertext lives on IPFS; on-chain we only guarantee the *commitment*. |

| **Not** trusted | Mitigation |
|---|---|
| Respondents | Self nullifier blocks Sybil; one human, one response. |
| The organizer (for payment) | Rewards are escrowed up front and paid automatically. |
| Anyone reading chain data | Answers are encrypted; only commitments are public. |

## On-chain footprint (why this scores for Proof of Ship)

Every accepted response is a **distinct wallet making a real transaction** that moves cUSD —
exactly the unique-user + transaction signal the program rewards — and it's genuine usage, not
manufactured activity.
