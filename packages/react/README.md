# @proofpoll/react

React hooks + widgets for **ProofPoll** — collect verified-human survey responses with instant cUSD
rewards on Celo, built for **MiniPay**. A thin, viem-only layer over [`@proofpoll/sdk`](../sdk)
(no wagmi, no extra wallet stack).

```bash
npm install @proofpoll/react @proofpoll/sdk viem react react-dom
```

## Five-line respondent drop-in

```tsx
import { ProofPollProvider, SurveyWidget } from "@proofpoll/react";

<ProofPollProvider escrow={ESCROW} verifier={VERIFIER} mockHub={MOCK_HUB}>
  <SurveyWidget surveyId={0n} schema={schema} onSuccess={(r) => alert(`Earned ${r.rewardFormatted} cUSD`)} />
</ProofPollProvider>;
```

`SurveyWidget` runs the whole money path: verify you're a unique human → answer → submit **one**
transaction that pays out instantly, with a link to the exact Blockscout tx.

## What's in the box

| Export | Purpose |
|---|---|
| `ProofPollProvider` | Root provider. Detects MiniPay, auto-connects, resolves the reward token from `RewardEscrow.payToken()`, and exposes a MiniPay-safe `sendLegacy`. |
| `SurveyWidget` | Respondent end-to-end widget (gate → answer → paid). |
| `CreateSurveyForm` | Organizer create + fund widget (approve cUSD → `createSurvey`). |
| `VerifiedHumanGate` | Pluggable **stub** for the Self step (mirrors the real Self surface; swap later). |
| `ConnectButton`, `QuestionInput`, `TxStatus`, `TxLink` | Building blocks. |
| `useProofPoll`, `useWallet`, `useSurvey`, `useReward`, `useCreateSurvey`, `useCloseSurvey`, `useVerification`, `useCUSD` | Hooks for custom UIs. |

## Required addresses

`escrow`, `verifier`, and `mockHub` are **deployment-specific** (not in `KNOWN_ADDRESSES`). Get them
from [`deployments/celo-sepolia.json`](../../deployments) after running `DeployTestnet.s.sol`.

## MiniPay specifics (handled for you)

- **Legacy + fee-currency transactions.** Every write goes through `sendLegacy`, which sends a legacy
  tx with `feeCurrency` (gas paid in cUSD) via the injected provider — viem's default `writeContract`
  would drop the fee-currency field.
- **No connect button inside MiniPay.** The provider auto-connects the single injected account;
  `ConnectButton` renders only for generic desktop wallets.
- **Reverts are caught.** viem *resolves* a reverted tx (`receipt.status === "reverted"`) instead of
  throwing — every write hook branches on it, so a revert never reports as success.

## The Self gate is a stub on testnet

`VerifiedHumanGate` mirrors the real Self SDK surface but, in `gateMode: "stub"` (default), registers
the wallet on-chain via `MockSelfHub.pushHuman`. **`pushHuman` is permissionless on the mock, so
anti-Sybil is only nominal on testnet** — real Sybil resistance comes from Self on mainnet, where you
flip `gateMode` to `"self"` and only the gate's verify body changes.

MIT
