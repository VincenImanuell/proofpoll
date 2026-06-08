import type { Address, Hex } from "viem";

/// A survey as stored on-chain by `RewardEscrow.getSurvey`.
export interface Survey {
  organizer: Address;
  rewardPerResponse: bigint;
  balance: bigint;
  maxResponses: bigint;
  responseCount: bigint;
  schemaHash: Hex;
  open: boolean;
}

/// A single survey question. `id` is stable and used as the answer key.
export interface SurveyQuestion {
  id: string;
  prompt: string;
  type: "single" | "multi" | "text" | "scale";
  options?: string[];
}

/// The off-chain survey definition committed on-chain via `schemaHash`.
export interface SurveySchema {
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  /// ISO date; pinned into the hash so the schema can't be swapped after funding.
  createdAt?: string;
}

/// A respondent's consent record, committed on-chain as part of the response hash.
export interface ConsentRecord {
  /// What the respondent agrees their (encrypted) answer may be used for.
  purpose: string;
  /// Whether the dataset may be resold to third parties.
  resaleAllowed: boolean;
  /// ISO timestamp of consent.
  grantedAt: string;
  /// Optional free-form terms URI.
  termsUri?: string;
}
