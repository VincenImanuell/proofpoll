import { describe, expect, it } from "vitest";
import { canonicalize, hashJson, hashResponse, hashSchema } from "../src/hashing.js";
import type { ConsentRecord, SurveySchema } from "../src/types.js";

describe("canonicalize", () => {
  it("is independent of object key order", () => {
    expect(canonicalize({ a: 1, b: 2 })).toBe(canonicalize({ b: 2, a: 1 }));
  });

  it("sorts keys recursively", () => {
    expect(canonicalize({ x: { c: 3, a: 1 } })).toBe('{"x":{"a":1,"c":3}}');
  });

  it("preserves array order", () => {
    expect(canonicalize([3, 1, 2])).toBe("[3,1,2]");
  });
});

describe("hashJson / hashSchema", () => {
  const schema: SurveySchema = {
    title: "Nigeria DeFi sentiment",
    questions: [{ id: "q1", prompt: "Do you use stablecoins?", type: "single", options: ["Yes", "No"] }],
  };

  it("produces a 32-byte hex hash", () => {
    expect(hashSchema(schema)).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("is deterministic across key orderings", () => {
    const reordered: SurveySchema = {
      questions: schema.questions,
      title: schema.title,
    };
    expect(hashSchema(schema)).toBe(hashSchema(reordered));
  });

  it("changes when content changes", () => {
    expect(hashJson({ a: 1 })).not.toBe(hashJson({ a: 2 }));
  });
});

describe("hashResponse", () => {
  const consent: ConsentRecord = {
    purpose: "AI training",
    resaleAllowed: true,
    grantedAt: "2026-06-08T00:00:00Z",
  };

  it("binds surveyId + answerRef + consent", () => {
    const h = hashResponse({ surveyId: 0n, answerRef: "ipfs://cidA", consent });
    expect(h).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("treats surveyId as bigint or number identically", () => {
    expect(hashResponse({ surveyId: 7n, answerRef: "x", consent })).toBe(
      hashResponse({ surveyId: 7, answerRef: "x", consent }),
    );
  });

  it("differs when the answer ref differs", () => {
    expect(hashResponse({ surveyId: 0n, answerRef: "ipfs://a", consent })).not.toBe(
      hashResponse({ surveyId: 0n, answerRef: "ipfs://b", consent }),
    );
  });
});
