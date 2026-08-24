// @vitest-environment node

import { MAX_IMAGE_FILE_SIZE_BYTES, validateImageFile } from "@/domain/assets";

describe("image file validation", () => {
  it.each(["image/png", "image/jpeg", "image/webp"])("accepts %s", (type) => {
    expect(validateImageFile(new Blob(["image"], { type }))).toEqual({
      ok: true,
      mimeType: type,
    });
  });

  it("rejects unsupported MIME types", () => {
    expect(
      validateImageFile(new Blob(["svg"], { type: "image/svg+xml" })),
    ).toEqual({ ok: false, reason: "INVALID_IMAGE_TYPE" });
  });

  it("rejects files larger than 10 MB", () => {
    expect(
      validateImageFile({
        type: "image/png",
        size: MAX_IMAGE_FILE_SIZE_BYTES + 1,
      }),
    ).toEqual({ ok: false, reason: "IMAGE_TOO_LARGE" });
  });
});
