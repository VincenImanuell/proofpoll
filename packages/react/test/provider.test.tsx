import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Address } from "viem";
import { ProofPollProvider } from "../src/ProofPollProvider.js";
import { useProofPoll } from "../src/hooks/useProofPoll.js";

const ESCROW = "0x4444444444444444444444444444444444444444" as Address;
const VERIFIER = "0x2222222222222222222222222222222222222222" as Address;
const CUSD = "0x5555555555555555555555555555555555555555" as Address;

function Probe() {
  const { escrow, isMiniPay, gateMode, connected } = useProofPoll();
  return (
    <div>
      <span>escrow:{escrow}</span>
      <span>minipay:{String(isMiniPay)}</span>
      <span>gate:{gateMode}</span>
      <span>connected:{String(connected)}</span>
    </div>
  );
}

describe("ProofPollProvider", () => {
  it("renders children and exposes config (no injected wallet, no network read)", () => {
    // Passing rewardToken skips the payToken read so this stays offline.
    render(
      <ProofPollProvider escrow={ESCROW} verifier={VERIFIER} rewardToken={CUSD} autoConnect={false}>
        <Probe />
      </ProofPollProvider>,
    );
    expect(screen.getByText(`escrow:${ESCROW}`)).toBeTruthy();
    expect(screen.getByText("minipay:false")).toBeTruthy();
    expect(screen.getByText("gate:stub")).toBeTruthy();
    expect(screen.getByText("connected:false")).toBeTruthy();
  });

  it("useProofPoll throws outside a provider", () => {
    function Bare() {
      useProofPoll();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/ProofPollProvider/);
  });
});
