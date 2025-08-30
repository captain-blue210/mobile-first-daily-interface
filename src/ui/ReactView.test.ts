import { describe, expect, test } from "@jest/globals";
import { toText } from "./ReactView";
import { PostFormat } from "../settings";
import { moment } from "obsidian";

describe("toText", () => {
  test("uses provided timestamp format for list", () => {
    const fmt = "YYYY";
    const pf: PostFormat = { type: "list" } as any;
    const output = toText("hoge", false, pf, fmt);
    const year = moment().format(fmt);
    expect(output).toBe(`\n- ${year} hoge\n`);
  });
});

