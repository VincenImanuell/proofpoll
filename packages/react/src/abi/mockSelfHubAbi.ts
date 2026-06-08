// Minimal ABI fragment for MockSelfHub.pushHuman, used ONLY by the testnet stub gate to register a
// wallet as a verified human (the SDK intentionally does not publish a mock ABI). Signature matches
// contracts/test/mocks/MockSelfHub.sol: pushHuman(address consumer, address subject, uint256 nullifier).
export const mockSelfHubAbi = [
  {
    type: "function",
    name: "pushHuman",
    stateMutability: "nonpayable",
    inputs: [
      { name: "consumer", type: "address" },
      { name: "subject", type: "address" },
      { name: "nullifier", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
