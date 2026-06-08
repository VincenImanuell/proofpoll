import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useProofPoll } from "./useProofPoll.js";

export interface UseWalletResult {
  address?: Address;
  chainId?: number;
  isMiniPay: boolean;
  connected: boolean;
  connect: () => Promise<Address>;
  ensureChain: () => Promise<void>;
}

/// Wallet + connection slice. Inside MiniPay the provider auto-connects on mount (single account);
/// generic injected wallets call `connect()` explicitly. `ensureChain()` switches to Celo Sepolia.
export function useWallet(): UseWalletResult {
  const { account, isMiniPay, connect, ensureChain, publicClient } = useProofPoll();
  const [chainId, setChainId] = useState<number>();

  useEffect(() => {
    let mounted = true;
    publicClient
      .getChainId()
      .then((id) => {
        if (mounted) setChainId(id);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [publicClient]);

  return { address: account, chainId, isMiniPay, connected: Boolean(account), connect, ensureChain };
}
