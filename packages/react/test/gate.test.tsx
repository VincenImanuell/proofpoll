import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Address } from "viem";
import { ProofPollContext, type ProofPollContextValue } from "../src/context.js";
import { VerifiedHumanGate } from "../src/components/VerifiedHumanGate.js";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const VERIFIER = "0x2222222222222222222222222222222222222222" as Address;
const MOCKHUB = "0x3333333333333333333333333333333333333333" as Address;

function makeCtx(overrides: Partial<ProofPollContextValue>): ProofPollContextValue {
  return {
    client: {} as ProofPollContextValue["client"],
    publicClient: {} as ProofPollContextValue["publicClient"],
    account: ACCOUNT,
    chain: { id: 11_142_220, blockExplorers: { default: { url: "https://x" } } } as ProofPollContextValue["chain"],
    escrow: "0x4444444444444444444444444444444444444444" as Address,
    verifier: VERIFIER,
    mockHub: MOCKHUB,
    rewardToken: "0x5555555555555555555555555555555555555555" as Address,
    feeCurrency: null,
    isMiniPay: true,
    connected: true,
    gateMode: "stub",
    connect: vi.fn(),
    ensureChain: vi.fn(),
    txUrl: (h) => `https://x/tx/${h}`,
    sendLegacy: vi.fn(),
    ...overrides,
  } as ProofPollContextValue;
}

describe("VerifiedHumanGate (stub)", () => {
  it("auto-skips to children when the wallet is already a known human", async () => {
    const publicClient = { readContract: vi.fn(async () => true) } as unknown as ProofPollContextValue["publicClient"];
    const ctx = makeCtx({ publicClient });
    render(
      <ProofPollContext.Provider value={ctx}>
        <VerifiedHumanGate>VERIFIED_CONTENT</VerifiedHumanGate>
      </ProofPollContext.Provider>,
    );
    await waitFor(() => expect(screen.getByText("VERIFIED_CONTENT")).toBeTruthy());
  });

  it("registers via MockSelfHub.pushHuman, then reveals children", async () => {
    let human = false;
    const publicClient = {
      readContract: vi.fn(async () => human),
      waitForTransactionReceipt: vi.fn(async () => ({ status: "success", logs: [] })),
    } as unknown as ProofPollContextValue["publicClient"];
    const sendLegacy = vi.fn(async (_to: Address, _data: `0x${string}`) => {
      human = true;
      return "0xhash" as `0x${string}`;
    });
    const ctx = makeCtx({ publicClient, sendLegacy });

    render(
      <ProofPollContext.Provider value={ctx}>
        <VerifiedHumanGate>DONE</VerifiedHumanGate>
      </ProofPollContext.Provider>,
    );

    const btn = await screen.findByText(/I'm a human/i);
    fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText("DONE")).toBeTruthy());
    expect(sendLegacy).toHaveBeenCalledTimes(1);
    // The tx target is the MockSelfHub (first arg of sendLegacy).
    expect(sendLegacy.mock.calls[0]?.[0]).toBe(MOCKHUB);
  });
});
