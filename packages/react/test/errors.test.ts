import { describe, expect, it } from "vitest";
import { encodeErrorResult } from "viem";
import { rewardEscrowAbi } from "@proofpoll/sdk";
import { decodeRevert, friendlyError } from "../src/lib/errors.js";

describe("errors", () => {
  it("friendlyError falls back to the message for plain errors", () => {
    expect(friendlyError(new Error("boom"))).toBe("boom");
  });

  it("decodeRevert maps a known custom error to a friendly message", () => {
    const data = encodeErrorResult({ abi: rewardEscrowAbi, errorName: "AlreadyResponded" });
    expect(decodeRevert(data)).toMatch(/already answered/i);
  });

  it("decodeRevert returns undefined for unrecognized data", () => {
    expect(decodeRevert("0x12345678")).toBeUndefined();
  });
});
