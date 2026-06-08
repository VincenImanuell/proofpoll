import { useCallback, useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";
import { hashSchema, type Survey, type SurveySchema } from "@proofpoll/sdk";
import { useProofPoll } from "./useProofPoll.js";

export interface UseSurveyOptions {
  /// If given, validates that `hashSchema(schema) === survey.schemaHash` (`schemaOk`).
  schema?: SurveySchema;
  /// Re-read the survey on an interval (ms).
  pollMs?: number;
}

export interface UseSurveyResult {
  survey?: Survey;
  remainingSlots?: bigint;
  isFull: boolean;
  isOpen: boolean;
  rewardPerResponse?: bigint;
  rewardFormatted?: string;
  schemaOk?: boolean;
  loading: boolean;
  error?: Error;
  refetch: () => Promise<void>;
}

/// Reads `getSurvey(surveyId)` + `remainingSlots(surveyId)`. Disabled (no-op) until `surveyId` is
/// defined; never throws.
export function useSurvey(surveyId?: bigint, opts: UseSurveyOptions = {}): UseSurveyResult {
  const { client } = useProofPoll();
  const [survey, setSurvey] = useState<Survey>();
  const [remaining, setRemaining] = useState<bigint>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const cancelRef = useRef(false);

  const refetch = useCallback(async () => {
    if (surveyId === undefined) return;
    setLoading(true);
    setError(undefined);
    try {
      const [s, r] = await Promise.all([client.getSurvey(surveyId), client.remainingSlots(surveyId)]);
      if (cancelRef.current) return;
      setSurvey(s);
      setRemaining(r);
    } catch (e) {
      if (!cancelRef.current) setError(e as Error);
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, [client, surveyId]);

  useEffect(() => {
    cancelRef.current = false;
    void refetch();
    let timer: ReturnType<typeof setInterval> | undefined;
    if (opts.pollMs) timer = setInterval(() => void refetch(), opts.pollMs);
    return () => {
      cancelRef.current = true;
      if (timer) clearInterval(timer);
    };
  }, [refetch, opts.pollMs]);

  const rewardPerResponse = survey?.rewardPerResponse;
  return {
    survey,
    remainingSlots: remaining,
    isFull: remaining !== undefined ? remaining === 0n : false,
    isOpen: survey?.open ?? false,
    rewardPerResponse,
    rewardFormatted: rewardPerResponse !== undefined ? formatUnits(rewardPerResponse, 18) : undefined,
    schemaOk: opts.schema && survey ? hashSchema(opts.schema) === survey.schemaHash : undefined,
    loading,
    error,
    refetch,
  };
}
