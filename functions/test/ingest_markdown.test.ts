import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { ingestMarkdownFile } from "../src/rag/ingestMarkdown";

describe("ingestMarkdownFile", () => {
  it("Markdownを分割・埋め込みして保存関数に渡す", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-md-"));
    const file = path.join(tmpDir, "sample.md");
    const md = [
      "# 店舗情報",
      "営業時間は9:00-18:00です。",
      "",
      "所在地は東京都渋谷区です。",
    ].join("\n");
    fs.writeFileSync(file, md, "utf8");

    const fakeEmbed = vi.fn(async (_text: string) => [1, 0, 0]);
    const saved: any[] = [];
    const fakeSave = vi.fn(async (chunks: any[]) => {
      saved.push(...chunks);
    });

    const n = await ingestMarkdownFile(file, {
      embedFn: fakeEmbed,
      saveChunks: fakeSave,
    });

    expect(n).toBeGreaterThan(0);
    expect(saved.length).toBe(n);
    expect(saved.map((c) => c.text).join("\n")).toContain("営業時間は9:00-18:00です。");
  });
});


