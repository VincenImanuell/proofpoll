import { createContext } from "react";
import type { Address, Chain, Hex, PublicClient, WalletClient } from "viem";
import type { ProofPollClient } from "@proofpoll/sdk";

export type GateMode = "stub" | "self";

export interface ProofPollContextValue {
  /// SDK client (reads always work; writes need a connected wallet).
  client: ProofPollClient;
  publicClient: PublicClient;
  walletClient?: WalletClient;
  account?: Address;
  chain: Chain;
  /// Deployment addresses (required inputs — not in KNOWN_ADDRESSES).
  escrow: Address;
  verifier: Address;
  mockHub?: Address;
  /// Reward stablecoin, resolved from `RewardEscrow.payToken()` at init.
  rewardToken: Address;
  /// Celo fee token for gas (CIP-64); `null` → pay gas in native CELO.
  feeCurrency: Address | null;
  isMiniPay: boolean;
  connected: boolean;
  gateMode: GateMode;
  lighthouseApiKey?: string;
  connect: () => Promise<Address>;
  ensureChain: () => Promise<void>;
  txUrl: (hash: Hex) => string;
  /// MiniPay-safe write primitive: legacy tx + feeCurrency. Used by every write hook + the gate.
  sendLegacy: (to: Address, data: Hex, value?: bigint) => Promise<Hex>;
}

export const ProofPollContext = createContext<ProofPollContextValue | null>(null);
