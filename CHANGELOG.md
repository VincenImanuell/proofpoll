# Changelog

All notable changes to ProofPoll are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **`SelfHumanVerifier` — Self Protocol adapter** implementing `IHumanVerifier`. Records the
  per-human Self nullifier on the Hub's verification callback, then answers `RewardEscrow`'s
  `verify()` as a cheap on-chain lookup, enforcing one real human across many wallets.
- `SelfVerificationRootStub` + `SelfTypes`: in-tree mirror of the Self V2 integration surface
  (`customVerificationHook`, `GenericDiscloseOutputV2`, Hub-gated `onVerificationSuccess`) so the
  adapter builds/tests/deploys on testnet without vendoring the full Self dependency; swapping in
  the official base is a drop-in.
- `MockSelfHub` testnet personhood Hub + 7 tests (Hub callback, Sybil across wallets, non-Hub
  caller rejection, and an end-to-end `SelfHumanVerifier` + `RewardEscrow` integration).
- `DeployTestnet.s.sol`: one-command Celo Sepolia deploy of the full stack; `deployments/` registry.

- **`@proofpoll/sdk` core (TypeScript).** Framework-agnostic SDK over `RewardEscrow`:
  - `createProofPollClient` — typed viem reads/writes (`getSurvey`, `remainingSlots`,
    `hasResponded`, `createSurvey`, `submitResponse`, `closeSurvey`).
  - `prepareResponse` — the client-side pipeline: AES-256-GCM encrypt answers → optionally pin the
    ciphertext to IPFS (Lighthouse) → compute the on-chain `responseHash` commitment.
  - `encryptAnswer`/`decryptAnswer`, `hashSchema`/`hashResponse`, calldata encoders, `celoSepolia`
    chain + `KNOWN_ADDRESSES`, and generated `rewardEscrowAbi`/`selfHumanVerifierAbi`.
  - 18 vitest tests; ESM+CJS+d.ts build via tsup; ABIs generated from Foundry artifacts.
- CI `sdk` job: typecheck + test + build the SDK on every push/PR.

### Changed
- **Testnet target moved from Alfajores to Celo Sepolia** (`11142220`) — Alfajores is deprecated and
  Self Protocol's testnet Hub lives on Celo Sepolia. Updated RPC, cUSD address, and explorer config.

### Week 1 foundation
- pnpm monorepo scaffold (`contracts/`, `packages/sdk/`, `apps/miniapp/`).
- `RewardEscrow.sol`: escrow a cUSD reward pool and pay each unique, verified human instantly on
  response; organizer can close early and reclaim unspent funds.
- `IHumanVerifier` interface abstracting proof-of-personhood (Self Protocol adapter to follow).
- Foundry test suite: create/submit/close paths, Sybil resistance (same human across wallets),
  auto-close when full, and a fuzz invariant on escrow accounting (12 tests).
- GitHub Actions CI: `forge fmt --check`, build, and test on every push/PR.
