import { describe, it, expect } from "vitest";
import { splitMarkdownByHierarchy } from "../src/rag/markdownSplitter";

describe("Markdown Hierarchy Splitter", () => {
  it("should split by heading hierarchy", () => {
    const markdown = `# 第1章：バズるコンテンツの基本原理

## 1.1 バズの定義と仕組み

Instagramでバズるとは、**通常の何倍ものリーチとエンゲージメントを獲得**することです。

> **バズの3つの条件：**
> 1. 最初の1時間で高いエンゲージメント率
> 2. 滞在時間の長いコンテンツ
> 3. シェア・保存される価値のある内容

## 1.2 アルゴリズムの最新動向

2024年のInstagramアルゴリズムは以下を重要視しています：

- **関係性：** フォロワーとの相互作用の頻度
- **興味関心：** 過去の行動履歴との一致度

# 第2章：投稿タイミング最適化戦略

## 2.1 黄金タイムの見つけ方

**一般的なベストタイム：**
- 平日：7:00-9:00、12:00-13:00、19:00-22:00
- 土日：10:00-12:00、15:00-17:00、20:00-22:00`;

    const chunks = splitMarkdownByHierarchy(markdown);

    expect(chunks).toHaveLength(2); // 2つのトップレベル見出し
    
    // 第1章全体が1つのチャンク
    expect(chunks[0]).toContain("第1章：バズるコンテンツの基本原理");
    expect(chunks[0]).toContain("バズの定義と仕組み");
    expect(chunks[0]).toContain("アルゴリズムの最新動向");
    expect(chunks[0]).toContain("バズの3つの条件");
    
    // 第2章全体が1つのチャンク
    expect(chunks[1]).toContain("第2章：投稿タイミング最適化戦略");
    expect(chunks[1]).toContain("黄金タイムの見つけ方");
    expect(chunks[1]).toContain("7:00-9:00");
  });

  it("should handle nested headings properly", () => {
    const markdown = `# メインタイトル

## セクション1
内容1

### サブセクション1.1
詳細内容1

### サブセクション1.2
詳細内容2

## セクション2
内容2`;

    const chunks = splitMarkdownByHierarchy(markdown);

    expect(chunks).toHaveLength(1); // 1つのトップレベル見出し
    
    // メインタイトルとそのサブセクションが一緒
    expect(chunks[0]).toContain("メインタイトル");
    expect(chunks[0]).toContain("セクション1");
    expect(chunks[0]).toContain("サブセクション1.1");
    expect(chunks[0]).toContain("サブセクション1.2");
    expect(chunks[0]).toContain("セクション2");
  });

  it("should handle content without headings", () => {
    const markdown = `これは見出しのない内容です。

段落が続きます。

もう一つの段落です。`;

    const chunks = splitMarkdownByHierarchy(markdown);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("これは見出しのない内容です");
  });

  it("should preserve formatting and lists", () => {
    const markdown = `# フォーマットテスト

## リストセクション

- 項目1
- 項目2
  - ネストした項目
- 項目3

## 強調セクション

**太字**と*斜体*のテストです。

> 引用文も保持されます。`;

    const chunks = splitMarkdownByHierarchy(markdown);

    expect(chunks).toHaveLength(1); // 1つのトップレベル見出し
    
    // フォーマットテストとそのサブセクションが一緒
    expect(chunks[0]).toContain("フォーマットテスト");
    expect(chunks[0]).toContain("リストセクション");
    expect(chunks[0]).toContain("- 項目1");
    expect(chunks[0]).toContain("  - ネストした項目");
    expect(chunks[0]).toContain("強調セクション");
    expect(chunks[0]).toContain("**太字**");
    expect(chunks[0]).toContain("*斜体*");
    expect(chunks[0]).toContain("> 引用文も保持されます");
  });

  it("should handle large sections appropriately", () => {
    const markdown = `# 大きなセクション

${"これは非常に長い内容です。".repeat(100)}

## 次のセクション

短い内容`;

    const chunks = splitMarkdownByHierarchy(markdown);

    expect(chunks).toHaveLength(1); // 1つのトップレベル見出し
    
    // 大きなセクションが適切に分割されている
    expect(chunks[0]).toContain("大きなセクション");
    expect(chunks[0].length).toBeLessThan(2000); // 適切なサイズ
    expect(chunks[0]).toContain("次のセクション");
  });

  it("should handle multiple top-level headings", () => {
    const markdown = `# 第1章
内容1

# 第2章
内容2

# 第3章
内容3`;

    const chunks = splitMarkdownByHierarchy(markdown);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toContain("第1章");
    expect(chunks[1]).toContain("第2章");
    expect(chunks[2]).toContain("第3章");
  });
});
