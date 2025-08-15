import { describe, it, expect, vi } from "vitest";
import { buildRagAnswerer } from "../src/rag/ragAnswerer";

describe("Performance Tests", () => {
  it("should log performance metrics for each step", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    
    const chunks = [
      { id: "1", text: "テストコンテンツ1", embedding: [1, 0] },
      { id: "2", text: "テストコンテンツ2", embedding: [0, 1] },
    ];
    
    const embed = vi.fn(async (text: string) => {
      // 埋め込み処理の遅延をシミュレート
      await new Promise(resolve => setTimeout(resolve, 100));
      return text.includes("テスト") ? [1, 0] : [0, 1];
    });
    
    const loadAll = vi.fn(async () => {
      // Firestore読み込みの遅延をシミュレート
      await new Promise(resolve => setTimeout(resolve, 200));
      return chunks;
    });
    
    const generate = vi.fn(async (prompt: string) => {
      // LLM生成の遅延をシミュレート
      await new Promise(resolve => setTimeout(resolve, 300));
      return "テスト回答です。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 2,
    });

    const startTime = Date.now();
    const result = await answerer("テスト質問");
    const totalTime = Date.now() - startTime;

    expect(result).toContain("テスト回答");
    expect(totalTime).toBeGreaterThan(500); // 最低600ms以上かかるはず
    
    // パフォーマンスログが出力されていることを確認
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Embedding time:")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Load chunks time:")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Retrieval time:")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("LLM generation time:")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Total RAG time:")
    );
    
    consoleSpy.mockRestore();
  });

  it("should identify slowest step", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    
    const chunks = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      text: `コンテンツ${i}`,
      embedding: [i % 2, (i + 1) % 2]
    }));
    
    const embed = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return [1, 0];
    });
    
    const loadAll = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return chunks;
    });
    
    const generate = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return "回答です。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 5,
    });

    await answerer("テスト質問");
    
    // 最も遅いステップが特定されていることを確認
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Slowest step:")
    );
    
    consoleSpy.mockRestore();
  });
});

