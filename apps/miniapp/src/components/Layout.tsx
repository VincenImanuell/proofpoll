import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ConnectButton, useWallet } from "@proofpoll/react";
import { ChainGuard } from "./ChainGuard";

function truncate(addr?: string): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export function Layout({ children }: { children: ReactNode }) {
  const { isMiniPay, connected, address } = useWallet();

  return (
    <div className="min-h-screen bg-celo-dark text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2 font-bold text-celo-yellow">
          <img src="/logo.jpeg" alt="" className="h-7 w-7 rounded" />
          ProofPoll
        </Link>
        <nav className="flex gap-3 text-sm">
          <Link to="/surveys" className="opacity-80 hover:opacity-100">
            Surveys
          </Link>
          <Link to="/create" className="opacity-80 hover:opacity-100">
            Create
          </Link>
        </nav>
        <div className="text-sm">
          {isMiniPay ? (
            connected ? (
              <span className="opacity-80">{truncate(address)}</span>
            ) : (
              <span className="opacity-60">MiniPay…</span>
            )
          ) : (
            <ConnectButton className="rounded bg-celo-yellow text-black px-3 py-1 text-sm font-medium" />
          )}
        </div>
      </header>
      <ChainGuard />
      <main className="max-w-md mx-auto p-4">{children}</main>
    </div>
  );
}
