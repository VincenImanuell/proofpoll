import type { ReactNode } from "react";
import type { Hex } from "viem";
import { useProofPoll } from "../hooks/useProofPoll.js";

export interface TxLinkProps {
  hash: Hex;
  children?: ReactNode;
  className?: string;
  label?: string;
}

/// Anchor to the transaction on the configured block explorer (Blockscout on Celo Sepolia).
export function TxLink({ hash, children, className, label = "View on explorer ↗" }: TxLinkProps) {
  const { txUrl } = useProofPoll();
  return (
    <a href={txUrl(hash)} target="_blank" rel="noreferrer" className={className}>
      {children ?? label}
    </a>
  );
}
