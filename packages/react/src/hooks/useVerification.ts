import { useCallback, useEffect, useRef, useState } from "react";
import { encodeFunctionData, keccak256, type Hex } from "viem";
import { selfHumanVerifierAbi } from "@proofpoll/sdk";
import { mockSelfHubAbi } from "../abi/mockSelfHubAbi.js";
import { useProofPoll } from "./useProofPoll.js";
import { friendlyError } from "../lib/errors.js";
import { waitOrThrow } from "../lib/receipt.js";

export type VerificationStatus = "idle" | "awaiting-scan" | "proving" | "verified" | "error";
export interface VerificationError {
  error_code: string;
  reason: string;
}

export interface UseVerificationResult {
  status: VerificationStatus;
  isHuman: boolean;
  sessionId: string;
  universalLink: string;
  error?: VerificationError;
  /// Runs the verification lifecycle and resolves a proof (`0x` in stub mode).
  verify: () => Promise<Hex>;
  /// Re-reads `SelfHumanVerifier.isHuman(account)`.
  recheck: () => Promise<boolean>;
}

function newSession(): string {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return Math.random().toString(16).slice(2);
  }
}

/// Headless engine behind `VerifiedHumanGate`.
///
/// In **stub** mode (testnet) `verify()` registers the wallet on-chain via
/// `MockSelfHub.pushHuman(verifier, account, nullifier)` so `submitResponse` won't revert
/// `NotVerified`. NOTE: `pushHuman` is permissionless on the mock, so anti-Sybil is only *nominal*
/// on testnet — real Sybil resistance comes from Self on mainnet (`gateMode: "self"`), where only
/// the verify body changes.
export function useVerification(scope = "proofpoll"): UseVerificationResult {
  const { account, publicClient, verifier, mockHub, sendLegacy } = useProofPoll();
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [isHuman, setIsHuman] = useState(false);
  const [error, setError] = useState<VerificationError>();
  const sessionRef = useRef(newSession());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const recheck = useCallback(async (): Promise<boolean> => {
    if (!account) return false;
    try {
      const ok = await publicClient.readContract({
        address: verifier,
        abi: selfHumanVerifierAbi,
        functionName: "isHuman",
        args: [account],
      });
      if (mounted.current) {
        setIsHuman(ok);
        if (ok) setStatus("verified");
      }
      return ok;
    } catch {
      return false;
    }
  }, [account, publicClient, verifier]);

  const verify = useCallback(async (): Promise<Hex> => {
    if (!account) throw new Error("Connect a wallet first.");
    if (await recheck()) return "0x";
    // The stub verify body registers on-chain via MockSelfHub, so mockHub is always required here.
    // (The mainnet `gateMode: "self"` swap replaces this body with the real Self flow.)
    if (!mockHub) {
      throw new Error("mockHub address is required for on-chain verification registration.");
    }
    try {
      sessionRef.current = newSession();
      if (mounted.current) setStatus("awaiting-scan");
      // Real Self: the user scans the QR / opens the universal link here.
      if (mounted.current) setStatus("proving");
      const nullifier = BigInt(keccak256(account));
      const data = encodeFunctionData({
        abi: mockSelfHubAbi,
        functionName: "pushHuman",
        args: [verifier, account, nullifier],
      });
      const hash = await sendLegacy(mockHub, data);
      await waitOrThrow(publicClient, hash);
      await recheck();
      if (mounted.current) setStatus("verified");
      return "0x";
    } catch (e) {
      if (mounted.current) {
        setStatus("error");
        setError({ error_code: "verify_failed", reason: friendlyError(e) });
      }
      throw e;
    }
  }, [account, recheck, mockHub, verifier, sendLegacy, publicClient]);

  const universalLink = `https://redirect.self.xyz/?sessionId=${sessionRef.current}&scope=${encodeURIComponent(scope)}&endpoint=${verifier}`;

  return { status, isHuman, sessionId: sessionRef.current, universalLink, error, verify, recheck };
}
