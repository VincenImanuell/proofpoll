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
├── contracts/          Foundry — core smart contracts + tests   ✅ Week 1
│   ├── src/
│   │   ├── RewardEscrow.sol          escrow + instant guaranteed payout
│   │   └── interfaces/IHumanVerifier.sol   proof-of-personhood abstraction
│   ├── test/           forge tests (incl. Sybil + fuzz)
│   └── script/Deploy.s.sol
├── packages/sdk/       @proofpoll/sdk — embeddable React widgets   ⏳ Week 2
└── apps/miniapp/       MiniPay Mini App demo                       ⏳ Week 3
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

**Anti-Sybil:** personhood is checked through the pluggable [`IHumanVerifier`](contracts/src/interfaces/IHumanVerifier.sol)
(a Self Protocol adapter in production). The verifier returns a per-human **nullifier**; the escrow
records it so the same human can't claim a survey twice even from different wallets.

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

Deploy to Celo Alfajores (testnet):

```bash
cp .env.example .env   # fill in RPC, CELOSCAN_API_KEY, VERIFIER, PRIVATE_KEY
forge script script/Deploy.s.sol --rpc-url alfajores --broadcast --verify
```

---

## Roadmap

- **Week 1 — Foundation (testnet).** ✅ Monorepo, `RewardEscrow` core, full forge test suite (Sybil +
  fuzz), CI on Alfajores.
- **Week 2 — SDK + Self.** `@proofpoll/sdk` React widgets (`<VerifiedHumanGate>`, `<SurveyWidget>`,
  `useReward()`), real Self adapter (`SelfHumanVerifier`), encrypted answers → IPFS/Lighthouse,
  on-chain consent.
- **Week 3 — Mainnet + demo.** MiniPay Mini App, deploy + verify on Celo mainnet, real respondents,
  demo video + deck.

## Tech stack

[Celo](https://celo.org) · [Self Protocol](https://self.xyz) (proof-of-personhood) ·
cUSD (Mento stablecoin) · [Foundry](https://book.getfoundry.sh) ·
IPFS/[Lighthouse](https://lighthouse.storage) (encrypted off-chain answers) · MiniPay.

## A note on fairness

ProofPoll is **non-gambling by construction**: rewards are fixed and guaranteed per accepted
response, escrowed up front by the organizer — there is no pot of entrant money, no draw, and no
chance involved.

## License

[MIT](./LICENSE)
