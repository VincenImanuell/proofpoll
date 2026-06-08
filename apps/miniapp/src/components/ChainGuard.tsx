import { useEffect, useState } from "react";
import { useWallet } from "@proofpoll/react";
import { CHAIN_ID } from "../config";

interface Eth {
  request: (args: { method: string }) => Promise<unknown>;
  on?: (event: string, cb: (id: string) => void) => void;
}

function injected(): Eth | undefined {
  return (window as unknown as { ethereum?: Eth }).ethereum;
}

/// Warns when the wallet isn't on Celo Sepolia (MiniPay supports only Celo Mainnet + Sepolia).
export function ChainGuard() {
  const { ensureChain, connected } = useWallet();
  const [walletChain, setWalletChain] = useState<number>();

  useEffect(() => {
    const eth = injected();
    if (!eth) return;
    let mounted = true;
    const read = () =>
      eth
        .request({ method: "eth_chainId" })
        .then((id) => mounted && setWalletChain(parseInt(id as string, 16)))
        .catch(() => {});
    void read();
    eth.on?.("chainChanged", () => void read());
    return () => {
      mounted = false;
    };
  }, [connected]);

  if (walletChain === undefined || walletChain === CHAIN_ID) return null;

  return (
    <div className="bg-celo-yellow text-black px-4 py-2 text-sm flex items-center justify-between">
      <span>Wrong network — switch to Celo Sepolia.</span>
      <button className="underline font-medium" onClick={() => void ensureChain()}>
        Switch
      </button>
    </div>
  );
}
