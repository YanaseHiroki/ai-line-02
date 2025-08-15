import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { splitMarkdownByHierarchy } from "../src/rag/markdownSplitter";

describe("Real Instagram Howto Splitter", () => {
  it("should split real Instagram howto markdown correctly", () => {
    // 実際のInstagramノウハウ資料の一部を使用
    const markdown = fs.readFileSync("c:\\Users\\mamor\\Documents\\insta-howto.md", "utf8");
    
    const chunks = splitMarkdownByHierarchy(markdown);

    console.log("=== Real Instagram Howto Split ===");
    console.log(`Total chunks: ${chunks.length}`);
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} (${chunk.length} chars):`);
      // 最初の見出しを抽出
      const firstHeading = chunk.match(/^#{1,6}\s+(.+)$/m);
      if (firstHeading) {
        console.log(`  First heading: ${firstHeading[1]}`);
      }
      console.log(`  Content preview: ${chunk.substring(0, 100)}...`);
      console.log("---");
    });

    // 基本的な検証
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.length).toBeLessThan(50); // 適切な数のチャンク
    
    // 各チャンクが適切なサイズであることを確認
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(50); // 最小サイズ
      expect(chunk.length).toBeLessThan(3000); // 最大サイズ
    }
    
    // 重要な内容が含まれていることを確認
    const allContent = chunks.join("\n");
    expect(allContent).toContain("Instagram");
    expect(allContent).toContain("バズる");
    expect(allContent).toContain("ハッシュタグ");
    expect(allContent).toContain("エンゲージメント");
  });

  it("should maintain semantic coherence in chunks", () => {
    const markdown = fs.readFileSync("c:\\Users\\mamor\\Documents\\insta-howto.md", "utf8");
    
    const chunks = splitMarkdownByHierarchy(markdown);

    // 各チャンクが意味的に一貫していることを確認
    for (const chunk of chunks) {
      // チャンクに見出しが含まれていることを確認
      const headings = chunk.match(/^#{1,6}\s+(.+)$/gm);
      expect(headings).toBeTruthy();
      expect(headings!.length).toBeGreaterThan(0);
      
      // チャンクが空でないことを確認
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  it("should handle special characters and formatting", () => {
    const markdown = fs.readFileSync("c:\\Users\\mamor\\Documents\\insta-howto.md", "utf8");
    
    const chunks = splitMarkdownByHierarchy(markdown);

    // 特殊文字やフォーマットが保持されていることを確認
    for (const chunk of chunks) {
      // マークダウンのフォーマットが保持されている
      expect(chunk).toMatch(/[#*`>]/); // 見出し、強調、コード、引用の記号
      
      // 日本語文字が正しく処理されている
      expect(chunk).toMatch(/[あ-ん]/);
    }
  });
});

