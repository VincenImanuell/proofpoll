import { defineChain } from "viem";

/// Celo Sepolia testnet (chain 11142220). ProofPoll's testnet target — Alfajores is deprecated and
/// Self Protocol's testnet Identity Verification Hub lives here.
export const celoSepolia = defineChain({
  id: 11_142_220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://celo-sepolia.blockscout.com" },
  },
  testnet: true,
});

/// Well-known addresses per network. cUSD is the reward stablecoin; selfHub is the Self Protocol
/// Identity Verification Hub V2 used by `SelfHumanVerifier` in production.
export const KNOWN_ADDRESSES = {
  celoSepolia: {
    chainId: 11_142_220,
    cUSD: "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80",
    selfHub: "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74",
  },
  celo: {
    chainId: 42_220,
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    selfHub: "0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF",
  },
} as const;

export type KnownNetwork = keyof typeof KNOWN_ADDRESSES;
