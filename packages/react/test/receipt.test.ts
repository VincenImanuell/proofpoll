import { describe, expect, it, vi } from "vitest";
import type { PublicClient } from "viem";
import { waitOrThrow } from "../src/lib/receipt.js";

describe("waitOrThrow (the #1 viem footgun)", () => {
  it("returns the receipt on success", async () => {
    const pc = {
      waitForTransactionReceipt: vi.fn(async () => ({ status: "success", logs: [] })),
    } as unknown as PublicClient;
    const receipt = await waitOrThrow(pc, "0xabc");
    expect(receipt.status).toBe("success");
  });

  it("throws when the tx reverted (viem RESOLVES reverts, it doesn't throw)", async () => {
    const pc = {
      waitForTransactionReceipt: vi.fn(async () => ({ status: "reverted", logs: [] })),
    } as unknown as PublicClient;
    await expect(waitOrThrow(pc, "0xabc")).rejects.toThrow(/reverted/i);
  });
});
