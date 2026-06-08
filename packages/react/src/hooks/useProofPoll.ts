import { useContext } from "react";
import { ProofPollContext, type ProofPollContextValue } from "../context.js";

/// Raw context escape hatch: the memoized SDK client, viem clients, resolved config, and the
/// shared connection + `sendLegacy` + `txUrl` helpers. Throws outside `<ProofPollProvider>`.
export function useProofPoll(): ProofPollContextValue {
  const ctx = useContext(ProofPollContext);
  if (!ctx) throw new Error("useProofPoll must be used within a <ProofPollProvider>.");
  return ctx;
}
