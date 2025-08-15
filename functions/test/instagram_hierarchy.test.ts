import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { splitMarkdownByHierarchy } from "../src/rag/markdownSplitter";

describe("Instagram Markdown Hierarchy Splitter", () => {
  it("should split Instagram howto markdown by chapter structure", () => {
    // 実際のInstagramノウハウ資料の構造を模擬
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
- 土日：10:00-12:00、15:00-17:00、20:00-22:00

### 2.2 投稿頻度の最適解

- **フィード投稿：** 1日1-2回（品質重視）
- **ストーリーズ：** 1日3-5回（日常感重視）

---

## 第3章：ハッシュタグ戦略の極意

### 3.1 効果的なハッシュタグの選び方

ハッシュタグは**大・中・小の投稿数のものをバランスよく組み合わせる**ことが重要です。

- **ビッグハッシュタグ（100万+）：** 2-3個
- **ミドルハッシュタグ（10万-100万）：** 10-15個
- **スモールハッシュタグ（1万-10万）：** 10-15個`;

    const chunks = splitMarkdownByHierarchy(markdown);

    // サブタイトル、目次、3つの章で分割されることを期待
    expect(chunks).toHaveLength(5);
    
    // サブタイトルチャンク
    expect(chunks[0]).toContain("～フォロワー激増＆エンゲージメント最大化の秘訣～");
    
    // 目次チャンク
    expect(chunks[1]).toContain("目次");
    expect(chunks[1]).toContain("バズるコンテンツの基本原理");
    
    // 第1章チャンク
    expect(chunks[2]).toContain("第1章：バズるコンテンツの基本原理");
    expect(chunks[2]).toContain("バズの定義と仕組み");
    expect(chunks[2]).toContain("アルゴリズムの最新動向");
    expect(chunks[2]).toContain("バズの3つの条件");
    expect(chunks[2]).not.toContain("第2章");
    
    // 第2章チャンク
    expect(chunks[3]).toContain("第2章：投稿タイミング最適化戦略");
    expect(chunks[3]).toContain("黄金タイムの見つけ方");
    expect(chunks[3]).toContain("投稿頻度の最適解");
    expect(chunks[3]).toContain("7:00-9:00");
    expect(chunks[3]).not.toContain("第1章");
    expect(chunks[3]).not.toContain("第3章");
    
    // 第3章チャンク
    expect(chunks[4]).toContain("第3章：ハッシュタグ戦略の極意");
    expect(chunks[4]).toContain("効果的なハッシュタグの選び方");
    expect(chunks[4]).toContain("ビッグハッシュタグ");
    expect(chunks[4]).not.toContain("第2章");
  });

  it("should handle large chapters with maxChunkSize", () => {
    const markdown = `## 第1章：大きな章

${"これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。これは非常に長い内容です。".repeat(20)}

## 第2章：小さな章

短い内容です。`;

    const chunks = splitMarkdownByHierarchy(markdown, 500);

    expect(chunks.length).toBeGreaterThan(2); // 第1章が複数のチャンクに分割される
    
    // 各チャンクが指定されたサイズ以下であることを確認
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(500);
    }
    
    // 第1章の内容が複数のチャンクに分散されていることを確認
    const firstChapterChunks = chunks.filter(chunk => 
      chunk.includes("第1章：大きな章") || 
      chunk.includes("非常に長い内容です")
    );
    expect(firstChapterChunks.length).toBeGreaterThan(1);
  });

  it("should preserve formatting and structure", () => {
    const markdown = `## フォーマットテスト

### リストセクション

- **項目1：** 重要なポイント
- **項目2：** もう一つのポイント
  - ネストした項目
- **項目3：** 最後のポイント

### 引用セクション

> これは重要な引用文です。
> 複数行にわたる引用も保持されます。

### 強調セクション

**太字**と*斜体*のテストです。

\`コード\`も正しく保持されます。`;

    const chunks = splitMarkdownByHierarchy(markdown);

    expect(chunks).toHaveLength(1); // 1つのレベル2見出し
    
    const chunk = chunks[0];
    
    // フォーマットが保持されていることを確認
    expect(chunk).toContain("**項目1：**");
    expect(chunk).toContain("  - ネストした項目");
    expect(chunk).toContain("> これは重要な引用文です。");
    expect(chunk).toContain("**太字**");
    expect(chunk).toContain("*斜体*");
    expect(chunk).toContain("`コード`");
  });

  it("should handle edge cases", () => {
    // レベル2見出しのみの場合
    const markdown1 = `## 見出し1
## 見出し2
## 見出し3`;
    
    const chunks1 = splitMarkdownByHierarchy(markdown1);
    expect(chunks1).toHaveLength(3);
    
    // 空の内容の場合
    const markdown2 = `## 空の章

`;
    
    const chunks2 = splitMarkdownByHierarchy(markdown2);
    expect(chunks2).toHaveLength(1);
    expect(chunks2[0]).toContain("空の章");
    
    // 見出しレベルの混在（レベル2見出しがない場合）
    const markdown3 = `### レベル3見出し
内容

# レベル1見出し
内容`;
    
    const chunks3 = splitMarkdownByHierarchy(markdown3);
    expect(chunks3).toHaveLength(1); // レベル2見出しがないので1チャンク
    expect(chunks3[0]).toContain("レベル3見出し");
    expect(chunks3[0]).toContain("レベル1見出し");
    
    // レベル2見出しがある場合
    const markdown4 = `### レベル3見出し
内容

## レベル2見出し
内容

# レベル1見出し
内容`;
    
    const chunks4 = splitMarkdownByHierarchy(markdown4);
    expect(chunks4).toHaveLength(1); // レベル2見出しが最後にあるので1チャンク
    expect(chunks4[0]).toContain("レベル2見出し");
    expect(chunks4[0]).toContain("レベル1見出し");
  });
});
