import { describe, it, expect, vi } from "vitest";
import { buildRagAnswerer } from "../src/rag/ragAnswerer";

// プロンプトの構造を検証するヘルパー関数
function expectPromptStructure(prompt: string) {
  // 基本的な構造を確認
  expect(prompt).toContain("あなたは有能なサポート担当です。ユーザーの質問に日本語で正確に回答してください。");
  
  // 回答内容セクション
  expect(prompt).toContain("回答内容：");
  expect(prompt).toContain("・もし質問がコンテキストに関連する内容であれば、コンテキストの内容に基づいて回答してください。");
  expect(prompt).toContain("・コンテキストと関係ない質問に対しても回答してください。");
  
  // 注意点セクション
  expect(prompt).toContain("注意点：");
  expect(prompt).toContain("・資料に基づく回答かどうかについて言及せず回答内容だけを返す。");
  expect(prompt).toContain("・資料に基づく回答の場合でも、資料のどこに書いてあるかに言及せず回答内容だけを返す。");
  
  // 不要な記述例セクション
  expect(prompt).toContain("不要な記述例：");
  expect(prompt).toContain("・資料にはーーの内容はありませんが");
  expect(prompt).toContain("・資料にはーーに関する具体的な記述はありませんが");
  expect(prompt).toContain("・ーーは、今回の資料からは直接読み取れません");
  
  // 文字数制限
  expect(prompt).toContain("回答は最大500文字以内で簡潔にしてください。");
  
  // コンテキストと質問セクション
  expect(prompt).toContain("コンテキスト:");
  expect(prompt).toContain("質問:");
}

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
      // プロンプトの構造を検証
      expectPromptStructure(prompt);
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
      expectPromptStructure(prompt);
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

  it("資料にない内容の質問に対しては汎用的なAIチャットとして回答する", async () => {
    const chunks = [
      { id: "1", text: "営業時間は9:00-18:00です。", embedding: [1, 0] },
    ];
    const embed = vi.fn(async (text: string) => [0, 0]); // 関連性の低い埋め込み
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      expectPromptStructure(prompt);
      return "プログラミングは論理的思考を養うのに役立ちます。初心者にはPythonがおすすめです。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("プログラミングについて教えて");
    expect(res).toContain("プログラミング");
    expect(res).toContain("Python");
    // 「資料にはーーの内容はありません」という文が含まれていないことを確認
    expect(res).not.toContain("資料には");
    expect(res).not.toContain("内容はありません");
  });

  it("回答の長さは最大500文字に制限される", async () => {
    const chunks = [
      { id: "1", text: "営業時間は9:00-18:00です。", embedding: [1, 0] },
    ];
    const embed = vi.fn(async (text: string) => [0, 0]);
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      // プロンプトで500文字以内の回答を生成するよう指示されていることを確認
      expect(prompt).toContain("回答は最大500文字以内で簡潔にしてください");
      // 確実に500文字を超える回答を返す
      return "これは長い回答です。".repeat(51);
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("テスト質問");
    // 500文字以上の場合、499文字に切り詰めて「…」を追加
    expect(res.length).toBe(500); // 499文字 + 「…」1文字 = 500文字
    expect(res).toContain("これは長い回答です");
    expect(res.endsWith("…")).toBe(true);
  });

  it("500文字未満の回答はそのまま返される", async () => {
    const chunks = [
      { id: "1", text: "営業時間は9:00-18:00です。", embedding: [1, 0] },
    ];
    const embed = vi.fn(async (text: string) => [0, 0]);
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      // 短い回答を返す
      return "これは短い回答です。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("テスト質問");
    // 500文字未満の場合はそのまま返される
    expect(res).toBe("これは短い回答です。");
    expect(res.length).toBeLessThan(500);
    expect(res.endsWith("…")).toBe(false);
  });

  it("ちょうど500文字の回答はそのまま返される", async () => {
    const chunks = [
      { id: "1", text: "営業時間は9:00-18:00です。", embedding: [1, 0] },
    ];
    const embed = vi.fn(async (text: string) => [0, 0]);
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      // ちょうど500文字の回答を返す
      return "a".repeat(500);
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("テスト質問");
    // ちょうど500文字の場合はそのまま返される
    expect(res.length).toBe(500);
    expect(res).toBe("a".repeat(500));
    expect(res.endsWith("…")).toBe(false);
  });

  it("現在のプロンプトが問題のある回答を生成することを確認", async () => {
    const chunks = [
      { id: "1", text: "営業時間は9:00-18:00です。", embedding: [1, 0] },
    ];
    const embed = vi.fn(async (text: string) => [0, 0]); // 関連性の低い埋め込み
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      expectPromptStructure(prompt);
      return "プログラミングは論理的思考を養うのに役立ちます。初心者にはPythonがおすすめです。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("プログラミングについて教えて");
    // 新しい実装では「資料にはーーの内容はありません」が含まれない
    expect(res).not.toContain("資料には");
    expect(res).not.toContain("内容はありません");
    expect(res).toContain("プログラミング");
  });

  it("プロンプト内で文字数を指定する", async () => {
    const chunks = [
      { id: "1", text: "営業時間は9:00-18:00です。", embedding: [1, 0] },
    ];
    const embed = vi.fn(async (text: string) => [0, 0]);
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      expectPromptStructure(prompt);
      return "これは短い回答です。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("テスト質問");
    expect(res).toBe("これは短い回答です。");
  });
});
