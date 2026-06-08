import { useEffect, useRef, type ReactNode } from "react";
import type { Hex } from "viem";
import { useProofPoll } from "../hooks/useProofPoll.js";
import { useVerification, type VerificationError, type VerificationStatus } from "../hooks/useVerification.js";

export interface VerifiedHumanGateProps {
  /// Content shown once verified. As a function it receives the proof (`0x` in stub mode).
  children: ReactNode | ((proof: Hex) => ReactNode);
  onVerified?: (proof: Hex) => void;
  onError?: (code: string, reason: string) => void;
  scope?: string;
  /// Read `isHuman(account)` on mount and skip straight to verified if already a known human.
  autoCheck?: boolean;
  renderUnverified?: (state: {
    status: VerificationStatus;
    verify: () => Promise<void>;
    universalLink: string;
    sessionId: string;
    error?: VerificationError;
  }) => ReactNode;
  className?: string;
}

/// Clearly-named, pluggable **stub** for the Self proof-of-personhood step (no `@selfxyz` import).
/// Its surface mirrors the real Self SDK so the production swap replaces only this component's body.
/// On testnet it registers the wallet via `MockSelfHub.pushHuman`; on mainnet (`gateMode: "self"`)
/// the verify body becomes the real Self flow.
export function VerifiedHumanGate({
  children,
  onVerified,
  onError,
  scope = "proofpoll",
  autoCheck = true,
  renderUnverified,
  className,
}: VerifiedHumanGateProps) {
  const { account } = useProofPoll();
  const { status, isHuman, verify, recheck, universalLink, sessionId, error } = useVerification(scope);

  useEffect(() => {
    if (autoCheck && account) void recheck();
  }, [autoCheck, account, recheck]);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  useEffect(() => {
    if (error) onErrorRef.current?.(error.error_code, error.reason);
  }, [error]);

  const verified = status === "verified" || isHuman;
  const notifiedRef = useRef(false);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;
  useEffect(() => {
    if (verified && !notifiedRef.current) {
      notifiedRef.current = true;
      onVerifiedRef.current?.("0x");
    }
  }, [verified]);

  if (verified) {
    return <>{typeof children === "function" ? children("0x") : children}</>;
  }

  const doVerify = async () => {
    try {
      await verify();
    } catch {
      // surfaced via the error state / onError
    }
  };

  if (renderUnverified) {
    return <>{renderUnverified({ status, verify: doVerify, universalLink, sessionId, error })}</>;
  }

  const busy = status === "proving" || status === "awaiting-scan";
  return (
    <div className={className}>
      <button type="button" onClick={() => void doVerify()} disabled={busy}>
        {busy ? "Verifying…" : "I'm a human (testnet)"}
      </button>
      <p>
        Or open on your phone:{" "}
        <code>{universalLink}</code>
      </p>
      {error ? <p role="alert">{error.reason}</p> : null}
    </div>
  );
}
