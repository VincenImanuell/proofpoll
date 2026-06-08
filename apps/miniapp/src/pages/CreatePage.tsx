import { useState } from "react";
import { parseUnits } from "viem";
import { CreateSurveyForm, type CreateSurveySuccess } from "@proofpoll/react";
import type { SurveySchema } from "@proofpoll/sdk";
import { SchemaBuilder } from "../components/SchemaBuilder";
import { DEMO_SCHEMA, saveSchema } from "../lib/schemaStore";

export function CreatePage() {
  const [schema, setSchema] = useState<SurveySchema>(DEMO_SCHEMA);
  const [reward, setReward] = useState("0.5");
  const [max, setMax] = useState("100");
  const [done, setDone] = useState<CreateSurveySuccess>();

  let rewardWei = 0n;
  let maxN = 0n;
  let parseOk = true;
  try {
    rewardWei = parseUnits(reward || "0", 18);
    maxN = BigInt(max || "0");
  } catch {
    parseOk = false;
  }
  const valid = parseOk && rewardWei > 0n && maxN > 0n && schema.title.trim().length > 0 && schema.questions.length > 0;

  function onSuccess(r: CreateSurveySuccess) {
    if (r.surveyId !== undefined) saveSchema(r.surveyId, schema);
    setDone(r);
  }

  if (done && done.surveyId !== undefined) {
    const link = `${location.origin}/s/${done.surveyId.toString()}`;
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-celo-yellow">Survey #{done.surveyId.toString()} is live 🎉</h2>
        <p className="text-sm">
          Share this link with respondents:
          <br />
          <code className="break-all">{link}</code>
        </p>
        <p className="text-sm">
          Save your decryption key (you need it to read answers):
          <br />
          <code className="break-all">{done.answerKey}</code>
        </p>
        {done.explorerUrl ? (
          <a href={done.explorerUrl} target="_blank" rel="noreferrer" className="underline text-sm">
            View creation tx ↗
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Create a survey</h1>
      <SchemaBuilder schema={schema} onChange={setSchema} />
      <div className="flex gap-2">
        <label className="flex-1 text-sm">
          Reward per response (cUSD)
          <input className="input mt-1" inputMode="decimal" value={reward} onChange={(e) => setReward(e.target.value)} />
        </label>
        <label className="flex-1 text-sm">
          Max responses
          <input className="input mt-1" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
        </label>
      </div>
      <p className="text-xs opacity-70">
        Escrow up front: {parseOk ? `${reward || 0} × ${max || 0} cUSD` : "enter valid numbers"}
      </p>
      {valid ? (
        <CreateSurveyForm
          schema={schema}
          rewardPerResponse={rewardWei}
          maxResponses={maxN}
          onSuccess={onSuccess}
          className="space-y-2"
        />
      ) : (
        <p className="text-xs text-red-300">Add a title, at least one question, and a valid reward + max.</p>
      )}
    </div>
  );
}
