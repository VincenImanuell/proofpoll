/// Off-chain answer storage on IPFS via Lighthouse (https://lighthouse.storage).
///
/// ProofPoll stores only the *encrypted* answer off-chain and commits its hash on-chain. Lighthouse
/// is a Filecoin/IPFS pinning service with a simple HTTP upload; any IPFS pinner works — swap the
/// endpoint if you prefer your own node.

const LIGHTHOUSE_UPLOAD_URL = "https://node.lighthouse.storage/api/v0/add";
const DEFAULT_GATEWAY = "https://gateway.lighthouse.storage/ipfs/";

export interface UploadResult {
  /// IPFS content identifier.
  cid: string;
  /// `ipfs://<cid>` URI.
  uri: string;
  /// Bytes stored.
  size: number;
}

export interface UploadOptions {
  /// Lighthouse API key (https://files.lighthouse.storage/dashboard/apikey).
  apiKey: string;
  /// Filename recorded in the upload (cosmetic).
  name?: string;
  /// Override the upload endpoint (e.g. a self-hosted IPFS add API).
  endpoint?: string;
  /// Inject a fetch implementation (defaults to global `fetch`); handy for tests.
  fetchImpl?: typeof fetch;
}

/// Upload bytes (typically a serialized `EncryptedAnswer`) to IPFS and return its CID.
export async function uploadToLighthouse(
  data: string | Uint8Array,
  opts: UploadOptions,
): Promise<UploadResult> {
  if (!opts.apiKey) throw new Error("uploadToLighthouse: apiKey is required");
  const doFetch = opts.fetchImpl ?? globalThis.fetch;
  if (!doFetch) throw new Error("No fetch implementation available");

  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  // Copy into a plain ArrayBuffer so it satisfies BlobPart across TS lib versions.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const form = new FormData();
  form.append("file", new Blob([ab]), opts.name ?? "proofpoll-answer.json");

  const res = await doFetch(opts.endpoint ?? LIGHTHOUSE_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Lighthouse upload failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const json = (await res.json()) as { Hash: string; Size?: string | number };
  const cid = json.Hash;
  return { cid, uri: ipfsUri(cid), size: Number(json.Size ?? bytes.byteLength) };
}

/// `ipfs://<cid>` URI for a CID.
export function ipfsUri(cid: string): string {
  return `ipfs://${cid}`;
}

/// HTTP gateway URL for a CID or `ipfs://` URI.
export function ipfsGatewayUrl(cidOrUri: string, gateway: string = DEFAULT_GATEWAY): string {
  const cid = cidOrUri.replace(/^ipfs:\/\//, "");
  return `${gateway.replace(/\/$/, "")}/${cid}`;
}
