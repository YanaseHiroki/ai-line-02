import { describe, it, expect, vi } from "vitest";
import { buildRagAnswerer } from "../src/rag/ragAnswerer";

describe("Optimization Tests", () => {
  it("should be faster with optimized parameters", async () => {
    const chunks = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      text: `コンテンツ${i}`,
      embedding: [i % 2, (i + 1) % 2]
    }));
    
    const embed = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return [1, 0];
    });
    
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async () => "回答です。");

    // 最適化前のパラメータ
    const slowAnswerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 6, // 多い
    });

    // 最適化後のパラメータ
    const fastAnswerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 4, // 少ない
    });

    const slowStart = Date.now();
    await slowAnswerer("テスト質問");
    const slowTime = Date.now() - slowStart;

    const fastStart = Date.now();
    await fastAnswerer("テスト質問");
    const fastTime = Date.now() - fastStart;

    // 最適化後は高速であることを確認
    expect(fastTime).toBeLessThan(slowTime);
  });

  it("should maintain quality while improving speed", async () => {
    const chunks = [
      { id: "1", text: "重要な情報1", embedding: [1, 0] },
      { id: "2", text: "重要な情報2", embedding: [0, 1] },
      { id: "3", text: "関連性の低い情報", embedding: [0, 0] },
    ];
    
    const embed = vi.fn(async (text: string) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return text.includes("重要") ? [1, 0] : [0, 1];
    });
    
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      // プロンプトに重要な情報が含まれていることを確認
      expect(prompt).toContain("重要な情報");
      return "重要な情報を含む回答です。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 2, // 最適化された値
    });

    const result = await answerer("重要な情報について教えて");
    expect(result).toContain("重要な情報");
  });
});

