import type { ImageAssetRecord } from "@/domain/assets";
import type {
  DocxImageData,
  DocxImageNormalizer,
} from "@/features/export-docx/docx.types";

function readUint16(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1];
}

function readUint32(data: Uint8Array, offset: number): number {
  return (
    data[offset] * 0x1000000 +
    (data[offset + 1] << 16) +
    (data[offset + 2] << 8) +
    data[offset + 3]
  );
}

export function readPngDimensions(data: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    data.length < 24 ||
    signature.some((byte, index) => data[index] !== byte)
  ) {
    throw new Error("INVALID_PNG");
  }
  const widthPx = readUint32(data, 16);
  const heightPx = readUint32(data, 20);
  if (widthPx < 1 || heightPx < 1) throw new Error("INVALID_PNG_DIMENSIONS");
  return { widthPx, heightPx };
}

export function readJpegDimensions(data: Uint8Array) {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    throw new Error("INVALID_JPEG");
  }
  let offset = 2;
  while (offset + 9 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = data[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > data.length) break;
    const length = readUint16(data, offset);
    if (length < 2 || offset + length > data.length) break;
    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      const heightPx = readUint16(data, offset + 3);
      const widthPx = readUint16(data, offset + 5);
      if (widthPx < 1 || heightPx < 1) {
        throw new Error("INVALID_JPEG_DIMENSIONS");
      }
      return { widthPx, heightPx };
    }
    offset += length;
  }
  throw new Error("JPEG_DIMENSIONS_NOT_FOUND");
}

function loadBrowserImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("IMAGE_DECODE_FAILED"));
    };
    image.src = objectUrl;
  });
}

export async function rasterizeBlobToPng(blob: Blob): Promise<DocxImageData> {
  const image = await loadBrowserImage(blob);
  const widthPx = image.naturalWidth;
  const heightPx = image.naturalHeight;
  if (widthPx < 1 || heightPx < 1) throw new Error("IMAGE_HAS_NO_DIMENSIONS");

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("CANVAS_UNAVAILABLE");
  context.drawImage(image, 0, 0);
  const png = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("PNG_ENCODING_FAILED"));
    }, "image/png");
  });
  return {
    type: "png",
    data: new Uint8Array(await png.arrayBuffer()),
    widthPx,
    heightPx,
  };
}

export const browserDocxImageNormalizer: DocxImageNormalizer = {
  async normalize(asset: ImageAssetRecord): Promise<DocxImageData> {
    if (asset.mimeType === "image/webp") {
      return rasterizeBlobToPng(asset.blob);
    }
    const data = new Uint8Array(await asset.blob.arrayBuffer());
    const dimensions =
      asset.mimeType === "image/png"
        ? readPngDimensions(data)
        : readJpegDimensions(data);
    return {
      type: asset.mimeType === "image/png" ? "png" : "jpg",
      data,
      ...dimensions,
    };
  },
};
