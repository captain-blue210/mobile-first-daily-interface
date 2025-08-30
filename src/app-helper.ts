import { App, Editor, MarkdownView, moment, TFile } from "obsidian";
import { pickTaskName } from "./utils/strings";
import { buildHeadingLine, parseHeadingSpec } from "./utils/markdown";

export interface CodeBlock {
  lang: string;
  meta: string;
  code: string;
  offset: number;
}

export interface Header {
  title: string;
  body: string;
  titleOffset: number;
}

export interface Task {
  mark: " " | string;
  name: string;
  offset: number;
}

interface UnsafeAppInterface {
  commands: {
    commands: { [commandId: string]: any };
    executeCommandById(commandId: string): boolean;
  };
}

export class AppHelper {
  private unsafeApp: App & UnsafeAppInterface;

  constructor(app: App) {
    this.unsafeApp = app as any;
  }

  async loadFile(path: string): Promise<string> {
    return this.unsafeApp.vault.adapter.read(path);
  }

  async setCheckMark(
    path: string,
    mark: "x" | " " | string,
    offset: number
  ): Promise<void> {
    const origin = await this.loadFile(path);
    const markOffset = offset + origin.slice(offset).indexOf("[") + 1;
    await this.unsafeApp.vault.adapter.write(
      path,
      `${origin.slice(0, markOffset)}${mark}${origin.slice(markOffset + 1)}`
    );
  }

  getActiveFile(): TFile | null {
    // noinspection TailRecursionJS
    return this.unsafeApp.workspace.getActiveFile();
  }

  getActiveMarkdownView(): MarkdownView | null {
    return this.unsafeApp.workspace.getActiveViewOfType(MarkdownView);
  }

  getActiveMarkdownEditor(): Editor | null {
    return this.getActiveMarkdownView()?.editor ?? null;
  }

  insertTextToEnd(file: TFile, text: string) {
    return this.unsafeApp.vault.adapter.append(file.path, text);
  }

  async insertTextUnderSection(file: TFile, spec: string, text: string) {
    const parsed = parseHeadingSpec(spec);
    if (!parsed) {
      return this.insertTextToEnd(file, text);
    }

    const content = await this.loadFile(file.path);
    const cache = this.unsafeApp.metadataCache.getFileCache(file);
    const headings = cache?.headings ?? [];

    const index = headings.findIndex(
      (h: any) => h.level === parsed.level && h.heading === parsed.title
    );

    // Helper to write entire file
    const write = async (newContent: string) =>
      this.unsafeApp.vault.adapter.write(file.path, newContent);

    if (index >= 0) {
      // Find end of the section (start of the next heading of same or higher level)
      const nextIndex = headings.findIndex(
        (h: any, i: number) => i > index && h.level <= headings[index].level
      );
      const insertPos =
        nextIndex >= 0
          ? headings[nextIndex].position.start.offset
          : content.length;

      const before = content.slice(0, insertPos);
      const after = content.slice(insertPos);
      const needsOne = before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
      return write(`${before}${needsOne}${text}${after}`);
    } else {
      const headingLine = buildHeadingLine(parsed.level, parsed.title);
      const prefix = content.endsWith("\n\n") ? "" : content.endsWith("\n") ? "\n" : "\n\n";
      return write(`${content}${prefix}${headingLine}\n\n${text}`);
    }
  }

  async getCodeBlocks(file: TFile): Promise<CodeBlock[] | null> {
    const content = await this.loadFile(file.path);

    return (
      this.unsafeApp.metadataCache
        .getFileCache(file)
        ?.sections?.filter((x) => x.type === "code")
        .map((x) => {
          const str = content.slice(
            x.position.start.offset,
            x.position.end.offset
          );
          const lines = str.split("\n");

          const lang = lines[0].split(" ")[0].replace("````", "");
          const meta = lines[0].split(" ")[1];
          const offset = x.position.start.offset;

          return {
            lang,
            meta,
            code: lines.slice(1, -1).join("\n"),
            offset,
          };
        }) ?? null
    );
  }

  async getHeaders(file: TFile, level: number): Promise<Header[] | null> {
    const content = await this.loadFile(file.path);

    const headings = this.unsafeApp.metadataCache
      .getFileCache(file)
      ?.headings?.filter((x) => x.level === level);
    if (!headings) {
      return null;
    }

    return (
      headings.map((x, i) => {
        return {
          title: x.heading,
          body: content.slice(
            x.position.end.offset + 1,
            i < headings.length - 1
              ? headings[i + 1].position.start.offset - 1
              : undefined
          ),
          titleOffset: x.position.start.offset,
        };
      }) ?? null
    );
  }

  async getTasks(file: TFile): Promise<Task[] | null> {
    const content = await this.loadFile(file.path);
    const lines = content.split("\n");

    return (
      this.unsafeApp.metadataCache
        .getFileCache(file)
        ?.listItems?.filter((x) => x.task != null)
        .map((x) => {
          const text = lines.at(x.position.start.line)!;
          const name = pickTaskName(text);
          return {
            mark: x.task!,
            name,
            offset: x.position.start.offset,
          };
        }) ?? null
    );
  }
}
