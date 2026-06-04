# @proofpoll/sdk

> ⏳ **Week 2 scaffold.** Public API sketch below; implementation lands next, on top of the
> `RewardEscrow` contract that already ships in [`../../contracts`](../../contracts).

Embed verified-human surveys with instant cUSD rewards into any React / MiniPay app in a few lines.

## Planned API

```tsx
import { ProofPollProvider, VerifiedHumanGate, SurveyWidget, useReward } from "@proofpoll/sdk";

<ProofPollProvider escrow={REWARD_ESCROW_ADDRESS} chain="celo">
  <VerifiedHumanGate>           {/* Self proof-of-personhood */}
    <SurveyWidget surveyId={0} />  {/* renders questions, encrypts answers → IPFS, submits + pays */}
  </VerifiedHumanGate>
</ProofPollProvider>;
```

- `<VerifiedHumanGate>` — runs the Self flow; only unique humans pass.
- `<SurveyWidget>` — renders the survey, encrypts the answer + consent record to IPFS/Lighthouse,
  commits the hash on-chain, and triggers the instant reward.
- `useReward()` — low-level hook around `RewardEscrow.submitResponse`.

## Status

| Piece | State |
|---|---|
| `RewardEscrow` contract + ABI | ✅ shipped (`contracts/`) |
| React widgets | ⏳ Week 2 |
| Self adapter (`SelfHumanVerifier`) | ⏳ Week 2 |
| IPFS/Lighthouse encryption | ⏳ Week 2 |
