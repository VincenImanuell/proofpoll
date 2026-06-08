import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatUnits } from "viem";
import { useCloseSurvey, useProofPoll } from "@proofpoll/react";
import type { Survey } from "@proofpoll/sdk";

interface Row {
  id: bigint;
  survey: Survey;
}

export function SurveysPage() {
  const { client } = useProofPoll();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const next = await client.nextSurveyId();
        const out: Row[] = [];
        for (let i = 0n; i < next; i++) {
          out.push({ id: i, survey: await client.getSurvey(i) });
        }
        if (mounted) setRows(out);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [client]);

  if (loading) return <p>Loading surveys…</p>;
  if (rows.length === 0)
    return (
      <p>
        No surveys yet.{" "}
        <Link to="/create" className="underline">
          Create one
        </Link>
        .
      </p>
    );

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <SurveyRow key={r.id.toString()} row={r} />
      ))}
    </ul>
  );
}

function SurveyRow({ row }: { row: Row }) {
  const close = useCloseSurvey();
  const { survey, id } = row;
  return (
    <li className="rounded border border-white/10 p-3">
      <div className="flex justify-between">
        <Link to={`/s/${id.toString()}`} className="font-medium">
          Survey #{id.toString()}
        </Link>
        <span className="text-xs opacity-70">{survey.open ? "open" : "closed"}</span>
      </div>
      <p className="text-sm opacity-80">
        {formatUnits(survey.rewardPerResponse, 18)} cUSD · {survey.responseCount.toString()}/
        {survey.maxResponses.toString()} answered
      </p>
      <div className="mt-1 flex gap-3 text-xs">
        <Link to={`/responses/${id.toString()}`} className="underline">
          Responses
        </Link>
        {survey.open ? (
          <button type="button" className="underline" onClick={() => void close.close(id)}>
            Close &amp; refund
          </button>
        ) : null}
      </div>
      {close.status !== "idle" ? (
        <p className="mt-1 text-xs opacity-70">
          {close.status}
          {close.refunded !== undefined ? ` · refunded ${formatUnits(close.refunded, 18)} cUSD` : ""}
          {close.error ? ` · ${close.error.message}` : ""}
        </p>
      ) : null}
    </li>
  );
}
