# Changelog

All notable changes to ProofPoll are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Week 1 foundation.** pnpm monorepo scaffold (`contracts/`, `packages/sdk/`, `apps/miniapp/`).
- `RewardEscrow.sol`: escrow a cUSD reward pool and pay each unique, verified human instantly on
  response; organizer can close early and reclaim unspent funds.
- `IHumanVerifier` interface abstracting proof-of-personhood (Self Protocol adapter to follow).
- Foundry test suite: create/submit/close paths, Sybil resistance (same human across wallets),
  auto-close when full, and a fuzz invariant on escrow accounting (12 tests).
- GitHub Actions CI: `forge fmt --check`, build, and test on every push/PR.
