import { describe, expect, test } from "@jest/globals";
import { AppHelper } from "./app-helper";
import { PostFormat } from "./settings";

const listFormat: PostFormat = { type: "list" } as any;

function createApp(content: string, headings: any[]) {
  const write = jest.fn();
  const app = {
    vault: {
      adapter: {
        read: jest.fn().mockResolvedValue(content),
        write,
        append: jest.fn(),
      },
    },
    metadataCache: {
      getFileCache: () => ({ headings }),
    },
    workspace: {},
    commands: { commands: {}, executeCommandById: () => false },
  } as any;
  return { app, write };
}

describe("insertTextUnderSection list", () => {
  test("replaces empty dash", async () => {
    const heading = "## H";
    const content = `${heading}\n- \n`;
    const { app, write } = createApp(content, [
      {
        level: 2,
        heading: "H",
        position: { start: { offset: 0 }, end: { offset: heading.length } },
      },
    ]);
    const helper = new AppHelper(app);
    const file = { path: "test.md" } as any;
    await helper.insertTextUnderSection(
      file,
      "## H",
      "\n- 2024 msg\n",
      listFormat,
      ""
    );
    expect(write).toHaveBeenCalledWith("test.md", `${heading}\n- 2024 msg\n`);
  });

  test("inserts before delimiter", async () => {
    const heading = "## H";
    const content = `${heading}\n- a\n---\n`;
    const { app, write } = createApp(content, [
      {
        level: 2,
        heading: "H",
        position: { start: { offset: 0 }, end: { offset: heading.length } },
      },
    ]);
    const helper = new AppHelper(app);
    const file = { path: "test.md" } as any;
    await helper.insertTextUnderSection(
      file,
      "## H",
      "\n- b\n",
      listFormat,
      "---"
    );
    expect(write).toHaveBeenCalledWith(
      "test.md",
      `${heading}\n- a\n- b\n---\n`
    );
  });
});

