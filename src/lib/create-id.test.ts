// @vitest-environment node

import { createId, type IdCryptoProvider } from "@/lib/create-id";

describe("createId", () => {
  it("uses randomUUID when available", () => {
    const cryptoProvider: IdCryptoProvider = {
      randomUUID: () => "123e4567-e89b-42d3-a456-426614174000",
    };
    expect(createId(cryptoProvider)).toBe(
      "123e4567-e89b-42d3-a456-426614174000",
    );
  });

  it("falls back to getRandomValues and creates a UUID v4", () => {
    const cryptoProvider: IdCryptoProvider = {
      getRandomValues: <T extends ArrayBufferView | null>(array: T) => {
        const bytes = array as Uint8Array;
        bytes.forEach((_, index) => (bytes[index] = index));
        return array;
      },
    };

    const id = createId(cryptoProvider);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("never falls back to an insecure random source", () => {
    expect(() => createId({})).toThrow("WEB_CRYPTO_UNAVAILABLE");
  });
});
