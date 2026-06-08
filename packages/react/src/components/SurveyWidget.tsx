import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Hex } from "viem";
import {
  exportKey,
  generateAnswerKey,
  importKey,
  prepareResponse,
  type ConsentRecord,
  type SurveyQuestion,
  type SurveySchema,
} from "@proofpoll/sdk";
import { useProofPoll } from "../hooks/useProofPoll.js";
import { useReward } from "../hooks/useReward.js";
import { useSurvey } from "../hooks/useSurvey.js";
import { QuestionInput } from "./QuestionInput.js";
import { TxStatus } from "./TxStatus.js";
import { VerifiedHumanGate } from "./VerifiedHumanGate.js";

export interface SurveyWidgetSuccess {
  txHash: Hex;
  reward?: bigint;
  rewardFormatted?: string;
  nullifier?: bigint;
  responseHash: Hex;
  /// The AES key (base64) the answer was encrypted with — surface it so the respondent can prove
  /// authorship / the organizer can decrypt.
  exportedKey: string;
  explorerUrl?: string;
}

export interface SurveyWidgetProps {
  surveyId: bigint;
  schema: SurveySchema;
  consent?: Partial<ConsentRecord>;
  /// Pin the ciphertext to IPFS (needs `lighthouseApiKey` on the provider).
  upload?: boolean;
  /// Wrap the form in `VerifiedHumanGate` (default true).
  requireGate?: boolean;
  /// Reuse a specific key (CryptoKey or base64). Defaults to a fresh per-response key.
  answerKey?: CryptoKey | string;
  onSuccess?: (result: SurveyWidgetSuccess) => void;
  onError?: (error: Error) => void;
  className?: string;
  renderQuestion?: (question: SurveyQuestion, value: unknown, onChange: (v: unknown) => void) => ReactNode;
  submitLabel?: string;
}

function isAnswered(q: SurveyQuestion, value: unknown): boolean {
  if (q.type === "multi") return Array.isArray(value) && value.length > 0;
  if (q.type === "text") return typeof value === "string" && value.trim().length > 0;
  return value !== undefined && value !== null && value !== "";
}

/// Respondent end-to-end widget: verify → answer → submit a single tx that pays out instantly.
export function SurveyWidget({
  surveyId,
  schema,
  consent,
  upload = false,
  requireGate = true,
  answerKey,
  onSuccess,
  onError,
  className,
  renderQuestion,
  submitLabel,
}: SurveyWidgetProps) {
  const { lighthouseApiKey } = useProofPoll();
  const { rewardFormatted, isOpen, isFull, schemaOk, loading } = useSurvey(surveyId, { schema });
  const reward = useReward();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const prepRef = useRef<{ responseHash: Hex; exportedKey: string }>();

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const notified = useRef(false);
  useEffect(() => {
    if (reward.status === "success" && reward.hash && prepRef.current && !notified.current) {
      notified.current = true;
      onSuccessRef.current?.({
        txHash: reward.hash,
        reward: reward.reward,
        rewardFormatted: reward.rewardFormatted,
        nullifier: reward.nullifier,
        responseHash: prepRef.current.responseHash,
        exportedKey: prepRef.current.exportedKey,
        explorerUrl: reward.explorerUrl,
      });
    }
  }, [reward.status, reward.hash, reward.reward, reward.rewardFormatted, reward.nullifier, reward.explorerUrl]);

  async function resolveKey(): Promise<{ key: CryptoKey; exportedKey: string }> {
    if (typeof answerKey === "string") return { key: await importKey(answerKey), exportedKey: answerKey };
    if (answerKey) return { key: answerKey, exportedKey: await exportKey(answerKey) };
    const key = await generateAnswerKey();
    return { key, exportedKey: await exportKey(key) };
  }

  async function submit(proof: Hex) {
    try {
      setBusy(true);
      const { key, exportedKey } = await resolveKey();
      const consentRecord: ConsentRecord = {
        purpose: "survey-response",
        resaleAllowed: false,
        grantedAt: new Date().toISOString(),
        ...consent,
      };
      const prepared = await prepareResponse({
        surveyId,
        answers,
        key,
        consent: consentRecord,
        upload: upload && lighthouseApiKey ? { apiKey: lighthouseApiKey } : undefined,
      });
      prepRef.current = { responseHash: prepared.responseHash, exportedKey };
      await reward.submit({ surveyId, responseHash: prepared.responseHash, proof });
    } catch (e) {
      onError?.(e as Error);
    } finally {
      setBusy(false);
    }
  }

  function renderForm(proof: Hex): ReactNode {
    if (loading) return <p>Loading survey…</p>;
    if (schemaOk === false) {
      return <p role="alert">This survey's questions don't match the on-chain commitment — do not answer.</p>;
    }
    const allAnswered = schema.questions.every((q) => isAnswered(q, answers[q.id]));
    const txBusy = reward.status !== "idle" && reward.status !== "error" && reward.status !== "success";
    const disabled = !isOpen || isFull || busy || txBusy || !allAnswered;

    return (
      <div className={className}>
        <p>
          <strong>{schema.title}</strong>
          {rewardFormatted ? <> · earn {rewardFormatted} cUSD</> : null}
        </p>
        {schema.questions.map((q) => {
          const value = answers[q.id];
          const onChange = (v: unknown) => setAnswers((a) => ({ ...a, [q.id]: v }));
          return (
            <div key={q.id}>
              {renderQuestion ? renderQuestion(q, value, onChange) : <QuestionInput question={q} value={value} onChange={onChange} />}
            </div>
          );
        })}
        <button type="button" disabled={disabled} onClick={() => void submit(proof)}>
          {submitLabel ?? (rewardFormatted ? `Submit & earn ${rewardFormatted} cUSD` : "Submit")}
        </button>
        {!isOpen ? <p>This survey is closed.</p> : isFull ? <p>This survey is full.</p> : null}
        <TxStatus status={reward.status} hash={reward.hash} error={reward.error} />
      </div>
    );
  }

  if (requireGate) {
    return <VerifiedHumanGate onError={(_, reason) => onError?.(new Error(reason))}>{(proof) => renderForm(proof)}</VerifiedHumanGate>;
  }
  return <>{renderForm("0x")}</>;
}
