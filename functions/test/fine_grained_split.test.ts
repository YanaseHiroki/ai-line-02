import { describe, it, expect } from "vitest";
import { splitMarkdownByFineGrained } from "../src/rag/markdownSplitter";

describe("Fine-Grained Markdown Splitter", () => {
  it("should split by minimum heading level (###)", () => {
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
- **ストーリーズ：** 1日3-5回（日常感重視）`;

    const chunks = splitMarkdownByFineGrained(markdown);

    console.log("=== Fine-Grained Split Debug ===");
    console.log(`Total chunks: ${chunks.length}`);
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} (${chunk.length} chars):`);
      console.log(chunk.substring(0, 150) + "...");
      console.log("---");
    });

    // 期待される分割結果（レベル3見出しのみ）
    expect(chunks).toHaveLength(4); // 1.1、1.2、2.1、2.2
    
    // 1.1 バズの定義と仕組み
    expect(chunks[0]).toContain("第1章：バズるコンテンツの基本原理");
    expect(chunks[0]).toContain("1.1 バズの定義と仕組み");
    expect(chunks[0]).toContain("バズの3つの条件");
    expect(chunks[0]).not.toContain("1.2");
    
    // 1.2 アルゴリズムの最新動向
    expect(chunks[1]).toContain("第1章：バズるコンテンツの基本原理");
    expect(chunks[1]).toContain("1.2 アルゴリズムの最新動向");
    expect(chunks[1]).toContain("関係性");
    expect(chunks[1]).not.toContain("1.1");
    
    // 2.1 黄金タイムの見つけ方
    expect(chunks[2]).toContain("第2章：投稿タイミング最適化戦略");
    expect(chunks[2]).toContain("2.1 黄金タイムの見つけ方");
    expect(chunks[2]).toContain("7:00-9:00");
    
    // 2.2 投稿頻度の最適解
    expect(chunks[3]).toContain("第2章：投稿タイミング最適化戦略");
    expect(chunks[3]).toContain("2.2 投稿頻度の最適解");
    expect(chunks[3]).toContain("フィード投稿");
  });

  it("should include parent headings for context", () => {
    const markdown = `# メインタイトル
## セクション1
### サブセクション1.1
詳細内容1

### サブセクション1.2
詳細内容2

## セクション2
### サブセクション2.1
詳細内容3`;

    const chunks = splitMarkdownByFineGrained(markdown);

    expect(chunks).toHaveLength(3);
    
    // 各チャンクに親の見出しが含まれていることを確認
    expect(chunks[0]).toContain("メインタイトル");
    expect(chunks[0]).toContain("セクション1");
    expect(chunks[0]).toContain("サブセクション1.1");
    
    expect(chunks[1]).toContain("メインタイトル");
    expect(chunks[1]).toContain("セクション1");
    expect(chunks[1]).toContain("サブセクション1.2");
    
    expect(chunks[2]).toContain("メインタイトル");
    expect(chunks[2]).toContain("セクション2");
    expect(chunks[2]).toContain("サブセクション2.1");
  });

  it("should handle content without minimum headings", () => {
    const markdown = `# タイトル
## セクション1
これは詳細な内容です。

## セクション2
これも詳細な内容です。`;

    const chunks = splitMarkdownByFineGrained(markdown);

    expect(chunks).toHaveLength(2);
    
    // 最小レベルの見出しがない場合は、上位レベルの見出しで分割
    expect(chunks[0]).toContain("セクション1");
    expect(chunks[0]).toContain("詳細な内容");
    
    expect(chunks[1]).toContain("セクション2");
    expect(chunks[1]).toContain("詳細な内容");
  });

  it("should preserve formatting and structure", () => {
    const markdown = `# フォーマットテスト
## セクション
### サブセクション

- **項目1：** 重要なポイント
- **項目2：** もう一つのポイント

> これは重要な引用文です。

**太字**と*斜体*のテストです。

\`コード\`も正しく保持されます。`;

    const chunks = splitMarkdownByFineGrained(markdown);

    expect(chunks).toHaveLength(1);
    
    const chunk = chunks[0];
    
    // フォーマットが保持されていることを確認
    expect(chunk).toContain("**項目1：**");
    expect(chunk).toContain("> これは重要な引用文です。");
    expect(chunk).toContain("**太字**");
    expect(chunk).toContain("*斜体*");
    expect(chunk).toContain("`コード`");
  });

  it("should handle edge cases", () => {
    // 見出しのみの場合
    const markdown1 = `### 見出し1
### 見出し2
### 見出し3`;
    
    const chunks1 = splitMarkdownByFineGrained(markdown1);
    expect(chunks1).toHaveLength(3);
    
    // 空の内容の場合
    const markdown2 = `### 空のセクション

`;
    
    const chunks2 = splitMarkdownByFineGrained(markdown2);
    expect(chunks2).toHaveLength(1);
    expect(chunks2[0]).toContain("空のセクション");
    
    // 見出しレベルの混在
    const markdown3 = `# レベル1
## レベル2
### レベル3
内容

#### レベル4
内容`;
    
    const chunks3 = splitMarkdownByFineGrained(markdown3);
    expect(chunks3).toHaveLength(2); // レベル3とレベル4で分割
    expect(chunks3[0]).toContain("レベル3");
    expect(chunks3[1]).toContain("レベル4");
  });
});
