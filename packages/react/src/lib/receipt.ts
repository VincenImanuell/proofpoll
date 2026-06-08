import type { Hex, PublicClient, TransactionReceipt } from "viem";

/// Wait for a transaction receipt and THROW if it reverted.
///
/// Critical footgun: viem's `waitForTransactionReceipt` RESOLVES a reverted tx with
/// `receipt.status === "reverted"` — it does not throw. Every write path must branch on the
/// status or it will falsely report success. This helper centralizes that branch.
export async function waitOrThrow(publicClient: PublicClient, hash: Hex): Promise<TransactionReceipt> {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status === "reverted") {
    throw new Error("Transaction reverted on-chain.");
  }
  return receipt;
}
