import { useEffect, useRef } from "react";
import { formatUnits, type Hex } from "viem";
import type { ConsentRecord, SurveySchema } from "@proofpoll/sdk";
import { useProofPoll } from "../hooks/useProofPoll.js";
import { useCUSD } from "../hooks/useCUSD.js";
import { useCreateSurvey } from "../hooks/useCreateSurvey.js";
import { TxStatus } from "./TxStatus.js";

export interface CreateSurveySuccess {
  surveyId?: bigint;
  txHash?: Hex;
  schemaHash?: Hex;
  explorerUrl?: string;
  totalFunded?: bigint;
  /// AES key (base64) the organizer MUST save to decrypt responses.
  answerKey: string;
}

export interface CreateSurveyFormProps {
  schema: SurveySchema;
  /// Reward per response in wei (18-dec cUSD).
  rewardPerResponse: bigint;
  maxResponses: bigint;
  consent?: Partial<ConsentRecord>;
  onSuccess?: (result: CreateSurveySuccess) => void;
  onError?: (error: Error) => void;
  className?: string;
  submitLabel?: string;
}

/// Organizer create + fund widget: approve cUSD (if needed) then `createSurvey`. Surfaces the
/// generated answer key the organizer must keep.
export function CreateSurveyForm({
  schema,
  rewardPerResponse,
  maxResponses,
  onSuccess,
  onError,
  className,
  submitLabel,
}: CreateSurveyFormProps) {
  const { txUrl } = useProofPoll();
  const { balanceFormatted } = useCUSD();
  const create = useCreateSurvey();
  const total = rewardPerResponse * maxResponses;
  const answerKeyRef = useRef<string>();

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const notified = useRef(false);
  useEffect(() => {
    if (create.status === "success" && !notified.current) {
      notified.current = true;
      onSuccessRef.current?.({
        surveyId: create.surveyId,
        txHash: create.createHash,
        schemaHash: create.schemaHash,
        explorerUrl: create.createHash ? txUrl(create.createHash) : undefined,
        totalFunded: create.totalFunded,
        answerKey: answerKeyRef.current ?? "",
      });
    }
    if (create.status === "error" && create.error) onError?.(create.error);
  }, [create.status, create.surveyId, create.createHash, create.schemaHash, create.totalFunded, create.error, txUrl, onError]);

  async function onSubmit() {
    const { answerKey } = await create.create({ schema, rewardPerResponse, maxResponses });
    answerKeyRef.current = answerKey;
  }

  const busy = create.status !== "idle" && create.status !== "success" && create.status !== "error";
  const phase = create.status === "approving" ? "pending" : create.status === "creating" ? "pending" : create.status;

  return (
    <div className={className}>
      <p>
        Funding <strong>{formatUnits(total, 18)} cUSD</strong> ({formatUnits(rewardPerResponse, 18)} × {maxResponses.toString()})
        {balanceFormatted ? <> · your balance: {balanceFormatted} cUSD</> : null}
      </p>
      <button type="button" disabled={busy} onClick={() => void onSubmit()}>
        {submitLabel ?? "Create & fund survey"}
      </button>
      {create.approveHash ? (
        <TxStatus status="success" hash={create.approveHash} labels={{ success: "cUSD approved ✓" }} />
      ) : null}
      <TxStatus status={phase} hash={create.createHash} error={create.error} />
      {create.status === "success" ? (
        <p>
          Survey #{create.surveyId?.toString()} created. Save your decryption key:{" "}
          <code>{answerKeyRef.current}</code>
        </p>
      ) : null}
    </div>
  );
}
