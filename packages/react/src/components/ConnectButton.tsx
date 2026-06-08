import type { ReactNode } from "react";
import type { Address } from "viem";
import { useProofPoll } from "../hooks/useProofPoll.js";

export interface ConnectButtonProps {
  className?: string;
  label?: string;
  render?: (state: {
    connected: boolean;
    address?: Address;
    connect: () => Promise<Address>;
    isMiniPay: boolean;
  }) => ReactNode;
}

function truncate(addr?: Address): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

/// Renders nothing inside MiniPay (auto-connected, single account). For generic injected wallets it
/// shows a connect button. The `render` prop allows a full restyle.
export function ConnectButton({ className, label = "Connect Wallet", render }: ConnectButtonProps) {
  const { isMiniPay, connected, account, connect } = useProofPoll();

  if (render) return <>{render({ connected, address: account, connect, isMiniPay })}</>;
  if (isMiniPay) return null;

  return (
    <button type="button" className={className} onClick={() => void connect().catch(() => {})}>
      {connected ? truncate(account) : label}
    </button>
  );
}
