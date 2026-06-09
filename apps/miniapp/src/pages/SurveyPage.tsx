import { useState } from "react";
import { useParams } from "react-router-dom";
import { SurveyWidget, type SurveyWidgetSuccess } from "@proofpoll/react";
import { DEMO_SCHEMA, loadSchema } from "../lib/schemaStore";

export function SurveyPage() {
  const { surveyId } = useParams();
  const [done, setDone] = useState<SurveyWidgetSuccess>();

  let id: bigint | undefined;
  try {
    id = surveyId !== undefined ? BigInt(surveyId) : undefined;
  } catch {
    id = undefined;
  }
  if (id === undefined) return <p>Invalid survey id.</p>;

  const schema = loadSchema(id) ?? DEMO_SCHEMA;

  if (done) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-celo-yellow">You earned {done.rewardFormatted} cUSD 🎉</h2>
        <p className="text-sm opacity-80">Paid instantly, in the same transaction as your answer.</p>
        {done.explorerUrl ? (
          <a href={done.explorerUrl} target="_blank" rel="noreferrer" className="underline text-sm">
            View your payout on Blockscout ↗
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* `upload` pins the encrypted answer to IPFS when a Lighthouse key is configured, so the
          committed answer stays recoverable; otherwise the widget surfaces `encrypted` in onSuccess. */}
      <SurveyWidget surveyId={id} schema={schema} upload onSuccess={setDone} className="space-y-4" />
    </div>
  );
}
