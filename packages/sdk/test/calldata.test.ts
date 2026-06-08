import { describe, expect, it } from "vitest";
import { decodeFunctionData, keccak256, toFunctionSelector } from "viem";
import { encodeCloseSurvey, encodeCreateSurvey, encodeSubmitResponse } from "../src/calldata.js";
import { rewardEscrowAbi } from "../src/abi/rewardEscrowAbi.js";

describe("calldata encoders", () => {
  it("encodeCreateSurvey has the right selector and decodes back", () => {
    const schemaHash = keccak256("0x1234");
    const data = encodeCreateSurvey({ rewardPerResponse: 500_000_000_000_000_000n, maxResponses: 200n, schemaHash });
    expect(data.startsWith(toFunctionSelector("createSurvey(uint96,uint64,bytes32)"))).toBe(true);

    const decoded = decodeFunctionData({ abi: rewardEscrowAbi, data });
    expect(decoded.functionName).toBe("createSurvey");
    expect(decoded.args).toEqual([500_000_000_000_000_000n, 200n, schemaHash]);
  });

  it("encodeSubmitResponse round-trips", () => {
    const responseHash = keccak256("0xabcd");
    const data = encodeSubmitResponse({ surveyId: 3n, responseHash, proof: "0x" });
    const decoded = decodeFunctionData({ abi: rewardEscrowAbi, data });
    expect(decoded.functionName).toBe("submitResponse");
    expect(decoded.args).toEqual([3n, responseHash, "0x"]);
  });

  it("encodeCloseSurvey round-trips", () => {
    const data = encodeCloseSurvey(9n);
    const decoded = decodeFunctionData({ abi: rewardEscrowAbi, data });
    expect(decoded.functionName).toBe("closeSurvey");
    expect(decoded.args).toEqual([9n]);
  });
});
