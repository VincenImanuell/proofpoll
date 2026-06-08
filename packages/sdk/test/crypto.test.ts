import { describe, expect, it } from "vitest";
import {
  decryptAnswer,
  encryptAnswer,
  exportKey,
  generateAnswerKey,
  importKey,
} from "../src/crypto.js";

describe("crypto (AES-256-GCM)", () => {
  it("round-trips plaintext", async () => {
    const key = await generateAnswerKey();
    const plaintext = JSON.stringify({ q1: "Yes", q2: 42 });
    const enc = await encryptAnswer(plaintext, key);
    expect(enc.alg).toBe("AES-GCM");
    expect(enc.ciphertext).not.toContain("Yes");
    expect(await decryptAnswer(enc, key)).toBe(plaintext);
  });

  it("uses a fresh IV per call (ciphertext is non-deterministic)", async () => {
    const key = await generateAnswerKey();
    const a = await encryptAnswer("same", key);
    const b = await encryptAnswer("same", key);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("export/import key round-trips and still decrypts", async () => {
    const key = await generateAnswerKey();
    const enc = await encryptAnswer("secret", key);
    const restored = await importKey(await exportKey(key));
    expect(await decryptAnswer(enc, restored)).toBe("secret");
  });

  it("fails to decrypt with the wrong key", async () => {
    const enc = await encryptAnswer("secret", await generateAnswerKey());
    await expect(decryptAnswer(enc, await generateAnswerKey())).rejects.toThrow();
  });
});
