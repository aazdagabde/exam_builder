function toBytes(value: Blob | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  if (value instanceof Blob) {
    return value.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }

  if (value instanceof Uint8Array) {
    return Promise.resolve(value);
  }

  return Promise.resolve(new Uint8Array(value));
}

export function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

export function base64ToBytes(dataBase64: string): Uint8Array {
  let binary: string;
  try {
    binary = atob(dataBase64);
  } catch {
    throw new TypeError("INVALID_BASE64");
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  // Reject non-canonical encodings accepted leniently by some atob runtimes.
  if (bytesToBase64(bytes) !== dataBase64) {
    throw new TypeError("INVALID_BASE64");
  }

  return bytes;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

export function base64ToBlob(dataBase64: string, mimeType: string): Blob {
  const decoded = base64ToBytes(dataBase64);
  const bytes = new Uint8Array(decoded.byteLength);
  bytes.set(decoded);
  return new Blob([bytes], { type: mimeType });
}

export async function sha256(
  value: Blob | ArrayBuffer | Uint8Array,
): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest !== "function") {
    throw new ProjectBackupError("SECURE_CONTEXT_REQUIRED");
  }
  const source = await toBytes(value);
  const bytes = new Uint8Array(source.byteLength);
  bytes.set(source);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
import { ProjectBackupError } from "@/features/project-backup/project-backup.errors";
