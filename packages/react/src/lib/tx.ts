import { numberToHex, type Address, type Hex, type PublicClient, type WalletClient } from "viem";

export interface SendLegacyParams {
  walletClient: WalletClient;
  publicClient: PublicClient;
  account: Address;
  to: Address;
  data: Hex;
  /// Celo fee token (cUSD). When set, gas is paid in it (CIP-64). Omitted → native CELO.
  feeCurrency?: Address | null;
  value?: bigint;
}

/// The single MiniPay-safe write primitive every write hook and the stub gate use.
///
/// MiniPay expects **legacy** transactions and lets users pay gas in a stablecoin via Celo's
/// `feeCurrency`. We send the request straight through the injected provider's `eth_sendTransaction`
/// (rather than viem's `writeContract`/`sendTransaction`) so the non-standard `feeCurrency` field is
/// passed verbatim to the wallet — viem's default formatter would otherwise drop it, and this keeps
/// the chain type plain (no Celo formatters) so it stays compatible with the SDK's clients.
export async function sendLegacy(p: SendLegacyParams): Promise<Hex> {
  const tx: Record<string, unknown> = { from: p.account, to: p.to, data: p.data };
  if (p.value !== undefined) tx.value = numberToHex(p.value);

  if (p.feeCurrency) {
    tx.feeCurrency = p.feeCurrency;
    try {
      // Celo extends eth_gasPrice with an optional fee-currency argument (gas quoted in that token).
      const gasPrice = await (p.publicClient.request as (a: unknown) => Promise<Hex>)({
        method: "eth_gasPrice",
        params: [p.feeCurrency],
      });
      tx.gasPrice = gasPrice;
    } catch {
      // Let the wallet quote gas if the node rejects the fee-currency argument.
    }
  }

  return (p.walletClient.request as (a: unknown) => Promise<Hex>)({
    method: "eth_sendTransaction",
    params: [tx],
  });
}
