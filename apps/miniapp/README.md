# ProofPoll Mini App

> ⏳ **Week 3 scaffold.** A MiniPay Mini App demoing the full ProofPoll loop on Celo mainnet.

The reference app that ties everything together:

1. **Organizer view** — create + fund a survey (escrow cUSD).
2. **Respondent view (MiniPay)** — verify as a unique human with Self, answer, get paid instantly.
3. **Live proof** — link each response to its Celoscan transaction (real, distinct-wallet activity).

Built on the [`@proofpoll/sdk`](../../packages/sdk) widgets over the
[`RewardEscrow`](../../contracts) contract. Implementation lands in Week 3.
