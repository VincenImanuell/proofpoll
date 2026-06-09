# ProofPoll

**Stripe-for-verified-human-surveys on Celo.** ProofPoll lets anyone run a survey where every
respondent is a **unique, real human** (verified with [Self](https://self.xyz)) and gets paid a
**guaranteed cUSD reward instantly** — funded from an on-chain escrow. Shipped as an embeddable
SDK + a MiniPay Mini App.

[![CI](https://github.com/VincenImanuell/proofpoll/actions/workflows/ci.yml/badge.svg)](https://github.com/VincenImanuell/proofpoll/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> Built for [Celo Proof of Ship](https://celopg.eco).

---

## The problem

- **Web2 paid surveys** are gamed by bots and survey farms — one person, hundreds of fake responses.
  Buyers can't trust the data; honest respondents are underpaid.
- **"Reward you later" promises** require trust. Organizers can collect answers and never pay.
- **Respondents don't own their data.** Their answers get resold; they see none of the upside.

## How ProofPoll fixes it

| Problem | ProofPoll mechanism |
|---|---|
| Bots & survey farms | **Self** proof-of-personhood — one human = one response, enforced on the *human*, not the wallet (Sybil-proof across many addresses). |
| Trust the payout | Rewards are **escrowed up front** in cUSD and paid **automatically on submission** — guaranteed, not a promise. |
| Is this gambling? | **No.** Each accepted response earns a **fixed, guaranteed** reward. There is no lottery, no entrant pot, no chance. |
| Data ownership / consent | Every response carries an **on-chain integrity commitment** to the (encrypted, off-chain) answer + consent record. |
| Real on-chain activity | Each respondent is a **distinct wallet making a real transaction** — exactly the signal Proof of Ship rewards. |

## How it works (core loop)

```
Organizer                          Respondent (MiniPay)
   │  createSurvey(reward, max)        │
   │  + escrow cUSD  ───────────────►  │
   │                                   │  Self: prove unique human
   │                                   │  submitResponse(id, hash, proof)
   │                                   │ ◄── instant cUSD reward
   ▼                                   ▼
 dataset of bot-free, consented, verified-human responses
```

1. **Organizer** funds a survey: `createSurvey(rewardPerResponse, maxResponses, schemaHash)` escrows
   `reward × max` cUSD.
2. **Respondent** opens it in MiniPay, proves with Self they're a unique human, and submits — the
   contract verifies personhood, blocks repeat humans, and **pays the reward in the same transaction**.
3. **Organizer** gets a dataset of verified-human, consented responses; **respondents** get paid
   instantly and own a record of their contribution.

---

## Monorepo layout

```
proofpoll/
├── contracts/          Foundry — core smart contracts + tests   ✅ Week 1–2
│   ├── src/
│   │   ├── RewardEscrow.sol          escrow + instant guaranteed payout
│   │   ├── SelfHumanVerifier.sol     Self Protocol adapter (proof-of-personhood)
│   │   ├── self/                     in-tree mirror of the Self V2 integration surface
│   │   └── interfaces/IHumanVerifier.sol   proof-of-personhood abstraction
│   ├── test/           forge tests (incl. Sybil + fuzz + Self integration)
│   └── script/         Deploy.s.sol (mainnet) · DeployTestnet.s.sol (full Sepolia stack)
├── deployments/        on-chain address registry per network
├── packages/sdk/       @proofpoll/sdk — framework-agnostic TS SDK over viem
│                       (client, prepareResponse, crypto, hashing, ABIs)        ✅ Week 2
├── packages/react/     @proofpoll/react — React hooks + widgets for MiniPay
│                       (ProofPollProvider, SurveyWidget, VerifiedHumanGate)    ✅ Week 2
└── apps/miniapp/       MiniPay Mini App demo (Vite + React + Tailwind)         ✅ Week 3
```

## Smart contracts

### `RewardEscrow.sol`

The heart of ProofPoll. An organizer escrows a cUSD reward pool; each unique Self-verified human who
responds is paid instantly.

| Function | Who | What |
|---|---|---|
| `createSurvey(reward, max, schemaHash)` | organizer | Escrows `reward × max` cUSD, opens the survey. |
| `submitResponse(id, responseHash, proof)` | respondent | Verifies personhood, blocks repeat humans, pays the reward. |
| `closeSurvey(id)` | organizer | Closes early and refunds the unspent escrow. |
| `getSurvey(id)` / `remainingSlots(id)` | anyone | Read survey state. |

**Anti-Sybil:** personhood is checked through the pluggable [`IHumanVerifier`](contracts/src/interfaces/IHumanVerifier.sol).
The production implementation is [`SelfHumanVerifier`](contracts/src/SelfHumanVerifier.sol) — a
**Self Protocol** adapter: the Self Identity Verification Hub verifies a respondent's zero-knowledge
proof-of-personhood and calls back with a per-human **nullifier**, which the adapter records and the
escrow uses to block the same human from claiming a survey twice even across different wallets.

### `SelfHumanVerifier.sol`

The Self Protocol adapter. A respondent completes the Self flow once; the Hub calls
`onVerificationSuccess`, binding their wallet to their app-scoped nullifier. `RewardEscrow` then
reads that nullifier via a cheap `verify()` lookup on every submission. On Celo Sepolia the Hub is a
`MockSelfHub` (Self uses mock passports on testnet); on mainnet it is Self's Identity Verification
Hub V2. The `contracts/src/self/` mirror lets this build and deploy without the full Self dependency
— swapping in the official `SelfVerificationRoot` base is a drop-in.

---

## Quickstart

Requires [Foundry](https://book.getfoundry.sh/getting-started/installation).

```bash
git clone --recurse-submodules https://github.com/VincenImanuell/proofpoll
cd proofpoll/contracts

forge build      # compile
forge test -vvv  # run the suite (unit + Sybil + fuzz)
forge fmt        # format
```

Deploy the full stack to Celo Sepolia (testnet — chain `11142220`):

```bash
cp .env.example .env   # fill in RPC + CELOSCAN_API_KEY
# Deploys MockSelfHub + SelfHumanVerifier + RewardEscrow, wired together:
forge script script/DeployTestnet.s.sol \
  --rpc-url celo_sepolia --broadcast \
  --keystore <keystore> --sender <deployer>
```

Deployed addresses are recorded in [`deployments/`](./deployments). On mainnet, deploy the verifier
against Self's real Hub V2, then `Deploy.s.sol` with `VERIFIER` set to its address.

---

## Roadmap

- **Week 1 — Foundation (testnet).** ✅ Monorepo, `RewardEscrow` core, full forge test suite (Sybil +
  fuzz), CI.
- **Week 2 — SDK + Self.** ✅ `SelfHumanVerifier` Self Protocol adapter + integration tests, Celo
  Sepolia deploy stack, `@proofpoll/sdk` (viem client + `prepareResponse`: encrypt → IPFS/Lighthouse
  → on-chain commitment), and `@proofpoll/react` widgets (`<VerifiedHumanGate>`, `<SurveyWidget>`,
  `useReward()`).
- **Week 3 — Mainnet + demo.** ✅ MiniPay Mini App (`apps/miniapp`). ⏳ deploy + verify on Celo
  mainnet, real respondents, demo video + deck.

## Tech stack

[Celo](https://celo.org) · [Self Protocol](https://self.xyz) (proof-of-personhood) ·
cUSD (Mento stablecoin) · [Foundry](https://book.getfoundry.sh) ·
IPFS/[Lighthouse](https://lighthouse.storage) (encrypted off-chain answers) · MiniPay.

## A note on fairness

ProofPoll is **non-gambling by construction**: rewards are fixed and guaranteed per accepted
response, escrowed up front by the organizer — there is no pot of entrant money, no draw, and no
chance involved.

## Docs & contributing

- [Architecture](./docs/ARCHITECTURE.md) — system map, data/privacy flow, trust boundaries.
- [Contributing](./CONTRIBUTING.md) — setup, common tasks, conventions.
- [Security policy](./SECURITY.md) — responsible disclosure.

## License

[MIT](./LICENSE)
