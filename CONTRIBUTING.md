# Contributing to ProofPoll

Thanks for your interest! ProofPoll is a pnpm monorepo with two halves: Solidity contracts
(Foundry) and TypeScript packages.

## Layout

```
contracts/      Foundry — RewardEscrow + SelfHumanVerifier + tests
packages/sdk/   @proofpoll/sdk — framework-agnostic TypeScript SDK (viem)
apps/miniapp/   MiniPay Mini App demo
deployments/    on-chain address registry per network
```

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`)
- Node `>=20` and `pnpm@9.15.0` (`corepack enable`)

```bash
git clone --recurse-submodules https://github.com/VincenImanuell/proofpoll
cd proofpoll
pnpm install
```

## Common tasks

| Task | Command |
|---|---|
| Build contracts | `pnpm build` |
| Test contracts | `pnpm test` |
| Format Solidity | `pnpm fmt` (check: `pnpm fmt:check`) |
| Typecheck SDK | `pnpm sdk:typecheck` |
| Test SDK | `pnpm sdk:test` |
| Build SDK | `pnpm sdk:build` |
| Regenerate ABIs from artifacts | `pnpm gen:abi` |

## Before opening a PR

1. `pnpm fmt:check` and `pnpm test` pass (contracts).
2. `pnpm sdk:typecheck && pnpm sdk:test && pnpm sdk:build` pass (if you touched the SDK).
3. If you changed a contract's external interface, run `pnpm gen:abi` so the SDK ABIs stay in sync.
4. Update `CHANGELOG.md` under `## [Unreleased]`.
5. CI (`forge fmt`/build/test + SDK typecheck/test/build) must be green.

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `test:`, `chore:`, `docs:`), imperative mood, with a contract scope where it
  helps (`feat(contracts): …`, `feat(sdk): …`).
- **Solidity:** `forge fmt`; custom errors over revert strings; checks-effects-interactions;
  NatSpec on externally visible members.
- **TypeScript:** `strict` mode, ESM, no `any`. Prefer pure, testable functions.

## Security

Please do **not** open public issues for vulnerabilities — see [SECURITY.md](./SECURITY.md).
