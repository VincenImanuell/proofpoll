/// Answer encryption for ProofPoll.
///
/// Answers are encrypted client-side with AES-256-GCM (authenticated) before they ever leave the
/// device; only the ciphertext goes to IPFS, and only its hash goes on-chain. The symmetric key is
/// shared out-of-band with the organizer/buyer — never put it on-chain.
///
/// Uses the Web Crypto API (`crypto.subtle`), available in browsers, MiniPay webviews, and Node 20+.

const ALG = "AES-GCM" as const;
const KEY_BITS = 256;
const IV_BYTES = 12;

export interface EncryptedAnswer {
  /// base64 ciphertext (includes the GCM auth tag).
  ciphertext: string;
  /// base64 96-bit IV/nonce.
  iv: string;
  alg: typeof ALG;
}

function subtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("Web Crypto unavailable: need a browser, MiniPay webview, or Node 20+");
  return c.subtle;
}

/// Copy into a fresh, plain `ArrayBuffer` so the bytes satisfy `BufferSource` regardless of the
/// caller's `Uint8Array` backing store (avoids the `ArrayBufferLike`/`SharedArrayBuffer` mismatch).
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/// Generate a fresh AES-256-GCM key.
export function generateAnswerKey(): Promise<CryptoKey> {
  return subtle().generateKey({ name: ALG, length: KEY_BITS }, true, ["encrypt", "decrypt"]);
}

/// Export a key to a base64 string for out-of-band sharing.
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await subtle().exportKey("raw", key);
  return toBase64(new Uint8Array(raw));
}

/// Import a base64 key produced by `exportKey`.
export function importKey(b64: string): Promise<CryptoKey> {
  return subtle().importKey("raw", toArrayBuffer(fromBase64(b64)), { name: ALG }, true, ["encrypt", "decrypt"]);
}

/// Encrypt a UTF-8 answer string. A random IV is generated per call.
export async function encryptAnswer(plaintext: string, key: CryptoKey): Promise<EncryptedAnswer> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = toArrayBuffer(new TextEncoder().encode(plaintext));
  const buf = await subtle().encrypt({ name: ALG, iv: toArrayBuffer(iv) }, key, data);
  return { ciphertext: toBase64(new Uint8Array(buf)), iv: toBase64(iv), alg: ALG };
}

/// Decrypt an `EncryptedAnswer` back to its UTF-8 plaintext.
export async function decryptAnswer(enc: EncryptedAnswer, key: CryptoKey): Promise<string> {
  const buf = await subtle().decrypt(
    { name: ALG, iv: toArrayBuffer(fromBase64(enc.iv)) },
    key,
    toArrayBuffer(fromBase64(enc.ciphertext)),
  );
  return new TextDecoder().decode(buf);
}
