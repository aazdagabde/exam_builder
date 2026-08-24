import {
  calculateOverflow,
  inspectPageOverflows,
} from "@/features/exam-renderer/pagination/overflow-detector";

describe("renderer overflow detector", () => {
  it("ignores rounding noise but reports real horizontal and vertical overflow", () => {
    expect(
      calculateOverflow({
        clientWidth: 100,
        clientHeight: 200,
        scrollWidth: 101,
        scrollHeight: 201,
      }),
    ).toMatchObject({ horizontal: false, vertical: false });
    expect(
      calculateOverflow({
        clientWidth: 100,
        clientHeight: 200,
        scrollWidth: 104,
        scrollHeight: 206,
      }),
    ).toEqual({
      horizontal: true,
      vertical: true,
      overflowInline: 4,
      overflowBlock: 6,
    });
  });

  it("inspects only visible renderer pages and preserves their order", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <div class="exam-measurement"><div class="exam-page__content"></div></div>
      <div class="exam-pages">
        <div class="exam-page__content" data-page="one"></div>
        <div class="exam-page__content" data-page="two"></div>
      </div>
    `;
    const contents = root.querySelectorAll<HTMLElement>(
      ".exam-pages .exam-page__content",
    );
    Object.defineProperties(contents[0]!, {
      clientWidth: { value: 100 },
      clientHeight: { value: 200 },
      scrollWidth: { value: 100 },
      scrollHeight: { value: 200 },
    });
    Object.defineProperties(contents[1]!, {
      clientWidth: { value: 100 },
      clientHeight: { value: 200 },
      scrollWidth: { value: 100 },
      scrollHeight: { value: 210 },
    });
    expect(inspectPageOverflows(root)).toEqual([
      {
        pageNumber: 1,
        horizontal: false,
        vertical: false,
        overflowInline: 0,
        overflowBlock: 0,
      },
      {
        pageNumber: 2,
        horizontal: false,
        vertical: true,
        overflowInline: 0,
        overflowBlock: 10,
      },
    ]);
  });
});
