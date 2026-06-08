import type { Account, Address, Chain, Hex, PublicClient, WalletClient } from "viem";
import { rewardEscrowAbi } from "./abi/rewardEscrowAbi.js";
import type { CreateSurveyArgs, SubmitResponseArgs } from "./calldata.js";
import type { Survey } from "./types.js";

export interface ProofPollClientConfig {
  /// Deployed `RewardEscrow` address.
  escrow: Address;
  /// viem public client for reads.
  publicClient: PublicClient;
  /// viem wallet client for writes (optional if you only read).
  walletClient?: WalletClient;
  /// Account for writes; defaults to `walletClient.account`.
  account?: Account | Address;
  /// Chain for writes; defaults to `walletClient.chain`.
  chain?: Chain;
}

export interface ProofPollClient {
  readonly escrow: Address;
  getSurvey(surveyId: bigint): Promise<Survey>;
  remainingSlots(surveyId: bigint): Promise<bigint>;
  hasResponded(surveyId: bigint, nullifier: bigint): Promise<boolean>;
  nextSurveyId(): Promise<bigint>;
  createSurvey(args: CreateSurveyArgs): Promise<Hex>;
  submitResponse(args: SubmitResponseArgs): Promise<Hex>;
  closeSurvey(surveyId: bigint): Promise<Hex>;
}

/// A thin, typed wrapper around `RewardEscrow` over viem clients.
export function createProofPollClient(config: ProofPollClientConfig): ProofPollClient {
  const { escrow, publicClient, walletClient } = config;

  function resolveWrite(): { account: Account | Address; chain: Chain | undefined } {
    if (!walletClient) throw new Error("ProofPoll: walletClient is required for writes");
    const account = config.account ?? walletClient.account;
    if (!account) throw new Error("ProofPoll: an account is required for writes");
    return { account, chain: config.chain ?? walletClient.chain };
  }

  return {
    escrow,

    async getSurvey(surveyId) {
      const s = await publicClient.readContract({
        address: escrow,
        abi: rewardEscrowAbi,
        functionName: "getSurvey",
        args: [surveyId],
      });
      return s as Survey;
    },

    remainingSlots(surveyId) {
      return publicClient.readContract({
        address: escrow,
        abi: rewardEscrowAbi,
        functionName: "remainingSlots",
        args: [surveyId],
      });
    },

    hasResponded(surveyId, nullifier) {
      return publicClient.readContract({
        address: escrow,
        abi: rewardEscrowAbi,
        functionName: "hasResponded",
        args: [surveyId, nullifier],
      });
    },

    nextSurveyId() {
      return publicClient.readContract({
        address: escrow,
        abi: rewardEscrowAbi,
        functionName: "nextSurveyId",
      });
    },

    createSurvey(args) {
      const { account, chain } = resolveWrite();
      return walletClient!.writeContract({
        address: escrow,
        abi: rewardEscrowAbi,
        functionName: "createSurvey",
        args: [args.rewardPerResponse, args.maxResponses, args.schemaHash],
        account,
        chain,
      });
    },

    submitResponse(args) {
      const { account, chain } = resolveWrite();
      return walletClient!.writeContract({
        address: escrow,
        abi: rewardEscrowAbi,
        functionName: "submitResponse",
        args: [args.surveyId, args.responseHash, args.proof],
        account,
        chain,
      });
    },

    closeSurvey(surveyId) {
      const { account, chain } = resolveWrite();
      return walletClient!.writeContract({
        address: escrow,
        abi: rewardEscrowAbi,
        functionName: "closeSurvey",
        args: [surveyId],
        account,
        chain,
      });
    },
  };
}
