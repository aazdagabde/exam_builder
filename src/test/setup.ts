import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }

  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => undefined;
  }

  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => undefined;
  }
}

if (typeof URL !== "undefined") {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: () => "blob:test-preview",
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: () => undefined,
  });
}
