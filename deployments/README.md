# Deployments

Canonical record of ProofPoll's on-chain deployments. Each network has a JSON file with the
deployed contract addresses, the block they were deployed at, and the toolchain used.

| Network | Chain ID | File | Explorer |
|---|---|---|---|
| Celo Sepolia (testnet) | `11142220` | [`celo-sepolia.json`](./celo-sepolia.json) | https://celo-sepolia.blockscout.com |
| Celo Mainnet | `42220` | _(pending Week 3)_ | https://celoscan.io |

## How addresses get here

Testnet (one command — deploys the full stack: MockSelfHub + SelfHumanVerifier + RewardEscrow):

```bash
cd contracts
forge script script/DeployTestnet.s.sol \
  --rpc-url celo_sepolia --broadcast \
  --keystore <keystore> --sender <deployer>
```

The broadcast log under `contracts/broadcast/` holds the authoritative receipts; the JSON files
here are a human-readable index copied from those receipts.

## Notes

- **Testnet uses a `MockSelfHub`** as the personhood Hub — Self Protocol itself runs *mock
  passports* on testnet. The `SelfHumanVerifier` adapter is the real one; only the Hub is mocked.
- **Mainnet** swaps in Self's deployed Identity Verification Hub V2
  (`0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`) and real cUSD
  (`0x765DE816845861e75A25fCA122bb6898B8B1282a`).
