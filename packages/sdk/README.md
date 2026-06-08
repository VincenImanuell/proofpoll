# @proofpoll/sdk

Collect **verified-human** survey responses with **instant cUSD rewards** on Celo, in a few lines.
A typed, framework-agnostic wrapper around ProofPoll's `RewardEscrow` contract plus the client-side
answer pipeline (encrypt → pin to IPFS → commit on-chain).

```bash
npm install @proofpoll/sdk viem
```

## What's in the box

| Export | Purpose |
|---|---|
| `createProofPollClient` | Typed reads/writes over `RewardEscrow` (viem). |
| `prepareResponse` | Encrypt answers → (optionally) pin to IPFS → compute the on-chain commitment. |
| `encryptAnswer` / `decryptAnswer` / `generateAnswerKey` | AES-256-GCM answer encryption (Web Crypto). |
| `uploadToLighthouse` / `ipfsUri` / `ipfsGatewayUrl` | IPFS storage via Lighthouse. |
| `hashSchema` / `hashResponse` | Deterministic keccak256 commitments. |
| `encodeCreateSurvey` / `encodeSubmitResponse` / `encodeCloseSurvey` | Raw calldata (MiniPay, batching). |
| `celoSepolia`, `KNOWN_ADDRESSES` | Chain + cUSD/Self-hub addresses. |
| `rewardEscrowAbi`, `selfHumanVerifierAbi` | Contract ABIs (`as const`). |

## Organizer: create + fund a survey

```ts
import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createProofPollClient, celoSepolia, hashSchema } from "@proofpoll/sdk";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const publicClient = createPublicClient({ chain: celoSepolia, transport: http() });
const walletClient = createWalletClient({ account, chain: celoSepolia, transport: http() });

const proofpoll = createProofPollClient({ escrow: ESCROW_ADDRESS, publicClient, walletClient });

// (approve cUSD for the escrow first — standard ERC-20 approve)
const schemaHash = hashSchema({
  title: "Nigeria DeFi sentiment",
  questions: [{ id: "q1", prompt: "Do you use stablecoins?", type: "single", options: ["Yes", "No"] }],
});
const txHash = await proofpoll.createSurvey({
  rewardPerResponse: parseUnits("0.5", 18), // 0.5 cUSD
  maxResponses: 200n,
  schemaHash,
});
```

## Respondent: answer + get paid

```ts
import { generateAnswerKey, prepareResponse } from "@proofpoll/sdk";

const key = await generateAnswerKey(); // shared out-of-band with the organizer/buyer
const { responseHash } = await prepareResponse({
  surveyId: 0n,
  answers: { q1: "Yes" },
  key,
  consent: { purpose: "AI training", resaleAllowed: false, grantedAt: new Date().toISOString() },
  // optional: pin the ciphertext to IPFS and commit its CID instead of the raw ciphertext
  // upload: { apiKey: process.env.LIGHTHOUSE_API_KEY! },
});

// `proof` is empty here because personhood is established out-of-band via the Self Hub callback
// (see SelfHumanVerifier). The escrow verifies the wallet is a unique human and pays instantly.
const txHash = await proofpoll.submitResponse({ surveyId: 0n, responseHash, proof: "0x" });
```

## Reads

```ts
const survey = await proofpoll.getSurvey(0n);     // { organizer, rewardPerResponse, balance, ... }
const left = await proofpoll.remainingSlots(0n);  // bigint
```

## Design notes

- **Answers are private.** Plaintext never leaves the device; only AES-GCM ciphertext is stored
  (off-chain) and only its keccak256 commitment goes on-chain.
- **Personhood is decoupled from claiming.** A respondent verifies with Self once; the escrow then
  reads their nullifier on each submission. See [`SelfHumanVerifier`](../../contracts/src/SelfHumanVerifier.sol).
- **Framework-agnostic.** No React required; the `@proofpoll/sdk` React widgets build on top of this.

MIT
