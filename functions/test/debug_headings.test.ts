import { describe, it, expect } from "vitest";
import { splitMarkdownByFineGrained } from "../src/rag/markdownSplitter";

describe("Debug Headings", () => {
  it("should debug heading detection", () => {
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

    const lines = markdown.split('\n');
    const headings: { level: number; text: string; lineNumber: number }[] = [];
  
    // 見出しを検出
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        headings.push({
          level: headingMatch[1].length,
          text: headingMatch[2].trim(),
          lineNumber: i
        });
      }
    }

    console.log("=== Heading Detection Debug ===");
    console.log(`Total headings: ${headings.length}`);
    headings.forEach((heading, index) => {
      console.log(`Heading ${index + 1}: Level ${heading.level} - "${heading.text}" (line ${heading.lineNumber})`);
    });

    // 最小レベルの見出しを特定
    const minLevel = Math.min(...headings.map(h => h.level));
    const minLevelHeadings = headings.filter(h => h.level === minLevel);
    
    console.log(`\nMin level: ${minLevel}`);
    console.log(`Min level headings: ${minLevelHeadings.length}`);
    minLevelHeadings.forEach((heading, index) => {
      console.log(`Min heading ${index + 1}: Level ${heading.level} - "${heading.text}"`);
    });

    expect(headings.length).toBeGreaterThan(0);
  });
});

