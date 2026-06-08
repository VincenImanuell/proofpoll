import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type Chain,
  type Hex,
  type WalletClient,
} from "viem";
import { createProofPollClient, rewardEscrowAbi } from "@proofpoll/sdk";
import { celoSepolia, FALLBACK_CUSD } from "./config.js";
import { ProofPollContext, type GateMode, type ProofPollContextValue } from "./context.js";
import { sendLegacy as sendLegacyTx } from "./lib/tx.js";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMiniPay?: boolean;
}

function getInjected(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum;
}

export interface ProofPollProviderProps {
  /// Deployed `RewardEscrow` (required).
  escrow: Address;
  /// Deployed `SelfHumanVerifier` (required).
  verifier: Address;
  /// Deployed `MockSelfHub` — required for the testnet stub gate (`gateMode: "stub"`).
  mockHub?: Address;
  children: ReactNode;
  chain?: Chain;
  rpcUrl?: string;
  /// Override the reward token; defaults to `RewardEscrow.payToken()` read at init.
  rewardToken?: Address;
  /// Override the gas fee token; defaults to the reward token. `null` → pay gas in CELO.
  feeCurrency?: Address | null;
  gateMode?: GateMode;
  autoConnect?: boolean;
  lighthouseApiKey?: string;
  onConnect?: (address: Address) => void;
}

export function ProofPollProvider({
  escrow,
  verifier,
  mockHub,
  children,
  chain: chainProp,
  rpcUrl,
  rewardToken: rewardTokenProp,
  feeCurrency: feeCurrencyProp,
  gateMode = "stub",
  autoConnect = true,
  lighthouseApiKey,
  onConnect,
}: ProofPollProviderProps) {
  const chain = chainProp ?? celoSepolia;
  const isMiniPay = useMemo(() => Boolean(getInjected()?.isMiniPay), []);

  const publicClient = useMemo(() => createPublicClient({ chain, transport: http(rpcUrl) }), [chain, rpcUrl]);
  const walletClient = useMemo<WalletClient | undefined>(() => {
    const eth = getInjected();
    return eth ? createWalletClient({ chain, transport: custom(eth) }) : undefined;
  }, [chain]);

  const [account, setAccount] = useState<Address | undefined>(undefined);
  const [rewardToken, setRewardToken] = useState<Address>(rewardTokenProp ?? FALLBACK_CUSD);
  const [feeCurrency, setFeeCurrency] = useState<Address | null>(
    feeCurrencyProp !== undefined ? feeCurrencyProp : (rewardTokenProp ?? FALLBACK_CUSD),
  );

  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;

  const connect = useCallback(async (): Promise<Address> => {
    if (!walletClient) throw new Error("No injected wallet found.");
    const [addr] = await walletClient.requestAddresses();
    if (!addr) throw new Error("Wallet returned no account.");
    setAccount(addr);
    onConnectRef.current?.(addr);
    return addr;
  }, [walletClient]);

  const ensureChain = useCallback(async () => {
    const eth = getInjected();
    if (!eth) return;
    const current = (await eth.request({ method: "eth_chainId" })) as Hex;
    if (parseInt(current, 16) === chain.id) return;
    const hexId = `0x${chain.id.toString(16)}`;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
    } catch (e) {
      if ((e as { code?: number }).code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexId,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : [],
            },
          ],
        });
      } else {
        throw e;
      }
    }
  }, [chain]);

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    let cancelled = false;
    void (async () => {
      if (rewardTokenProp === undefined) {
        try {
          const token = (await publicClient.readContract({
            address: escrow,
            abi: rewardEscrowAbi,
            functionName: "payToken",
          })) as Address;
          if (!cancelled && token) {
            setRewardToken(token);
            if (feeCurrencyProp === undefined) setFeeCurrency(token);
          }
        } catch {
          // keep the fallback cUSD
        }
      }
      if (isMiniPay && autoConnect && walletClient) {
        try {
          await connect();
        } catch {
          // user can connect manually
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [escrow, publicClient, walletClient, isMiniPay, autoConnect, connect, rewardTokenProp, feeCurrencyProp]);

  const client = useMemo(
    () => createProofPollClient({ escrow, publicClient, walletClient, account, chain }),
    [escrow, publicClient, walletClient, account, chain],
  );

  const txUrl = useCallback(
    (hash: Hex) => `${chain.blockExplorers?.default.url ?? ""}/tx/${hash}`,
    [chain],
  );

  const sendLegacy = useCallback(
    (to: Address, data: Hex, value?: bigint): Promise<Hex> => {
      if (!walletClient) throw new Error("No injected wallet to send a transaction.");
      if (!account) throw new Error("Connect a wallet first.");
      return sendLegacyTx({ walletClient, publicClient, account, to, data, feeCurrency, value });
    },
    [walletClient, publicClient, account, feeCurrency],
  );

  const value: ProofPollContextValue = useMemo(
    () => ({
      client,
      publicClient,
      walletClient,
      account,
      chain,
      escrow,
      verifier,
      mockHub,
      rewardToken,
      feeCurrency,
      isMiniPay,
      connected: Boolean(account),
      gateMode,
      lighthouseApiKey,
      connect,
      ensureChain,
      txUrl,
      sendLegacy,
    }),
    [
      client,
      publicClient,
      walletClient,
      account,
      chain,
      escrow,
      verifier,
      mockHub,
      rewardToken,
      feeCurrency,
      isMiniPay,
      gateMode,
      lighthouseApiKey,
      connect,
      ensureChain,
      txUrl,
      sendLegacy,
    ],
  );

  return <ProofPollContext.Provider value={value}>{children}</ProofPollContext.Provider>;
}
