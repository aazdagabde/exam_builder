// @vitest-environment node

import { moveArrayItem } from "@/features/exam-builder/blocks/editor-list.helpers";

describe("moveArrayItem", () => {
  it("moves one item without mutating the source", () => {
    const source = ["A", "B", "C"];
    expect(moveArrayItem(source, 2, -1)).toEqual(["A", "C", "B"]);
    expect(source).toEqual(["A", "B", "C"]);
  });

  it("returns the same array at a boundary", () => {
    const source = ["A", "B"];
    expect(moveArrayItem(source, 0, -1)).toBe(source);
  });
});
