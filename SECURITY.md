# Security Policy

ProofPoll moves real value (escrowed cUSD) and gates it on proof-of-personhood. We take security
seriously and welcome responsible disclosure.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

- Use GitHub's [private vulnerability reporting](https://github.com/VincenImanuell/proofpoll/security/advisories/new)
  ("Report a vulnerability" under the repo's Security tab), or
- Open a GitHub issue titled `security contact request` (no details) and we'll share a private channel.

Please include: affected component (contract / SDK), a description, and a proof-of-concept or repro
where possible. We aim to acknowledge within 72 hours.

## Scope

| In scope | Out of scope |
|---|---|
| `contracts/src/**` (RewardEscrow, SelfHumanVerifier) | Test mocks (`MockSelfHub`, `MockERC20`) |
| `packages/sdk/src/**` | The `contracts/src/self/` testnet **mirror** (a stand-in for the official Self base; see note) |
| Escrow accounting, Sybil resistance, reentrancy | Issues requiring a malicious/compromised RPC or wallet |

## Notes on the trust model

- **Anti-Sybil** is enforced on the *human* (Self nullifier), not the wallet. On **testnet** the
  personhood Hub is a `MockSelfHub` (Self uses mock passports on testnet); a real deployment wires
  Self's Identity Verification Hub V2, which performs the zero-knowledge proof verification.
- **Answer privacy:** plaintext answers are encrypted client-side (AES-256-GCM) and never sent
  on-chain; only a keccak256 commitment is stored on-chain.
- **Non-custodial rewards:** the organizer escrows the reward pool up front; payouts are guaranteed
  and automatic, never a lottery.

## Supported versions

ProofPoll is pre-1.0 and under active development for [Celo Proof of Ship](https://celopg.eco).
Only the latest `main` is supported. Contracts are **unaudited** — do not use in production with
real funds without an independent audit.
