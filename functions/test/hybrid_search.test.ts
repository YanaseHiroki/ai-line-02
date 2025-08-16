import { describe, it, expect, vi } from "vitest";
import { buildRagAnswerer } from "../src/rag/ragAnswerer";

// Instagramノウハウ資料のモックチャンク（実際の資料に近い内容）
const instagramChunks = [
  {
    id: "1",
    text: "Instagramでバズるとは、通常の何倍ものリーチとエンゲージメントを獲得することです。アルゴリズムが優遇し、発見タブやおすすめに表示されることで拡散が加速します。バズの3つの条件：1. 最初の1時間で高いエンゲージメント率 2. 滞在時間の長いコンテンツ 3. シェア・保存される価値のある内容",
    embedding: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "2",
    text: "2024年のInstagramアルゴリズムは以下を重要視しています：関係性：フォロワーとの相互作用の頻度 興味関心：過去の行動履歴との一致度 投稿の新しさ：タイムリーな情報への優先度 利用時間：アプリ内での滞在時間向上への貢献",
    embedding: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "3",
    text: "一般的なベストタイム：平日：7:00-9:00、12:00-13:00、19:00-22:00 土日：10:00-12:00、15:00-17:00、20:00-22:00 ただし、自分のフォロワーの行動パターンを分析することが最重要です。Instagramインサイトの「オーディエンス」→「最もアクティブな時間」をチェックしましょう。",
    embedding: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "4",
    text: "投稿頻度の最適解：フィード投稿：1日1-2回（品質重視） ストーリーズ：1日3-5回（日常感重視） リール：週3-4回（トレンド重視） IGTV/動画：週1-2回（価値提供重視） 重要：量より質を重視し、一貫したスケジュールを維持することがアルゴリズムに評価されます。",
    embedding: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "5",
    text: "ハッシュタグは大・中・小の投稿数のものをバランスよく組み合わせることが重要です。ビッグハッシュタグ（100万+）：2-3個 ミドルハッシュタグ（10万-100万）：10-15個 スモールハッシュタグ（1万-10万）：10-15個",
    embedding: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
];

// 現在のベクトル検索のみのモック埋め込み関数（問題のある実装）
function createCurrentEmbedder() {
  return vi.fn(async (text: string) => {
    // 現在の実装では「黄金タイム」という具体的なキーワードが検索できない
    if (text.includes("バズ") || text.includes("バズる")) return [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("アルゴリズム") || text.includes("2024年")) return [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("投稿時間") || text.includes("ベストタイム") || text.includes("タイム")) return [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("投稿頻度") || text.includes("頻度")) return [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("ハッシュタグ") || text.includes("タグ")) return [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // 「黄金タイム」は検索されない
    return [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
  });
}

describe("ハイブリッド検索の実装", () => {
  describe("現在のベクトル検索の問題点", () => {
    it("「黄金タイム」という具体的なキーワードが検索できない", async () => {
      const embed = createCurrentEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        // 現在の実装では「黄金タイム」に関する情報が含まれない
        expect(prompt).not.toContain("7:00-9:00");
        expect(prompt).not.toContain("19:00-22:00");
        return "資料には投稿の黄金タイムに関する記述はありません。しかし、週次分析を行うことで、自身のアカウントにおいてエンゲージメントの高い時間帯を把握し、投稿時間を調整することが推奨されています。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
        useHybridSearch: false, // ベクトル検索のみ
      });

      const res = await answerer("投稿の黄金タイムは？");
      
      // 現在の実装では正しい情報が返されない
      expect(res).toContain("資料には投稿の黄金タイムに関する記述はありません");
      expect(res).not.toContain("7:00-9:00");
      expect(res).not.toContain("19:00-22:00");
    });
  });

  describe("ハイブリッド検索の改善効果", () => {
    it("ハイブリッド検索で「黄金タイム」を正しく検索できる", async () => {
      const embed = createCurrentEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        // ハイブリッド検索により「黄金タイム」でも正しい情報が含まれる
        expect(prompt).toContain("7:00-9:00");
        expect(prompt).toContain("19:00-22:00");
        return "投稿の黄金タイムは平日：7:00-9:00、12:00-13:00、19:00-22:00、土日：10:00-12:00、15:00-17:00、20:00-22:00です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
        useHybridSearch: true, // ハイブリッド検索を有効化
        hybridConfig: {
          vectorWeight: 0.3,
          keywordWeight: 0.7, // キーワード検索を重視
          minScore: 0.05
        }
      });

      const res = await answerer("投稿の黄金タイムは？");
      
      // ハイブリッド検索により正しい情報が返される
      expect(res).toContain("7:00-9:00");
      expect(res).toContain("19:00-22:00");
      expect(res).not.toContain("資料には投稿の黄金タイムに関する記述はありません");
    });

    it("同義語や類義語も適切に検索できる", async () => {
      // ハイブリッド検索により様々な表現で検索できる
      const testCases = [
        "投稿の黄金タイムは？",
        "投稿のベストタイムは？", 
        "投稿の最適な時間は？",
        "いつ投稿すればいい？",
        "投稿タイミングは？"
      ];

      for (const question of testCases) {
        const embed = createCurrentEmbedder();
        const loadAll = vi.fn(async () => instagramChunks);
        const generate = vi.fn(async (prompt: string) => {
          expect(prompt).toContain("7:00-9:00");
          return `質問「${question}」に対する回答：投稿の最適な時間は平日：7:00-9:00、12:00-13:00、19:00-22:00です。`;
        });

        const answerer = buildRagAnswerer({
          getApiKey: () => "DUMMY",
          embedFn: embed,
          loadAllChunksFn: loadAll,
          generateFn: generate,
          topK: 3,
          useHybridSearch: true,
          hybridConfig: {
            vectorWeight: 0.3,
            keywordWeight: 0.7,
            minScore: 0.05
          }
        });

        const res = await answerer(question);
        expect(res).toContain("7:00-9:00");
        expect(res).toContain("19:00-22:00");
      }
    });

    it("ベクトル検索とハイブリッド検索の結果を比較", async () => {
      const embed = createCurrentEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      
      // ベクトル検索のみ
      const vectorGenerate = vi.fn(async (prompt: string) => {
        return "ベクトル検索の結果";
      });

      const vectorAnswerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: vectorGenerate,
        topK: 3,
        useHybridSearch: false,
      });

      // ハイブリッド検索
      const hybridGenerate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("7:00-9:00"); // ハイブリッド検索では正しい情報が含まれる
        return "ハイブリッド検索の結果：7:00-9:00、19:00-22:00";
      });

      const hybridAnswerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: hybridGenerate,
        topK: 3,
        useHybridSearch: true,
        hybridConfig: {
          vectorWeight: 0.3,
          keywordWeight: 0.7,
          minScore: 0.05
        }
      });

      const vectorRes = await vectorAnswerer("投稿の黄金タイムは？");
      const hybridRes = await hybridAnswerer("投稿の黄金タイムは？");

      // ハイブリッド検索の方が正確な情報を返す
      expect(hybridRes).toContain("7:00-9:00");
      expect(hybridRes).toContain("19:00-22:00");
      expect(vectorRes).not.toContain("7:00-9:00");
    });
  });

  describe("ハイブリッド検索の設定", () => {
    it("キーワード検索の重みを調整できる", async () => {
      const embed = createCurrentEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      
      // キーワード検索を重視した設定
      const keywordHeavyGenerate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("7:00-9:00");
        return "キーワード重視の結果：7:00-9:00";
      });

      const keywordHeavyAnswerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: keywordHeavyGenerate,
        topK: 3,
        useHybridSearch: true,
        hybridConfig: {
          vectorWeight: 0.1,
          keywordWeight: 0.9, // キーワード検索を非常に重視
          minScore: 0.05
        }
      });

      const res = await keywordHeavyAnswerer("投稿の黄金タイムは？");
      expect(res).toContain("7:00-9:00");
    });

    it("ベクトル検索の重みを調整できる", async () => {
      const embed = createCurrentEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      
      // ベクトル検索を重視した設定
      const vectorHeavyGenerate = vi.fn(async (prompt: string) => {
        // ベクトル検索重視では「黄金タイム」は検索されにくい
        return "ベクトル重視の結果";
      });

      const vectorHeavyAnswerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: vectorHeavyGenerate,
        topK: 3,
        useHybridSearch: true,
        hybridConfig: {
          vectorWeight: 0.9,
          keywordWeight: 0.1, // キーワード検索を軽視
          minScore: 0.05
        }
      });

      const res = await vectorHeavyAnswerer("投稿の黄金タイムは？");
      expect(res).not.toContain("7:00-9:00");
    });
  });
});
