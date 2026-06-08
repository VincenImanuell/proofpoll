import { Link } from "react-router-dom";
import { useWallet } from "@proofpoll/react";

export function Home() {
  const { isMiniPay, connected } = useWallet();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold leading-tight">
        Get paid to be a <span className="text-celo-yellow">verified human</span>.
      </h1>
      <p className="text-sm opacity-80">
        Answer a survey as a unique, Self-verified human and receive a guaranteed cUSD reward
        instantly — escrowed up front by the organizer. No lottery, no entrant pot, no chance.
      </p>
      <p className="text-xs opacity-60">
        {isMiniPay
          ? connected
            ? "Connected in MiniPay."
            : "Connecting to MiniPay…"
          : "Open in MiniPay, or connect a wallet above."}
      </p>
      <div className="flex gap-3">
        <Link to="/surveys" className="btn-primary">
          Browse surveys
        </Link>
        <Link to="/create" className="rounded border border-white/20 px-4 py-2">
          Create a survey
        </Link>
      </div>
    </div>
  );
}
