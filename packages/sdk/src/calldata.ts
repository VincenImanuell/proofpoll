import { encodeFunctionData, type Hex } from "viem";
import { rewardEscrowAbi } from "./abi/rewardEscrowAbi.js";

/// Pure calldata encoders for `RewardEscrow`. Useful for batching, MiniPay `eth_sendTransaction`,
/// gas estimation, or any flow where you want the encoded data without a wallet client.

export interface CreateSurveyArgs {
  rewardPerResponse: bigint;
  maxResponses: bigint;
  schemaHash: Hex;
}

export function encodeCreateSurvey(args: CreateSurveyArgs): Hex {
  return encodeFunctionData({
    abi: rewardEscrowAbi,
    functionName: "createSurvey",
    args: [args.rewardPerResponse, args.maxResponses, args.schemaHash],
  });
}

export interface SubmitResponseArgs {
  surveyId: bigint;
  responseHash: Hex;
  proof: Hex;
}

export function encodeSubmitResponse(args: SubmitResponseArgs): Hex {
  return encodeFunctionData({
    abi: rewardEscrowAbi,
    functionName: "submitResponse",
    args: [args.surveyId, args.responseHash, args.proof],
  });
}

export function encodeCloseSurvey(surveyId: bigint): Hex {
  return encodeFunctionData({
    abi: rewardEscrowAbi,
    functionName: "closeSurvey",
    args: [surveyId],
  });
}
