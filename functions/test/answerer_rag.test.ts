import { describe, it, expect, vi } from "vitest";
import { buildRagAnswerer } from "../src/rag/ragAnswerer";

describe("buildRagAnswerer", () => {
  it("選択したコンテキストをプロンプトに含めてLLMに渡す", async () => {
    const chunks = [
      { id: "1", text: "営業時間は9:00-18:00です。", embedding: [1, 0] },
      { id: "2", text: "所在地は東京都渋谷区です。", embedding: [0, 1] },
    ];
    const embed = vi.fn(async (text: string) => (text.includes("営業時間") ? [1, 0] : [0, 1]));
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      expect(prompt).toContain("営業時間は9:00-18:00です。");
      return "営業時間は9:00-18:00です。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("営業時間は？");
    expect(res).toContain("9:00-18:00");
  });
});



