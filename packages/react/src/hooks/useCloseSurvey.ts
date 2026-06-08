import { useCallback, useEffect, useReducer, useRef } from "react";
import { decodeEventLog, type Hex, type Log } from "viem";
import { encodeCloseSurvey, rewardEscrowAbi } from "@proofpoll/sdk";
import { useProofPoll } from "./useProofPoll.js";
import { friendlyError } from "../lib/errors.js";
import { waitOrThrow } from "../lib/receipt.js";

export type CloseStatus = "idle" | "pending" | "confirming" | "success" | "error";

interface CloseState {
  status: CloseStatus;
  hash?: Hex;
  refunded?: bigint;
  error?: Error;
}

type Action = { type: "reset" } | { type: "patch"; patch: Partial<CloseState> } | { type: "error"; error: Error };

const INITIAL: CloseState = { status: "idle" };

function reducer(state: CloseState, action: Action): CloseState {
  switch (action.type) {
    case "reset":
      return INITIAL;
    case "patch":
      return { ...state, ...action.patch, error: undefined };
    case "error":
      return { ...state, status: "error", error: action.error };
  }
}

function parseRefund(logs: Log[]): bigint | undefined {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({ abi: rewardEscrowAbi, data: log.data, topics: log.topics });
      if (decoded.eventName === "SurveyClosed") {
        return (decoded.args as { refunded: bigint }).refunded;
      }
    } catch {
      // not this event
    }
  }
  return undefined;
}

export interface UseCloseSurveyResult extends CloseState {
  close: (surveyId: bigint) => Promise<void>;
  reset: () => void;
}

/// Organizer early-close + escrow reclaim.
export function useCloseSurvey(): UseCloseSurveyResult {
  const ctx = useProofPoll();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const patch = useCallback((p: Partial<CloseState>) => {
    if (mounted.current) dispatch({ type: "patch", patch: p });
  }, []);

  const close = useCallback(
    async (surveyId: bigint) => {
      const { client, publicClient, escrow, isMiniPay, sendLegacy } = ctx;
      try {
        patch({ status: "pending" });
        const hash = isMiniPay
          ? await sendLegacy(escrow, encodeCloseSurvey(surveyId))
          : await client.closeSurvey(surveyId);
        patch({ hash, status: "confirming" });
        const receipt = await waitOrThrow(publicClient, hash);
        patch({ status: "success", refunded: parseRefund(receipt.logs) });
      } catch (e) {
        if (mounted.current) dispatch({ type: "error", error: new Error(friendlyError(e)) });
      }
    },
    [ctx, patch],
  );

  const reset = useCallback(() => {
    if (mounted.current) dispatch({ type: "reset" });
  }, []);

  return { ...state, close, reset };
}
