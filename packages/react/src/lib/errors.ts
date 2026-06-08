import { BaseError, ContractFunctionRevertedError, decodeErrorResult, type Hex } from "viem";
import { rewardEscrowAbi, selfHumanVerifierAbi } from "@proofpoll/sdk";

/// Friendly messages for ProofPoll's custom Solidity errors.
const FRIENDLY: Record<string, string> = {
  AlreadyResponded: "You've already answered this survey — one response per verified human.",
  SurveyFull: "This survey has reached its response limit.",
  SurveyNotOpen: "This survey is closed.",
  NotVerified: "Verify that you're a unique human before submitting.",
  NotOrganizer: "Only the survey's organizer can do that.",
  InvalidParams: "Invalid survey parameters (reward and max responses must be non-zero).",
  PoolTooLarge: "The reward pool is too large.",
  ZeroAddress: "A required address was the zero address.",
};

/// Pull a custom-error name out of a thrown viem contract error, if present.
export function errorNameOf(err: unknown): string | undefined {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError && revert.data?.errorName) {
      return revert.data.errorName;
    }
  }
  return undefined;
}

/// Turn any thrown error into a short, human-readable message.
export function friendlyError(err: unknown): string {
  const name = errorNameOf(err);
  if (name) return FRIENDLY[name] ?? name;
  if (err instanceof BaseError) return err.shortMessage;
  if (err instanceof Error) return err.message;
  return "Transaction failed.";
}

/// Decode raw revert data (e.g. from a reverted receipt path) into a friendly message.
export function decodeRevert(data: Hex): string | undefined {
  for (const abi of [rewardEscrowAbi, selfHumanVerifierAbi]) {
    try {
      const { errorName } = decodeErrorResult({ abi, data });
      return FRIENDLY[errorName] ?? errorName;
    } catch {
      // try the next ABI
    }
  }
  return undefined;
}
