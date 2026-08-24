/** Creates a UUID v4 using Web Crypto, including browsers without randomUUID. */
export type IdCryptoProvider = Partial<
  Pick<Crypto, "randomUUID" | "getRandomValues">
>;

export function createId(
  cryptoProvider: IdCryptoProvider = globalThis.crypto,
): string {
  if (typeof cryptoProvider?.randomUUID === "function") {
    try {
      return cryptoProvider.randomUUID();
    } catch {
      // Some non-secure browser contexts expose the method but reject calls.
    }
  }

  if (typeof cryptoProvider?.getRandomValues !== "function") {
    throw new Error("WEB_CRYPTO_UNAVAILABLE");
  }

  const bytes = cryptoProvider.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10).join(""),
  ].join("-");
}
