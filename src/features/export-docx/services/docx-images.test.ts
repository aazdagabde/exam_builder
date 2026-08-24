import {
  browserDocxImageNormalizer,
  readJpegDimensions,
  readPngDimensions,
} from "@/features/export-docx/services/docx-images";

const PNG_1X1 = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
);

describe("DOCX image normalization", () => {
  it("reads PNG dimensions and preserves PNG bytes", async () => {
    expect(readPngDimensions(PNG_1X1)).toEqual({ widthPx: 1, heightPx: 1 });
    const image = await browserDocxImageNormalizer.normalize({
      id: "png",
      kind: "image",
      blob: new Blob([PNG_1X1], { type: "image/png" }),
      mimeType: "image/png",
      size: PNG_1X1.byteLength,
      createdAt: "2026-08-23T00:00:00.000Z",
    });

    expect(image.type).toBe("png");
    expect(image.widthPx).toBe(1);
    expect(image.heightPx).toBe(1);
  });

  it("reads dimensions from a minimal JPEG SOF segment", () => {
    const jpeg = Uint8Array.from([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x02, 0x58, 0x03,
      0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00, 0xff, 0xd9,
    ]);
    expect(readJpegDimensions(jpeg)).toEqual({ widthPx: 600, heightPx: 300 });
  });

  it("rejects invalid raster bytes", () => {
    expect(() => readPngDimensions(Uint8Array.of(1, 2, 3))).toThrow();
    expect(() => readJpegDimensions(Uint8Array.of(1, 2, 3))).toThrow();
  });
});
