import type { Address } from "viem";

const env = import.meta.env;

/// Deployment addresses come from env (populate `.env.local` from `deployments/celo-sepolia.json`,
/// produced by `DeployTestnet.s.sol`). `escrow` + `verifier` are required; `mockHub` is required for
/// the testnet stub gate. The reward token is resolved from `RewardEscrow.payToken()` at runtime.
export const config = {
  escrow: env.VITE_ESCROW as Address | undefined,
  verifier: env.VITE_VERIFIER as Address | undefined,
  mockHub: env.VITE_MOCK_HUB as Address | undefined,
  cusd: (env.VITE_CUSD || "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80") as Address,
  lighthouseApiKey: env.VITE_LIGHTHOUSE_KEY || undefined,
};

export const isConfigured = Boolean(config.escrow && config.verifier && config.mockHub);

export const CHAIN_ID = 11_142_220;
