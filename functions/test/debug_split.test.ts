import { describe, it, expect } from "vitest";
import { splitMarkdownByHierarchy } from "../src/rag/markdownSplitter";

describe("Debug Split Results", () => {
  it("should debug Instagram howto split", () => {
    const markdown = `# Instagram バズらせる完全ノウハウ集
## ～フォロワー激増＆エンゲージメント最大化の秘訣～

---

## 目次

1. [バズるコンテンツの基本原理](#第1章バズるコンテンツの基本原理)
2. [投稿タイミング最適化戦略](#第2章投稿タイミング最適化戦略)
3. [ハッシュタグ戦略の極意](#第3章ハッシュタグ戦略の極意)

---

## 第1章：バズるコンテンツの基本原理

### 1.1 バズの定義と仕組み

Instagramでバズるとは、**通常の何倍ものリーチとエンゲージメントを獲得**することです。

> **バズの3つの条件：**
> 1. 最初の1時間で高いエンゲージメント率
> 2. 滞在時間の長いコンテンツ
> 3. シェア・保存される価値のある内容

### 1.2 アルゴリズムの最新動向

2024年のInstagramアルゴリズムは以下を重要視しています：

- **関係性：** フォロワーとの相互作用の頻度
- **興味関心：** 過去の行動履歴との一致度

---

## 第2章：投稿タイミング最適化戦略

### 2.1 黄金タイムの見つけ方

**一般的なベストタイム：**
- 平日：7:00-9:00、12:00-13:00、19:00-22:00
- 土日：10:00-12:00、15:00-17:00、20:00-22:00`;

    const chunks = splitMarkdownByHierarchy(markdown);

    console.log("=== Instagram Howto Split Debug ===");
    console.log(`Total chunks: ${chunks.length}`);
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} (${chunk.length} chars):`);
      console.log(chunk.substring(0, 200) + "...");
      console.log("---");
    });

    expect(chunks.length).toBeGreaterThan(0);
  });

  it("should debug large chapter split", () => {
    const markdown = `## 第1章：大きな章

${"これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。".repeat(20)}

## 第2章：小さな章

短い内容です。`;

    const chunks = splitMarkdownByHierarchy(markdown, 500);

    console.log("=== Large Chapter Split Debug ===");
    console.log(`Total chunks: ${chunks.length}`);
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} (${chunk.length} chars):`);
      console.log(chunk.substring(0, 100) + "...");
      console.log("---");
    });

    expect(chunks.length).toBeGreaterThan(0);
  });

  it("should debug edge case split", () => {
    const markdown = `### レベル3見出し
内容

## レベル2見出し
内容

# レベル1見出し
内容`;

    const chunks = splitMarkdownByHierarchy(markdown);

    console.log("=== Edge Case Split Debug ===");
    console.log(`Total chunks: ${chunks.length}`);
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1}:`);
      console.log(chunk);
      console.log("---");
    });

    expect(chunks.length).toBeGreaterThan(0);
  });
});
