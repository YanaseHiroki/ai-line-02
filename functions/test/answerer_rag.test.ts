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

  it("一般的な知識に関する質問にも回答できる", async () => {
    const chunks = [
      { id: "1", text: "営業時間は9:00-18:00です。", embedding: [1, 0] },
    ];
    const embed = vi.fn(async (text: string) => [0, 0]); // 関連性の低い埋め込み
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      // 一般的な知識に関する質問の場合、コンテキストが少なくても回答する
      expect(prompt).toContain("コンテキストが限られている場合でも");
      expect(prompt).toContain("一般的な知識に基づいて");
      return "東京は日本の首都で、人口約1400万人の大都市です。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("東京について教えて");
    expect(res).toContain("東京");
    expect(res).toContain("首都");
  });

  it("関連するコンテキストがある場合はそれを優先する", async () => {
    const chunks = [
      { id: "1", text: "当社の営業時間は9:00-18:00です。", embedding: [1, 0] },
      { id: "2", text: "当社は東京都渋谷区にあります。", embedding: [0, 1] },
    ];
    const embed = vi.fn(async (text: string) => (text.includes("営業時間") ? [1, 0] : [0, 1]));
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      expect(prompt).toContain("当社の営業時間は9:00-18:00です。");
      return "当社の営業時間は9:00-18:00です。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("営業時間は？");
    expect(res).toContain("当社の営業時間");
  });

  it("コンテキストが空の場合でも一般的な知識で回答する", async () => {
    const chunks: { id: string; text: string; embedding: number[] }[] = [];
    const embed = vi.fn(async (text: string) => [0, 0]);
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      expect(prompt).toContain("コンテキストが限られている場合でも");
      expect(prompt).toContain("一般的な知識に基づいて");
      return "こんにちは！何かお手伝いできることはありますか？";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("こんにちは");
    expect(res).toContain("こんにちは");
  });

  it("APIキーが無効な場合は適切なエラーメッセージを返す", async () => {
    const answerer = buildRagAnswerer({
      getApiKey: () => undefined,
    });

    const res = await answerer("テスト質問");
    expect(res).toBe("現在サービスが混雑しています。しばらくしてからお試しください。");
  });
});



