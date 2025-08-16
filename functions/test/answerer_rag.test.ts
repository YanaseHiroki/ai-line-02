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
  
  // 重要セクション
  expect(prompt).toContain("重要：");
  expect(prompt).toContain("・コンテキストに質問に関連する情報がある場合は、その情報を直接的に回答に含めてください。");
  expect(prompt).toContain("・コンテキストの内容を自然に組み合わせて、包括的な回答を作成してください。");
  expect(prompt).toContain("・資料の内容をそのまま活用し、わかりやすい形で回答してください。");
  
  // 注意点セクション
  expect(prompt).toContain("注意点：");
  expect(prompt).toContain("・資料に基づく回答かどうかについて言及せず回答内容だけを返す。");
  expect(prompt).toContain("・資料に基づく回答の場合でも、資料のどこに書いてあるかに言及せず回答内容だけを返す。");
  expect(prompt).toContain("・「テキストからはーーの記述は見当たりません」「資料にはーーの内容はありません」などの表現は避けてください。");
  
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

  it("黄金タイムの質問に対して適切に資料の内容を回答する", async () => {
    const chunks = [
      { 
        id: "1", 
        text: "### 2.1 黄金タイムの見つけ方\n\n**一般的なベストタイム：**\n- 平日：7:00-9:00、12:00-13:00、19:00-22:00\n- 土日：10:00-12:00、15:00-17:00、20:00-22:00\n\nただし、**自分のフォロワーの行動パターンを分析**することが最重要です。Instagramインサイトの「オーディエンス」→「最もアクティブな時間」をチェックしましょう。", 
        embedding: [0.8, 0.2] 
      },
      { 
        id: "2", 
        text: "### 2.2 投稿頻度の最適解\n\n- **フィード投稿：** 1日1-2回（品質重視）\n- **ストーリーズ：** 1日3-5回（日常感重視）", 
        embedding: [0.3, 0.7] 
      },
    ];
    
    // 黄金タイムの質問に対して関連度の高い埋め込みを返す
    const embed = vi.fn(async (text: string) => {
      if (text.includes("黄金タイム") || text.includes("投稿の黄金タイム")) {
        return [0.9, 0.1]; // 黄金タイムのチャンクと高い類似度
      }
      return [0.1, 0.9];
    });
    
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      // プロンプトに黄金タイムの内容が含まれていることを確認
      expect(prompt).toContain("### 2.1 黄金タイムの見つけ方");
      expect(prompt).toContain("平日：7:00-9:00、12:00-13:00、19:00-22:00");
      expect(prompt).toContain("土日：10:00-12:00、15:00-17:00、20:00-22:00");
      expect(prompt).toContain("自分のフォロワーの行動パターンを分析");
      
      return "投稿の黄金タイムは以下の通りです：\n\n**一般的なベストタイム：**\n- 平日：7:00-9:00、12:00-13:00、19:00-22:00\n- 土日：10:00-12:00、15:00-17:00、20:00-22:00\n\nただし、自分のフォロワーの行動パターンを分析することが最重要です。Instagramインサイトの「オーディエンス」→「最もアクティブな時間」をチェックしましょう。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 2,
    });

    const res = await answerer("投稿の黄金タイムは？");
    
    // 資料の内容が適切に回答に含まれていることを確認
    expect(res).toContain("平日：7:00-9:00、12:00-13:00、19:00-22:00");
    expect(res).toContain("土日：10:00-12:00、15:00-17:00、20:00-22:00");
    expect(res).toContain("自分のフォロワーの行動パターンを分析");
    expect(res).toContain("Instagramインサイト");
    
    // 「資料にはーーの内容はありません」という文が含まれていないことを確認
    expect(res).not.toContain("資料には");
    expect(res).not.toContain("内容はありません");
    expect(res).not.toContain("見当たりません");
  });

  it("類似度が低い場合でも関連するチャンクを取得できる", async () => {
    const chunks = [
      { 
        id: "1", 
        text: "### 2.1 黄金タイムの見つけ方\n\n**一般的なベストタイム：**\n- 平日：7:00-9:00、12:00-13:00、19:00-22:00", 
        embedding: [0.05, 0.95] // 類似度が低い
      },
    ];
    
    const embed = vi.fn(async (text: string) => [0.1, 0.9]); // 類似度が低い
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      // 類似度が低くても関連するチャンクが含まれていることを確認
      expect(prompt).toContain("### 2.1 黄金タイムの見つけ方");
      return "黄金タイムについて回答します。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("投稿の黄金タイムは？");
    expect(res).toContain("黄金タイムについて回答します。");
  });

  it("類似度閾値の問題を検出する", async () => {
    const chunks = [
      { 
        id: "1", 
        text: "### 2.1 黄金タイムの見つけ方\n\n**一般的なベストタイム：**\n- 平日：7:00-9:00、12:00-13:00、19:00-22:00\n- 土日：10:00-12:00、15:00-17:00、20:00-22:00", 
        embedding: [0.08, 0.92] // 類似度が0.1未満
      },
    ];
    
    const embed = vi.fn(async (text: string) => [0.09, 0.91]); // 類似度が0.1未満
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      // 現在の実装では類似度0.1未満のチャンクは除外されるため、
      // プロンプトに黄金タイムの内容が含まれない可能性がある
      console.log("Generated prompt:", prompt);
      return "テキストからは投稿の黄金時間帯に関する具体的な記述は見当たりません。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("投稿の黄金タイムは？");
    // 現在の実装では類似度閾値により関連チャンクが除外される可能性がある
    console.log("Generated response:", res);
  });

  it("修正後のプロンプトで資料の内容を適切に回答する", async () => {
    const chunks = [
      { 
        id: "1", 
        text: "### 2.1 黄金タイムの見つけ方\n\n**一般的なベストタイム：**\n- 平日：7:00-9:00、12:00-13:00、19:00-22:00\n- 土日：10:00-12:00、15:00-17:00、20:00-22:00\n\nただし、**自分のフォロワーの行動パターンを分析**することが最重要です。Instagramインサイトの「オーディエンス」→「最もアクティブな時間」をチェックしましょう。", 
        embedding: [0.8, 0.2] 
      },
    ];
    
    const embed = vi.fn(async (text: string) => [0.9, 0.1]);
    const loadAll = vi.fn(async () => chunks);
    const generate = vi.fn(async (prompt: string) => {
      // 修正後のプロンプトでは資料の内容を直接回答するよう指示される
      expect(prompt).toContain("### 2.1 黄金タイムの見つけ方");
      expect(prompt).toContain("平日：7:00-9:00、12:00-13:00、19:00-22:00");
      expect(prompt).toContain("土日：10:00-12:00、15:00-17:00、20:00-22:00");
      
      // 修正後のプロンプトでは資料の内容をそのまま回答する
      return "投稿の黄金タイムは以下の通りです：\n\n**一般的なベストタイム：**\n- 平日：7:00-9:00、12:00-13:00、19:00-22:00\n- 土日：10:00-12:00、15:00-17:00、20:00-22:00\n\nただし、自分のフォロワーの行動パターンを分析することが最重要です。Instagramインサイトの「オーディエンス」→「最もアクティブな時間」をチェックしましょう。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("投稿の黄金タイムは？");
    
    // 修正後の実装では資料の内容が適切に回答に含まれる
    expect(res).toContain("平日：7:00-9:00、12:00-13:00、19:00-22:00");
    expect(res).toContain("土日：10:00-12:00、15:00-17:00、20:00-22:00");
    expect(res).toContain("自分のフォロワーの行動パターンを分析");
    expect(res).toContain("Instagramインサイト");
    
    // 「見当たりません」という文が含まれていないことを確認
    expect(res).not.toContain("見当たりません");
    expect(res).not.toContain("資料には");
    expect(res).not.toContain("内容はありません");
  });

  it("実際のLLMの動作を模倣するテスト", async () => {
    const chunks = [
      { 
        id: "1", 
        text: "### 2.1 黄金タイムの見つけ方\n\n**一般的なベストタイム：**\n- 平日：7:00-9:00、12:00-13:00、19:00-22:00\n- 土日：10:00-12:00、15:00-17:00、20:00-22:00\n\nただし、**自分のフォロワーの行動パターンを分析**することが最重要です。Instagramインサイトの「オーディエンス」→「最もアクティブな時間」をチェックしましょう。", 
        embedding: [0.8, 0.2] 
      },
    ];
    
    const embed = vi.fn(async (text: string) => [0.9, 0.1]);
    const loadAll = vi.fn(async () => chunks);
    
    // 実際のLLMの動作を模倣するgenerate関数
    const generate = vi.fn(async (prompt: string) => {
      // プロンプトに黄金タイムの内容が含まれている場合、それを直接回答に含める
      if (prompt.includes("### 2.1 黄金タイムの見つけ方") && 
          prompt.includes("平日：7:00-9:00、12:00-13:00、19:00-22:00") &&
          prompt.includes("土日：10:00-12:00、15:00-17:00、20:00-22:00")) {
        return "投稿の黄金タイムは以下の通りです：\n\n**一般的なベストタイム：**\n- 平日：7:00-9:00、12:00-13:00、19:00-22:00\n- 土日：10:00-12:00、15:00-17:00、20:00-22:00\n\nただし、自分のフォロワーの行動パターンを分析することが最重要です。Instagramインサイトの「オーディエンス」→「最もアクティブな時間」をチェックしましょう。";
      }
      
      // プロンプトに「見当たりません」を避けるよう指示されている場合
      if (prompt.includes("「テキストからはーーの記述は見当たりません」")) {
        return "投稿の黄金タイムについて回答します。コンテキストの情報を活用して回答を作成します。";
      }
      
      return "一般的な回答です。";
    });

    const answerer = buildRagAnswerer({
      getApiKey: () => "DUMMY",
      embedFn: embed,
      loadAllChunksFn: loadAll,
      generateFn: generate,
      topK: 1,
    });

    const res = await answerer("投稿の黄金タイムは？");
    
    // 実際のLLMの動作を模倣した場合の期待結果
    expect(res).toContain("平日：7:00-9:00、12:00-13:00、19:00-22:00");
    expect(res).toContain("土日：10:00-12:00、15:00-17:00、20:00-22:00");
    expect(res).toContain("自分のフォロワーの行動パターンを分析");
    expect(res).toContain("Instagramインサイト");
    
    // 「見当たりません」という文が含まれていないことを確認
    expect(res).not.toContain("見当たりません");
    expect(res).not.toContain("資料には");
    expect(res).not.toContain("内容はありません");
  });
});
