import { useCallback, useEffect, useReducer, useRef } from "react";
import { decodeEventLog, formatUnits, type Hex, type Log, type TransactionReceipt } from "viem";
import { encodeSubmitResponse, rewardEscrowAbi } from "@proofpoll/sdk";
import { useProofPoll } from "./useProofPoll.js";
import { friendlyError } from "../lib/errors.js";
import { waitOrThrow } from "../lib/receipt.js";

export type WriteStatus = "idle" | "simulating" | "pending" | "confirming" | "success" | "error";

export interface SubmitArgs {
  surveyId: bigint;
  responseHash: Hex;
  proof?: Hex;
}

interface RewardState {
  status: WriteStatus;
  hash?: Hex;
  receipt?: TransactionReceipt;
  reward?: bigint;
  rewardFormatted?: string;
  nullifier?: bigint;
  responseHash?: Hex;
  error?: Error;
  explorerUrl?: string;
}

type Action =
  | { type: "reset" }
  | { type: "status"; status: WriteStatus }
  | { type: "hash"; hash: Hex }
  | { type: "error"; error: Error }
  | { type: "success"; payload: Omit<RewardState, "status"> };

const INITIAL: RewardState = { status: "idle" };

function reducer(state: RewardState, action: Action): RewardState {
  switch (action.type) {
    case "reset":
      return INITIAL;
    case "status":
      return { ...state, status: action.status, error: undefined };
    case "hash":
      return { ...state, hash: action.hash };
    case "error":
      return { ...state, status: "error", error: action.error };
    case "success":
      return { ...state, ...action.payload, status: "success" };
  }
}

/// Parse the reward + nullifier out of the `ResponseSubmitted` log (the reward is paid in the same tx).
function parseResponseSubmitted(logs: Log[]): { reward?: bigint; nullifier?: bigint; responseHash?: Hex } {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({ abi: rewardEscrowAbi, data: log.data, topics: log.topics });
      if (decoded.eventName === "ResponseSubmitted") {
        const args = decoded.args as { reward: bigint; nullifier: bigint; responseHash: Hex };
        return { reward: args.reward, nullifier: args.nullifier, responseHash: args.responseHash };
      }
    } catch {
      // not this event
    }
  }
  return {};
}

export interface UseRewardResult extends RewardState {
  submit: (args: SubmitArgs) => Promise<void>;
  reset: () => void;
}

/// The respondent write state machine: simulate → send (MiniPay legacy tx or SDK) → wait → branch
/// on `receipt.status` → parse the reward. The reference for the other write hooks.
export function useReward(): UseRewardResult {
  const ctx = useProofPoll();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const safeDispatch = useCallback((a: Action) => {
    if (mounted.current) dispatch(a);
  }, []);

  const submit = useCallback(
    async ({ surveyId, responseHash, proof = "0x" }: SubmitArgs) => {
      const { client, publicClient, account, escrow, isMiniPay, sendLegacy, txUrl } = ctx;
      try {
        if (!account) throw new Error("Connect a wallet first.");

        // 1) Pre-flight: surface AlreadyResponded / NotVerified / SurveyFull before spending gas.
        safeDispatch({ type: "status", status: "simulating" });
        await publicClient.simulateContract({
          address: escrow,
          abi: rewardEscrowAbi,
          functionName: "submitResponse",
          args: [surveyId, responseHash, proof],
          account,
        });

        // 2) Send. Inside MiniPay use a legacy + feeCurrency tx; otherwise the SDK path.
        safeDispatch({ type: "status", status: "pending" });
        const hash = isMiniPay
          ? await sendLegacy(escrow, encodeSubmitResponse({ surveyId, responseHash, proof }))
          : await client.submitResponse({ surveyId, responseHash, proof });
        safeDispatch({ type: "hash", hash });

        // 3) Confirm — must branch on reverted status (viem won't throw for it).
        safeDispatch({ type: "status", status: "confirming" });
        const receipt = await waitOrThrow(publicClient, hash);

        const { reward, nullifier } = parseResponseSubmitted(receipt.logs);
        safeDispatch({
          type: "success",
          payload: {
            hash,
            receipt,
            reward,
            rewardFormatted: reward !== undefined ? formatUnits(reward, 18) : undefined,
            nullifier,
            responseHash,
            explorerUrl: txUrl(hash),
          },
        });
      } catch (e) {
        safeDispatch({ type: "error", error: new Error(friendlyError(e)) });
      }
    },
    [ctx, safeDispatch],
  );

  const reset = useCallback(() => safeDispatch({ type: "reset" }), [safeDispatch]);

  return { ...state, submit, reset };
}
