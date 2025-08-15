import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { ingestMarkdownFile } from "../src/rag/ingestMarkdown";

describe("ingestMarkdownFile", () => {
  it("Markdownを細かい粒度で分割・埋め込みして保存関数に渡す", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-md-"));
    const file = path.join(tmpDir, "sample.md");
    const md = [
      "# メインタイトル",
      "## セクション1",
      "### サブセクション1.1",
      "詳細内容1",
      "",
      "### サブセクション1.2",
      "詳細内容2",
      "",
      "## セクション2",
      "### サブセクション2.1",
      "詳細内容3",
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

    expect(n).toBe(3); // 3つのレベル3見出し
    expect(saved.length).toBe(n);
    
    // 各チャンクに親の見出し情報が含まれていることを確認
    expect(saved[0].text).toContain("メインタイトル");
    expect(saved[0].text).toContain("セクション1");
    expect(saved[0].text).toContain("サブセクション1.1");
    expect(saved[0].text).toContain("詳細内容1");
    
    expect(saved[1].text).toContain("メインタイトル");
    expect(saved[1].text).toContain("セクション1");
    expect(saved[1].text).toContain("サブセクション1.2");
    expect(saved[1].text).toContain("詳細内容2");
    
    expect(saved[2].text).toContain("メインタイトル");
    expect(saved[2].text).toContain("セクション2");
    expect(saved[2].text).toContain("サブセクション2.1");
    expect(saved[2].text).toContain("詳細内容3");
  });

  it("レベル3見出しがない場合はレベル2見出しで分割する", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-md-"));
    const file = path.join(tmpDir, "sample.md");
    const md = [
      "# メインタイトル",
      "## セクション1",
      "詳細内容1",
      "",
      "## セクション2",
      "詳細内容2",
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

    expect(n).toBe(2); // 2つのレベル2見出し
    expect(saved.length).toBe(n);
    
    expect(saved[0].text).toContain("セクション1");
    expect(saved[0].text).toContain("詳細内容1");
    
    expect(saved[1].text).toContain("セクション2");
    expect(saved[1].text).toContain("詳細内容2");
  });

  it("見出しがない場合は全体を1つのチャンクとして扱う", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-md-"));
    const file = path.join(tmpDir, "sample.md");
    const md = [
      "これは見出しのない内容です。",
      "",
      "段落が続きます。",
      "",
      "もう一つの段落です。",
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

    expect(n).toBe(1); // 見出しがないので1チャンク
    expect(saved.length).toBe(n);
    expect(saved[0].text).toContain("これは見出しのない内容です。");
    expect(saved[0].text).toContain("段落が続きます。");
    expect(saved[0].text).toContain("もう一つの段落です。");
  });

  it("maxChunkSizeオプションが正しく適用される", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ingest-md-"));
    const file = path.join(tmpDir, "sample.md");
    const md = [
      "# 大きなセクション",
      "### サブセクション",
      "これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。",
      "これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。",
      "これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。",
      "これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。",
      "これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。",
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
      maxChunkSize: 300, // 小さなサイズを指定
    });

    expect(n).toBe(1); // 見出しレベルでの分割が優先されるため1チャンク
    expect(saved.length).toBe(n);
    
    // チャンクが存在することを確認
    expect(saved[0].text).toContain("大きなセクション");
    expect(saved[0].text).toContain("サブセクション");
    expect(saved[0].text).toContain("非常に長い内容です");
  });
});


