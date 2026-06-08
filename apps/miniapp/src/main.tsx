import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ProofPollProvider } from "@proofpoll/react";
import { App } from "./App";
import { config, isConfigured } from "./config";
import "./index.css";

function ConfigNotice() {
  return (
    <div className="min-h-screen bg-celo-dark text-white p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-2">ProofPoll — not configured</h1>
      <p className="text-sm opacity-80">
        Set <code>VITE_ESCROW</code>, <code>VITE_VERIFIER</code>, and <code>VITE_MOCK_HUB</code> in
        <code> .env.local</code> from <code>deployments/celo-sepolia.json</code> (produced by
        <code> DeployTestnet.s.sol</code>), then reload.
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {isConfigured ? (
        <ProofPollProvider
          escrow={config.escrow!}
          verifier={config.verifier!}
          mockHub={config.mockHub}
          lighthouseApiKey={config.lighthouseApiKey}
        >
          <App />
        </ProofPollProvider>
      ) : (
        <ConfigNotice />
      )}
    </BrowserRouter>
  </React.StrictMode>,
);
