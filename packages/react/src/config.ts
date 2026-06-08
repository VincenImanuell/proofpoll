import { celoSepolia, KNOWN_ADDRESSES } from "@proofpoll/sdk";

/// Celo Sepolia testnet (chain 11142220). Re-exported from the SDK so the SDK and React package
/// share one chain definition (and one viem type identity).
export { celoSepolia };

export const DEFAULT_CHAIN = celoSepolia;

/// cUSD on Celo Sepolia — used only as a fallback before the provider resolves the reward token
/// from `RewardEscrow.payToken()` at init.
export const FALLBACK_CUSD = KNOWN_ADDRESSES.celoSepolia.cUSD as `0x${string}`;

/// `escrow`, `verifier`, and `mockHub` are deployment-specific and are NOT in `KNOWN_ADDRESSES`
/// (which only has `chainId`, `cUSD`, and the production `selfHub` placeholder). They must be
/// supplied to `ProofPollProvider` — read them from `deployments/celo-sepolia.json` / env.
export const REQUIRED_DEPLOYMENT_FIELDS = ["escrow", "verifier", "mockHub"] as const;
