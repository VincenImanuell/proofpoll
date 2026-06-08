import { useCallback, useEffect, useRef, useState } from "react";
import { encodeFunctionData, erc20Abi, formatUnits, type Address, type Hex } from "viem";
import { useProofPoll } from "./useProofPoll.js";

export interface UseCUSDResult {
  address: Address;
  balance?: bigint;
  balanceFormatted?: string;
  allowance: (spender: Address) => Promise<bigint>;
  approve: (spender: Address, amount: bigint) => Promise<Hex>;
  loading: boolean;
  refetch: () => Promise<void>;
}

/// ERC-20 helper for the resolved reward token (`ctx.rewardToken`). Reads balance/allowance and
/// approves via a MiniPay-safe legacy tx. Used by `CreateSurveyForm` and to show the respondent's
/// growing balance after payout.
export function useCUSD(): UseCUSDResult {
  const { rewardToken, publicClient, account, sendLegacy } = useProofPoll();
  const [balance, setBalance] = useState<bigint>();
  const [loading, setLoading] = useState(false);
  const cancelRef = useRef(false);

  const refetch = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const b = await publicClient.readContract({
        address: rewardToken,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      });
      if (!cancelRef.current) setBalance(b);
    } catch {
      // ignore
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, [publicClient, rewardToken, account]);

  useEffect(() => {
    cancelRef.current = false;
    void refetch();
    return () => {
      cancelRef.current = true;
    };
  }, [refetch]);

  const allowance = useCallback(
    async (spender: Address): Promise<bigint> => {
      if (!account) return 0n;
      return publicClient.readContract({
        address: rewardToken,
        abi: erc20Abi,
        functionName: "allowance",
        args: [account, spender],
      });
    },
    [publicClient, rewardToken, account],
  );

  const approve = useCallback(
    (spender: Address, amount: bigint): Promise<Hex> =>
      sendLegacy(rewardToken, encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [spender, amount] })),
    [sendLegacy, rewardToken],
  );

  return {
    address: rewardToken,
    balance,
    balanceFormatted: balance !== undefined ? formatUnits(balance, 18) : undefined,
    allowance,
    approve,
    loading,
    refetch,
  };
}
