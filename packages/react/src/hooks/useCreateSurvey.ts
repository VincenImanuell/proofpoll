import { useCallback, useEffect, useReducer, useRef } from "react";
import { decodeEventLog, encodeFunctionData, erc20Abi, type Hex, type Log } from "viem";
import { encodeCreateSurvey, exportKey, generateAnswerKey, hashSchema, rewardEscrowAbi, type SurveySchema } from "@proofpoll/sdk";
import { useProofPoll } from "./useProofPoll.js";
import { friendlyError } from "../lib/errors.js";
import { waitOrThrow } from "../lib/receipt.js";

export type CreateStatus = "idle" | "approving" | "creating" | "confirming" | "success" | "error";

interface CreateState {
  status: CreateStatus;
  approveHash?: Hex;
  createHash?: Hex;
  surveyId?: bigint;
  totalFunded?: bigint;
  schemaHash?: Hex;
  error?: Error;
}

type Action =
  | { type: "reset" }
  | { type: "patch"; patch: Partial<CreateState> }
  | { type: "error"; error: Error };

const INITIAL: CreateState = { status: "idle" };

function reducer(state: CreateState, action: Action): CreateState {
  switch (action.type) {
    case "reset":
      return INITIAL;
    case "patch":
      return { ...state, ...action.patch, error: undefined };
    case "error":
      return { ...state, status: "error", error: action.error };
  }
}

function parseSurveyCreated(logs: Log[]): { surveyId?: bigint; funded?: bigint } {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({ abi: rewardEscrowAbi, data: log.data, topics: log.topics });
      if (decoded.eventName === "SurveyCreated") {
        const args = decoded.args as { surveyId: bigint; funded: bigint };
        return { surveyId: args.surveyId, funded: args.funded };
      }
    } catch {
      // not this event
    }
  }
  return {};
}

export interface CreateArgs {
  schema: SurveySchema;
  rewardPerResponse: bigint;
  maxResponses: bigint;
}

export interface UseCreateSurveyResult extends CreateState {
  create: (args: CreateArgs) => Promise<{ surveyId?: bigint; answerKey: string }>;
  reset: () => void;
}

/// Organizer fund + create flow. Approves cUSD if needed, then `createSurvey`. Generates and
/// returns an AES answer key (the organizer must keep it to decrypt responses).
export function useCreateSurvey(): UseCreateSurveyResult {
  const ctx = useProofPoll();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const patch = useCallback((p: Partial<CreateState>) => {
    if (mounted.current) dispatch({ type: "patch", patch: p });
  }, []);

  const create = useCallback(
    async ({ schema, rewardPerResponse, maxResponses }: CreateArgs) => {
      const { client, publicClient, account, escrow, rewardToken, isMiniPay, sendLegacy } = ctx;
      const schemaHash = hashSchema(schema);
      const total = rewardPerResponse * maxResponses;
      const answerKey = await exportKey(await generateAnswerKey());
      try {
        if (!account) throw new Error("Connect a wallet first.");
        patch({ status: "approving", schemaHash, totalFunded: total });

        // Approve cUSD if the escrow can't pull the full pool yet.
        const allowance = await publicClient.readContract({
          address: rewardToken,
          abi: erc20Abi,
          functionName: "allowance",
          args: [account, escrow],
        });
        if (allowance < total) {
          const approveHash = await sendLegacy(
            rewardToken,
            encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [escrow, total] }),
          );
          patch({ approveHash });
          await waitOrThrow(publicClient, approveHash);
        }

        patch({ status: "creating" });
        const createHash = isMiniPay
          ? await sendLegacy(escrow, encodeCreateSurvey({ rewardPerResponse, maxResponses, schemaHash }))
          : await client.createSurvey({ rewardPerResponse, maxResponses, schemaHash });
        patch({ createHash });

        patch({ status: "confirming" });
        const receipt = await waitOrThrow(publicClient, createHash);

        let { surveyId, funded } = parseSurveyCreated(receipt.logs);
        if (surveyId === undefined) {
          // Fallback: the just-created id is nextSurveyId - 1.
          const next = await client.nextSurveyId();
          surveyId = next > 0n ? next - 1n : 0n;
        }
        patch({ status: "success", surveyId, totalFunded: funded ?? total });
        return { surveyId, answerKey };
      } catch (e) {
        if (mounted.current) dispatch({ type: "error", error: new Error(friendlyError(e)) });
        return { surveyId: undefined, answerKey };
      }
    },
    [ctx, patch],
  );

  const reset = useCallback(() => {
    if (mounted.current) dispatch({ type: "reset" });
  }, []);

  return { ...state, create, reset };
}
