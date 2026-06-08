import { keccak256, stringToHex, type Hex } from "viem";
import type { ConsentRecord, SurveySchema } from "./types.js";

/// Deterministic JSON: object keys sorted recursively so the same logical value always serializes
/// to the same string (and therefore the same hash) regardless of key insertion order.
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/// keccak256 over the canonical JSON encoding of `value`. The on-chain integrity commitment.
export function hashJson(value: unknown): Hex {
  return keccak256(stringToHex(canonicalize(value)));
}

/// Commitment to a survey's off-chain definition — pass as `schemaHash` to `createSurvey`.
export function hashSchema(schema: SurveySchema): Hex {
  return hashJson(schema);
}

/// What a respondent commits on-chain: a hash binding the encrypted answer to its consent record
/// and the survey it answers. Pass the result as `responseHash` to `submitResponse`.
export interface ResponseCommitmentInput {
  surveyId: bigint | number;
  /// Reference to the encrypted answer (e.g. an IPFS CID) or the ciphertext itself.
  answerRef: string;
  consent: ConsentRecord;
}

export function hashResponse(input: ResponseCommitmentInput): Hex {
  return hashJson({
    surveyId: input.surveyId.toString(),
    answerRef: input.answerRef,
    consent: input.consent,
  });
}
