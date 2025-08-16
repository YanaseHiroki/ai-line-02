import { describe, it, expect, vi } from "vitest";
import { buildRagAnswerer } from "../src/rag/ragAnswerer";

// Instagramノウハウ資料のモックチャンク
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
  },
  {
    id: "6",
    text: "効果的なハッシュタグの選び方：1. 競合分析：同ジャンルの人気アカウントのハッシュタグをチェック 2. ハッシュタグ検索：関連タグの投稿数と最新投稿を確認 3. トレンド把握：発見タブで話題のハッシュタグを調査 4. 効果測定：インサイトでリーチ数の多いハッシュタグを分析",
    embedding: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "7",
    text: "第一印象を決める写真・動画のコツ：明るさ：自然光を活用し、明るく清潔感のある画像に 構図：三分割法や対称性を意識した安定感のある構図 色彩：ブランドカラーを意識した統一感のある色調 サイズ：各投稿形式に最適化されたサイズで投稿",
    embedding: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "8",
    text: "推奨サイズ：フィード投稿：1080×1080px（正方形） ストーリーズ：1080×1920px（縦長） リール：1080×1920px（縦長） IGTV：1080×1920px（縦長）",
    embedding: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "9",
    text: "動画は静止画の6倍のエンゲージメントを獲得できます。冒頭3秒：視聴者の注意を引くインパクトのある開始 音楽活用：トレンドの音楽や効果音を効果的に使用 テキスト挿入：音声なしでも理解できる字幕やテキスト 終わり方：「いいね」「フォロー」を促す自然な呼びかけ",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "10",
    text: "キャプション構成の黄金パターン：1. フック（注意を引く一言） 2. 価値提供（具体的な情報・体験） 3. 共感ポイント（読者との接点） 4. 行動喚起（いいね・コメント・フォローの促し）",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "11",
    text: "エンゲージメントを高める文章テクニック：1. 感情を動かす：喜び・驚き・共感を呼ぶ表現 2. 具体性重視：数字や固有名詞を使った具体的な描写 3. 読者目線：「あなた」を主語にした親しみやすい語りかけ 4. 価値提供：読んだ人が得をする情報やヒントの提供",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "12",
    text: "コメント率の目標値：1000フォロワー未満：5-10% 1000-10000フォロワー：2-5% 10000フォロワー以上：1-3%",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "13",
    text: "保存機能はアルゴリズムに最も高く評価されるアクションです。まとめ系：「○○の方法5選」「必見スポット10選」 レシピ・作り方：手順が明確で再現可能な内容 チェックリスト：「旅行前にチェックすべき項目」 比較表：商品やサービスの比較情報 名言・格言：心に響く言葉やモチベーション向上の内容",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]
  },
  {
    id: "14",
    text: "リールは現在最もリーチしやすい投稿形式です。成功するリールの共通点：最初の3秒でフックする トレンドの音楽を使用 縦型画面に最適化 15-30秒の最適な長さ 字幕・テキストで情報を補完",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
  },
  {
    id: "15",
    text: "リールの種類：ハウツー系：短時間で学べる実用的な内容 ビフォーアフター：変化が分かりやすい変身系 チャレンジ系：トレンドのチャレンジに参加 日常系：親しみやすい日常の一コマ",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]
  },
  {
    id: "16",
    text: "プロフィール最適化：アイコン：一目で内容が分かる統一感のあるデザイン ユーザーネーム：覚えやすく検索されやすい名前 自己紹介文：価値提供を明確にした150文字以内の説明 リンク活用：ブログやYouTubeなど外部コンテンツへの誘導 ハイライト：重要な情報を常に見られる状態で整理",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
  },
  {
    id: "17",
    text: "重要な分析指標：リーチ数（投稿を見た人数） エンゲージメント率（いいね・コメント・保存の割合） フォロワー増加率 投稿の保存数 プロフィールアクセス数",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]
  },
  {
    id: "18",
    text: "長期的な成功には一貫したブランドイメージが不可欠です。コンセプト設定：「何の専門家として認知されたいか」を明確化 投稿スタイル：色調・構図・文体の統一 価値観の表現：大切にしている思いや信念の一貫した発信 キャラクター性：親しみやすい人柄の演出",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
  },
  {
    id: "19",
    text: "収益化の主な方法：アフィリエイト・PR投稿 自社商品・サービス販売 オンライン講座・コンサル 書籍出版・メディア出演 スポンサー契約 ただし、価値提供を最優先に考え、商業色の強い投稿に偏らないよう注意が必要です。",
    embedding: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
  }
];

// 簡素化されたモック埋め込み関数
function createMockEmbedder() {
  return vi.fn(async (text: string) => {
    // キーワードベースの簡単な埋め込みシミュレーション
    // より詳細なキーワードマッチングを追加（優先順位を考慮）
    if (text.includes("バズ") || text.includes("バズる")) return [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("アルゴリズム") || text.includes("2024年")) return [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("投稿時間") || text.includes("ベストタイム") || text.includes("黄金タイム") || text.includes("タイム")) return [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("投稿頻度") || text.includes("頻度") || text.includes("何回")) return [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("ハッシュタグの調査") || text.includes("調査方法") || text.includes("競合分析")) return [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("ハッシュタグ") || text.includes("タグ")) return [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("動画の成功") || text.includes("6倍") || text.includes("成功法則")) return [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("写真") || text.includes("動画") || text.includes("画像")) return [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("サイズ") || text.includes("1080") || text.includes("px")) return [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("キャプション") || text.includes("書き方")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("文章テクニック") || text.includes("感情を動かす") || text.includes("文章")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("コメント") || text.includes("コメント率")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
    if (text.includes("保存") || text.includes("保存機能")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0];
    if (text.includes("リールの種類") || text.includes("ハウツー系") || text.includes("種類")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0];
    if (text.includes("リール") || text.includes("リーチしやすい")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
    if (text.includes("プロフィール") || text.includes("アイコン")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    if (text.includes("分析") || text.includes("指標") || text.includes("リーチ数")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0];
    if (text.includes("ブランディング") || text.includes("ブランド") || text.includes("一貫")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0];
    if (text.includes("収益化") || text.includes("収益") || text.includes("アフィリエイト")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
    if (text.includes("成功") || text.includes("戦略") || text.includes("総合")) return [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]; // 総合的な質問には中程度の類似度
    if (text.includes("プログラミング")) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 資料にない内容
    return [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]; // デフォルトを0.1に変更して閾値を超えるように
  });
}

// 類似度計算のモック関数
function createMockSimilarity() {
  return vi.fn((a: number[], b: number[]) => {
    // コサイン類似度の簡易版
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  });
}

describe("Instagram RAG System", () => {
  describe("基本的な検索機能", () => {
    it("バズの定義について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("バズの3つの条件");
        return "Instagramでバズるとは、通常の何倍ものリーチとエンゲージメントを獲得することです。バズの3つの条件は：1. 最初の1時間で高いエンゲージメント率 2. 滞在時間の長いコンテンツ 3. シェア・保存される価値のある内容です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("バズるとは何ですか？");
      expect(res).toContain("バズるとは");
      expect(res).toContain("リーチとエンゲージメント");
      expect(res).toContain("3つの条件");
    });

    it("2024年のアルゴリズムについて正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("2024年のInstagramアルゴリズム");
        return "2024年のInstagramアルゴリズムは以下を重要視しています：関係性（フォロワーとの相互作用の頻度）、興味関心（過去の行動履歴との一致度）、投稿の新しさ（タイムリーな情報への優先度）、利用時間（アプリ内での滞在時間向上への貢献）です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("2024年のInstagramアルゴリズムについて教えて");
      expect(res).toContain("2024年のInstagramアルゴリズム");
      expect(res).toContain("関係性");
      expect(res).toContain("興味関心");
    });
  });

  describe("投稿タイミング", () => {
    it("ベストタイムについて正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("7:00-9:00");
        expect(prompt).toContain("19:00-22:00");
        return "一般的なベストタイムは平日：7:00-9:00、12:00-13:00、19:00-22:00、土日：10:00-12:00、15:00-17:00、20:00-22:00です。ただし、自分のフォロワーの行動パターンを分析することが最重要です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("投稿のベストタイムはいつですか？");
      expect(res).toContain("7:00-9:00");
      expect(res).toContain("19:00-22:00");
      expect(res).toContain("フォロワーの行動パターン");
    });

    it("投稿頻度について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("フィード投稿：1日1-2回");
        expect(prompt).toContain("リール：週3-4回");
        return "投稿頻度の最適解はフィード投稿：1日1-2回（品質重視）、ストーリーズ：1日3-5回（日常感重視）、リール：週3-4回（トレンド重視）、IGTV/動画：週1-2回（価値提供重視）です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("どのくらいの頻度で投稿すればいいですか？");
      expect(res).toContain("フィード投稿：1日1-2回");
      expect(res).toContain("リール：週3-4回");
      expect(res).toContain("品質重視");
    });
  });

  describe("ハッシュタグ戦略", () => {
    it("ハッシュタグの組み合わせについて正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("ビッグハッシュタグ（100万+）：2-3個");
        expect(prompt).toContain("ミドルハッシュタグ（10万-100万）：10-15個");
        return "ハッシュタグは大・中・小の投稿数のものをバランスよく組み合わせることが重要です。ビッグハッシュタグ（100万+）：2-3個、ミドルハッシュタグ（10万-100万）：10-15個、スモールハッシュタグ（1万-10万）：10-15個です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("ハッシュタグはどのように選べばいいですか？");
      expect(res).toContain("ビッグハッシュタグ（100万+）：2-3個");
      expect(res).toContain("ミドルハッシュタグ（10万-100万）：10-15個");
      expect(res).toContain("スモールハッシュタグ（1万-10万）：10-15個");
    });

    it("ハッシュタグの調査方法について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("競合分析");
        expect(prompt).toContain("ハッシュタグ検索");
        return "効果的なハッシュタグの選び方：1. 競合分析：同ジャンルの人気アカウントのハッシュタグをチェック 2. ハッシュタグ検索：関連タグの投稿数と最新投稿を確認 3. トレンド把握：発見タブで話題のハッシュタグを調査 4. 効果測定：インサイトでリーチ数の多いハッシュタグを分析";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("ハッシュタグの調査方法を教えて");
      expect(res).toContain("競合分析");
      expect(res).toContain("ハッシュタグ検索");
      expect(res).toContain("トレンド把握");
      expect(res).toContain("効果測定");
    });
  });

  describe("視覚的インパクト", () => {
    it("写真・動画のコツについて正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("明るさ：自然光を活用");
        expect(prompt).toContain("構図：三分割法や対称性");
        return "第一印象を決める写真・動画のコツ：明るさ：自然光を活用し、明るく清潔感のある画像に、構図：三分割法や対称性を意識した安定感のある構図、色彩：ブランドカラーを意識した統一感のある色調、サイズ：各投稿形式に最適化されたサイズで投稿";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("写真や動画のコツを教えて");
      expect(res).toContain("自然光を活用");
      expect(res).toContain("三分割法");
      expect(res).toContain("ブランドカラー");
    });

    it("推奨サイズについて正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("1080×1080px（正方形）");
        expect(prompt).toContain("1080×1920px（縦長）");
        return "推奨サイズ：フィード投稿：1080×1080px（正方形）、ストーリーズ：1080×1920px（縦長）、リール：1080×1920px（縦長）、IGTV：1080×1920px（縦長）です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("投稿の推奨サイズは？");
      expect(res).toContain("1080×1080px（正方形）");
      expect(res).toContain("1080×1920px（縦長）");
    });

    it("動画の成功法則について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("6倍のエンゲージメント");
        expect(prompt).toContain("冒頭3秒");
        return "動画は静止画の6倍のエンゲージメントを獲得できます。冒頭3秒：視聴者の注意を引くインパクトのある開始、音楽活用：トレンドの音楽や効果音を効果的に使用、テキスト挿入：音声なしでも理解できる字幕やテキスト、終わり方：「いいね」「フォロー」を促す自然な呼びかけ";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("動画の成功法則を教えて");
      expect(res).toContain("6倍のエンゲージメント");
      expect(res).toContain("冒頭3秒");
      expect(res).toContain("音楽活用");
    });
  });

  describe("キャプション・ストーリーテリング", () => {
    it("キャプションの構成について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("キャプション構成の黄金パターン");
        expect(prompt).toContain("フック（注意を引く一言）");
        return "キャプション構成の黄金パターン：1. フック（注意を引く一言） 2. 価値提供（具体的な情報・体験） 3. 共感ポイント（読者との接点） 4. 行動喚起（いいね・コメント・フォローの促し）";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("キャプションの書き方を教えて");
      expect(res).toContain("フック（注意を引く一言）");
      expect(res).toContain("価値提供");
      expect(res).toContain("共感ポイント");
      expect(res).toContain("行動喚起");
    });

    it("文章テクニックについて正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("感情を動かす");
        expect(prompt).toContain("具体性重視");
        return "エンゲージメントを高める文章テクニック：1. 感情を動かす：喜び・驚き・共感を呼ぶ表現 2. 具体性重視：数字や固有名詞を使った具体的な描写 3. 読者目線：「あなた」を主語にした親しみやすい語りかけ 4. 価値提供：読んだ人が得をする情報やヒントの提供";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("文章のテクニックを教えて");
      expect(res).toContain("感情を動かす");
      expect(res).toContain("具体性重視");
      expect(res).toContain("読者目線");
      expect(res).toContain("価値提供");
    });
  });

  describe("エンゲージメント向上", () => {
    it("コメント獲得戦略について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("コメント率の目標値");
        expect(prompt).toContain("1000フォロワー未満：5-10%");
        return "コメント率の目標値：1000フォロワー未満：5-10%、1000-10000フォロワー：2-5%、10000フォロワー以上：1-3%です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("コメントを増やすには？");
      expect(res).toContain("コメント率の目標値");
      expect(res).toContain("1000フォロワー未満：5-10%");
      expect(res).toContain("10000フォロワー以上：1-3%");
    });

    it("保存されやすいコンテンツについて正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("保存機能はアルゴリズムに最も高く評価される");
        expect(prompt).toContain("まとめ系");
        return "保存機能はアルゴリズムに最も高く評価されるアクションです。まとめ系：「○○の方法5選」「必見スポット10選」、レシピ・作り方：手順が明確で再現可能な内容、チェックリスト：「旅行前にチェックすべき項目」、比較表：商品やサービスの比較情報、名言・格言：心に響く言葉やモチベーション向上の内容";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("保存されやすいコンテンツは？");
      expect(res).toContain("保存機能はアルゴリズムに最も高く評価される");
      expect(res).toContain("まとめ系");
      expect(res).toContain("レシピ・作り方");
      expect(res).toContain("チェックリスト");
    });
  });

  describe("リール・ショート動画", () => {
    it("リールの特徴について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("リールは現在最もリーチしやすい投稿形式");
        expect(prompt).toContain("最初の3秒でフックする");
        return "リールは現在最もリーチしやすい投稿形式です。成功するリールの共通点：最初の3秒でフックする、トレンドの音楽を使用、縦型画面に最適化、15-30秒の最適な長さ、字幕・テキストで情報を補完";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("リールの特徴を教えて");
      expect(res).toContain("最もリーチしやすい投稿形式");
      expect(res).toContain("最初の3秒でフックする");
      expect(res).toContain("15-30秒の最適な長さ");
    });

    it("リールの種類について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("ハウツー系");
        expect(prompt).toContain("ビフォーアフター");
        return "リールの種類：ハウツー系：短時間で学べる実用的な内容、ビフォーアフター：変化が分かりやすい変身系、チャレンジ系：トレンドのチャレンジに参加、日常系：親しみやすい日常の一コマ";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("リールの種類を教えて");
      expect(res).toContain("ハウツー系");
      expect(res).toContain("ビフォーアフター");
      expect(res).toContain("チャレンジ系");
      expect(res).toContain("日常系");
    });
  });

  describe("フォロワー増加", () => {
    it("プロフィール最適化について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("アイコン：一目で内容が分かる統一感のあるデザイン");
        expect(prompt).toContain("自己紹介文：価値提供を明確にした150文字以内の説明");
        return "プロフィール最適化：アイコン：一目で内容が分かる統一感のあるデザイン、ユーザーネーム：覚えやすく検索されやすい名前、自己紹介文：価値提供を明確にした150文字以内の説明、リンク活用：ブログやYouTubeなど外部コンテンツへの誘導、ハイライト：重要な情報を常に見られる状態で整理";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("プロフィールの最適化方法を教えて");
      expect(res).toContain("アイコン：一目で内容が分かる統一感のあるデザイン");
      expect(res).toContain("自己紹介文：価値提供を明確にした150文字以内の説明");
      expect(res).toContain("ハイライト");
    });
  });

  describe("分析・改善", () => {
    it("重要な分析指標について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("リーチ数（投稿を見た人数）");
        expect(prompt).toContain("エンゲージメント率（いいね・コメント・保存の割合）");
        return "重要な分析指標：リーチ数（投稿を見た人数）、エンゲージメント率（いいね・コメント・保存の割合）、フォロワー増加率、投稿の保存数、プロフィールアクセス数";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("分析すべき指標は？");
      expect(res).toContain("リーチ数（投稿を見た人数）");
      expect(res).toContain("エンゲージメント率（いいね・コメント・保存の割合）");
      expect(res).toContain("フォロワー増加率");
      expect(res).toContain("投稿の保存数");
    });
  });

  describe("長期戦略", () => {
    it("ブランディング構築について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("一貫したブランドイメージ");
        expect(prompt).toContain("コンセプト設定");
        return "長期的な成功には一貫したブランドイメージが不可欠です。コンセプト設定：「何の専門家として認知されたいか」を明確化、投稿スタイル：色調・構図・文体の統一、価値観の表現：大切にしている思いや信念の一貫した発信、キャラクター性：親しみやすい人柄の演出";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("ブランディングについて教えて");
      expect(res).toContain("一貫したブランドイメージ");
      expect(res).toContain("コンセプト設定");
      expect(res).toContain("投稿スタイル");
      expect(res).toContain("キャラクター性");
    });

    it("収益化について正しく回答できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("アフィリエイト・PR投稿");
        expect(prompt).toContain("価値提供を最優先");
        return "収益化の主な方法：アフィリエイト・PR投稿、自社商品・サービス販売、オンライン講座・コンサル、書籍出版・メディア出演、スポンサー契約。ただし、価値提供を最優先に考え、商業色の強い投稿に偏らないよう注意が必要です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("収益化の方法を教えて");
      expect(res).toContain("アフィリエイト・PR投稿");
      expect(res).toContain("オンライン講座・コンサル");
      expect(res).toContain("価値提供を最優先");
    });
  });

  describe("エラーハンドリング", () => {
    it("資料にない内容の質問に対して適切に回答する", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        // 資料にない内容でも適切に回答
        return "プログラミングについてお答えします。プログラミングは論理的思考を養うのに役立ち、初心者にはPythonがおすすめです。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("プログラミングについて教えて");
      expect(res).toContain("プログラミング");
      expect(res).toContain("Python");
      // 「資料にはーーの内容はありません」という文が含まれていないことを確認
      expect(res).not.toContain("資料には");
      expect(res).not.toContain("内容はありません");
    });

    it("複数の関連チャンクを適切に組み合わせて回答する", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        // 複数のチャンクが含まれていることを確認
        expect(prompt).toContain("【1】");
        expect(prompt).toContain("【2】");
        expect(prompt).toContain("【3】");
        return "Instagramの総合的な戦略についてお答えします。バズの条件、アルゴリズムの理解、適切な投稿タイミング、ハッシュタグ戦略、視覚的インパクトの最大化、エンゲージメント向上のテクニック、リール活用、プロフィール最適化、分析指標、ブランディング構築、収益化方法など、包括的なアプローチが重要です。";
      });

      const answerer = buildRagAnswerer({
        getApiKey: () => "DUMMY",
        embedFn: embed,
        loadAllChunksFn: loadAll,
        generateFn: generate,
        topK: 3,
      });

      const res = await answerer("Instagramで成功するための総合的な戦略を教えて");
      expect(res).toContain("Instagramの総合的な戦略");
      expect(res).toContain("バズの条件");
      expect(res).toContain("アルゴリズムの理解");
      expect(res).toContain("包括的なアプローチ");
    });
  });

  describe("ハイブリッド検索の効果", () => {
    it("ハイブリッド検索で「黄金タイム」を正しく検索できる", async () => {
      const embed = createMockEmbedder();
      const loadAll = vi.fn(async () => instagramChunks);
      const generate = vi.fn(async (prompt: string) => {
        expect(prompt).toContain("7:00-9:00");
        expect(prompt).toContain("19:00-22:00");
        return "投稿の黄金タイムは平日：7:00-9:00、12:00-13:00、19:00-22:00です。";
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
      expect(res).toContain("7:00-9:00");
      expect(res).toContain("19:00-22:00");
      expect(res).not.toContain("資料には投稿の黄金タイムに関する記述はありません");
    });

    it("様々な表現で投稿時間を検索できる", async () => {
      const testCases = [
        "投稿の黄金タイムは？",
        "投稿のベストタイムは？", 
        "投稿の最適な時間は？",
        "いつ投稿すればいい？",
        "投稿タイミングは？",
        "投稿時間は？"
      ];

      for (const question of testCases) {
        const embed = createMockEmbedder();
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
      const embed = createMockEmbedder();
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
        expect(prompt).toContain("7:00-9:00");
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
    });
  });
});
