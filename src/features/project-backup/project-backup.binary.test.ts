import {
  base64ToBlob,
  base64ToBytes,
  blobToBase64,
  bytesToBase64,
  sha256,
} from "@/features/project-backup/project-backup.binary";

describe("project backup binary helpers", () => {
  it("round-trips arbitrary binary bytes including 00 and FF", async () => {
    const bytes = new Uint8Array([0x00, 0xff, 0x10, 0x80, 0x7f]);
    const encoded = bytesToBase64(bytes);

    expect([...base64ToBytes(encoded)]).toEqual([...bytes]);
    expect([
      ...new Uint8Array(await base64ToBlob(encoded, "image/png").arrayBuffer()),
    ]).toEqual([...bytes]);
    await expect(blobToBase64(new Blob([bytes]))).resolves.toBe(encoded);
  });

  it("matches the published SHA-256 vector for abc", async () => {
    await expect(sha256(new TextEncoder().encode("abc"))).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("reports a secure-context requirement without SubtleCrypto", async () => {
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal("crypto", {
      getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto),
    });
    await expect(sha256(new Uint8Array([1]))).rejects.toMatchObject({
      code: "SECURE_CONTEXT_REQUIRED",
    });
    vi.unstubAllGlobals();
  });

  it("round-trips a reasonably large binary payload", async () => {
    const bytes = new Uint8Array(2 * 1024 * 1024);
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = index % 251;
    }

    const restored = base64ToBytes(bytesToBase64(bytes));
    expect(restored.byteLength).toBe(bytes.byteLength);
    expect(restored[0]).toBe(0);
    expect(restored[1_048_575]).toBe(bytes[1_048_575]);
    expect(restored.at(-1)).toBe(bytes.at(-1));
  });

  it("rejects malformed or non-canonical base64", () => {
    expect(() => base64ToBytes("@@@=")).toThrow("INVALID_BASE64");
    expect(() => base64ToBytes("YQ")).toThrow("INVALID_BASE64");
  });
});
