import type { Hex } from "viem";
import { encryptAnswer, type EncryptedAnswer } from "./crypto.js";
import { hashJson, hashResponse } from "./hashing.js";
import { uploadToLighthouse, type UploadOptions, type UploadResult } from "./storage.js";
import type { ConsentRecord } from "./types.js";

export interface PrepareResponseInput {
  surveyId: bigint | number;
  /// Answers keyed by question id.
  answers: Record<string, unknown>;
  /// AES-GCM key from `generateAnswerKey()`.
  key: CryptoKey;
  consent: ConsentRecord;
  /// If provided, the full encrypted answer (ciphertext + IV) is pinned to IPFS and its CID becomes
  /// the committed answer ref. If omitted, the answer ref is a hash binding the **full**
  /// `EncryptedAnswer` (ciphertext + IV + alg) — no network call — and you MUST persist the returned
  /// `encrypted` yourself, or the on-chain commitment will point to data you can no longer decrypt.
  upload?: UploadOptions;
}

export interface PreparedResponse {
  encrypted: EncryptedAnswer;
  /// Pass to `submitResponse` as `responseHash`.
  responseHash: Hex;
  /// Present only when `upload` was provided.
  upload?: UploadResult;
}

/// The full client-side response pipeline: encrypt the answers, optionally pin the ciphertext to
/// IPFS, then compute the on-chain integrity commitment binding ciphertext + consent + survey.
export async function prepareResponse(input: PrepareResponseInput): Promise<PreparedResponse> {
  const encrypted = await encryptAnswer(JSON.stringify(input.answers), input.key);

  let upload: UploadResult | undefined;
  const answerRef = await (async () => {
    // No upload: bind a hash of the FULL EncryptedAnswer (ciphertext + IV + alg) so the on-chain
    // commitment covers everything needed to decrypt. The caller must persist `encrypted`.
    if (!input.upload) return hashJson(encrypted);
    upload = await uploadToLighthouse(JSON.stringify(encrypted), input.upload);
    return upload.uri;
  })();

  const responseHash = hashResponse({ surveyId: input.surveyId, answerRef, consent: input.consent });
  return { encrypted, responseHash, upload };
}
