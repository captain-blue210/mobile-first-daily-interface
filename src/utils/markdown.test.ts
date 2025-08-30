import { buildHeadingLine, parseHeadingSpec } from "./markdown";

describe("parseHeadingSpec", () => {
  test("parses level and title", () => {
    expect(parseHeadingSpec("# A")).toEqual({ level: 1, title: "A" });
    expect(parseHeadingSpec("##  Title ")).toEqual({ level: 2, title: "Title" });
    expect(parseHeadingSpec("###### deep title")).toEqual({ level: 6, title: "deep title" });
  });

  test("rejects invalid", () => {
    expect(parseHeadingSpec("")).toBeNull();
    expect(parseHeadingSpec("A")).toBeNull();
    expect(parseHeadingSpec("####### too deep")).toBeNull();
    expect(parseHeadingSpec("#")).toBeNull();
  });
});

describe("buildHeadingLine", () => {
  test("builds heading line", () => {
    expect(buildHeadingLine(1, "A")).toBe("# A");
    expect(buildHeadingLine(3, "B")).toBe("### B");
  });
});

