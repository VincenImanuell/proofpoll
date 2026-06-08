import type { Hex } from "viem";
import { TxLink } from "./TxLink.js";

export type TxPhase = "idle" | "simulating" | "pending" | "confirming" | "success" | "error";

export interface TxStatusProps {
  status: TxPhase;
  hash?: Hex;
  error?: Error;
  labels?: Partial<Record<TxPhase, string>>;
  className?: string;
}

const DEFAULT_LABELS: Record<TxPhase, string> = {
  idle: "",
  simulating: "Checking…",
  pending: "Confirm in your wallet…",
  confirming: "Submitting on-chain…",
  success: "Done ✓",
  error: "Failed",
};

/// Presentational status line + explorer link. No data fetching; reverted txs arrive already
/// mapped to `error` by the write hooks.
export function TxStatus({ status, hash, error, labels, className }: TxStatusProps) {
  if (status === "idle") return null;
  const label = labels?.[status] ?? DEFAULT_LABELS[status];
  return (
    <div className={className} role="status" aria-live="polite">
      <span>{label}</span>
      {status === "error" && error ? <span> — {error.message}</span> : null}
      {hash ? (
        <>
          {" "}
          <TxLink hash={hash} />
        </>
      ) : null}
    </div>
  );
}
