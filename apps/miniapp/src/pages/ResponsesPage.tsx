import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatUnits, type Address, type Hex } from "viem";
import { useProofPoll } from "@proofpoll/react";
import { rewardEscrowAbi } from "@proofpoll/sdk";

interface Resp {
  respondent: Address;
  nullifier: bigint;
  responseHash: Hex;
  reward: bigint;
  txHash: Hex;
}

function short(s: string): string {
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export function ResponsesPage() {
  const { surveyId } = useParams();
  const { publicClient, escrow, txUrl } = useProofPoll();
  const [rows, setRows] = useState<Resp[]>([]);
  const [loading, setLoading] = useState(true);

  let id: bigint | undefined;
  try {
    id = surveyId !== undefined ? BigInt(surveyId) : undefined;
  } catch {
    id = undefined;
  }

  useEffect(() => {
    if (id === undefined) {
      setLoading(false);
      return;
    }
    let mounted = true;
    void (async () => {
      try {
        const logs = await publicClient.getContractEvents({
          address: escrow,
          abi: rewardEscrowAbi,
          eventName: "ResponseSubmitted",
          args: { surveyId: id },
          fromBlock: "earliest",
        });
        if (mounted) {
          setRows(
            logs.map((l) => ({
              respondent: l.args.respondent as Address,
              nullifier: l.args.nullifier as bigint,
              responseHash: l.args.responseHash as Hex,
              reward: l.args.reward as bigint,
              txHash: l.transactionHash as Hex,
            })),
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [publicClient, escrow, id]);

  if (id === undefined) return <p>Invalid survey id.</p>;
  if (loading) return <p>Loading responses…</p>;

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold">Survey #{id.toString()} responses</h1>
      <p className="text-xs opacity-70">
        Each row is a distinct verified-human wallet making a real on-chain transaction.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm opacity-80">No responses yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.txHash} className="rounded border border-white/10 p-2 text-sm">
              <div className="flex justify-between">
                <span>{short(r.respondent)}</span>
                <span className="text-celo-yellow">{formatUnits(r.reward, 18)} cUSD</span>
              </div>
              <a href={txUrl(r.txHash)} target="_blank" rel="noreferrer" className="text-xs underline opacity-70">
                {short(r.txHash)} ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
