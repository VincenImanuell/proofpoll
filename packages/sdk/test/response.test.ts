import { describe, expect, it, vi } from "vitest";
import { prepareResponse } from "../src/response.js";
import { decryptAnswer, generateAnswerKey } from "../src/crypto.js";
import type { ConsentRecord } from "../src/types.js";

const consent: ConsentRecord = {
  purpose: "AI training",
  resaleAllowed: false,
  grantedAt: "2026-06-08T00:00:00Z",
};

describe("prepareResponse", () => {
  it("encrypts answers and produces a commitment hash without uploading", async () => {
    const key = await generateAnswerKey();
    const answers = { q1: "Yes", q2: "stablecoins daily" };
    const prepared = await prepareResponse({ surveyId: 0n, answers, key, consent });

    expect(prepared.responseHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(prepared.upload).toBeUndefined();
    // The plaintext never appears in the ciphertext, and it round-trips.
    expect(prepared.encrypted.ciphertext).not.toContain("stablecoins");
    expect(JSON.parse(await decryptAnswer(prepared.encrypted, key))).toEqual(answers);
  });

  it("pins to IPFS when an upload config is given and uses the CID as the answer ref", async () => {
    const key = await generateAnswerKey();
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ Hash: "bafyTESTCID", Size: "123" }), { status: 200 }),
    ) as unknown as typeof fetch;

    const prepared = await prepareResponse({
      surveyId: 1n,
      answers: { q1: "No" },
      key,
      consent,
      upload: { apiKey: "test-key", fetchImpl },
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(prepared.upload?.cid).toBe("bafyTESTCID");
    expect(prepared.upload?.uri).toBe("ipfs://bafyTESTCID");
    expect(prepared.responseHash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
