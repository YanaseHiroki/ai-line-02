import { Chunk } from "./types";

export interface HybridRetrieverConfig {
  vectorWeight: number; // ベクトル検索の重み (0-1)
  keywordWeight: number; // キーワード検索の重み (0-1)
  keywordSynonyms: Record<string, string[]>; // 同義語辞書
  minScore: number; // 最小スコア閾値
}

export interface ScoredChunk {
  chunk: Chunk;
  vectorScore: number;
  keywordScore: number;
  hybridScore: number;
}

export class HybridRetriever {
  private config: HybridRetrieverConfig;

  constructor(config: Partial<HybridRetrieverConfig> = {}) {
    this.config = {
      vectorWeight: 0.7,
      keywordWeight: 0.3,
      keywordSynonyms: {
        "黄金タイム": ["ベストタイム", "最適な時間", "投稿時間", "タイム", "時間"],
        "ベストタイム": ["黄金タイム", "最適な時間", "投稿時間", "タイム", "時間"],
        "最適な時間": ["黄金タイム", "ベストタイム", "投稿時間", "タイム", "時間"],
        "投稿時間": ["黄金タイム", "ベストタイム", "最適な時間", "タイム", "時間"],
        "ハッシュタグ": ["タグ", "ハッシュ", "hashtag"],
        "タグ": ["ハッシュタグ", "ハッシュ", "hashtag"],
        "バズ": ["バズる", "人気", "話題", "トレンド"],
        "バズる": ["バズ", "人気", "話題", "トレンド"],
        "アルゴリズム": ["algorithm", "仕組み", "システム"],
        "エンゲージメント": ["engagement", "反応", "いいね", "コメント"],
        "リーチ": ["reach", "到達", "表示"],
        "フォロワー": ["follower", "フォロー", "読者"],
        "投稿頻度": ["頻度", "何回", "回数", "投稿回数"],
        "頻度": ["投稿頻度", "何回", "回数", "投稿回数"],
        "写真": ["画像", "動画", "ビジュアル", "コンテンツ"],
        "動画": ["写真", "画像", "ビジュアル", "コンテンツ"],
        "キャプション": ["文章", "テキスト", "説明文", "書き方"],
        "文章": ["キャプション", "テキスト", "説明文", "書き方"],
        "コメント": ["comment", "反応", "エンゲージメント"],
        "保存": ["save", "ブックマーク", "お気に入り"],
        "リール": ["reel", "ショート動画", "動画"],
        "プロフィール": ["profile", "アカウント", "自己紹介"],
        "分析": ["analytics", "インサイト", "データ", "指標"],
        "指標": ["分析", "analytics", "インサイト", "データ"],
        "ブランディング": ["ブランド", "一貫性", "統一感"],
        "ブランド": ["ブランディング", "一貫性", "統一感"],
        "収益化": ["収益", "マネタイズ", "アフィリエイト", "PR"],
        "収益": ["収益化", "マネタイズ", "アフィリエイト", "PR"],
      },
      minScore: 0.05,
      ...config,
    };
  }

  /**
   * ハイブリッド検索を実行
   * @param {string} query 検索クエリ
   * @param {Chunk[]} chunks 検索対象のチャンク
   * @param {Function} embedFn 埋め込み関数
   * @param {Function} similarityFn 類似度計算関数
   * @return {Promise<ScoredChunk[]>} スコア付きチャンクの配列
   */
  async retrieve(
    query: string,
    chunks: Chunk[],
    embedFn: (text: string) => Promise<number[]>,
    similarityFn: (a: number[], b: number[]) => number,
  ): Promise<ScoredChunk[]> {
    // 1. ベクトル検索
    const vectorScores = await this.vectorSearch(query, chunks, embedFn, similarityFn);

    // 2. キーワード検索
    const keywordScores = this.keywordSearch(query, chunks);

    // 3. ハイブリッドスコアの計算
    const hybridScores = this.calculateHybridScores(vectorScores, keywordScores, chunks);

    // 4. スコアでソートしてフィルタリング
    return hybridScores
      .filter((scored) => scored.hybridScore >= this.config.minScore)
      .sort((a, b) => b.hybridScore - a.hybridScore);
  }

  /**
   * ベクトル検索
   * @param {string} query 検索クエリ
   * @param {Chunk[]} chunks 検索対象のチャンク
   * @param {Function} embedFn 埋め込み関数
   * @param {Function} similarityFn 類似度計算関数
   * @return {Promise<Map<string, number>>} チャンクIDとスコアのマップ
   */
  private async vectorSearch(
    query: string,
    chunks: Chunk[],
    embedFn: (text: string) => Promise<number[]>,
    similarityFn: (a: number[], b: number[]) => number,
  ): Promise<Map<string, number>> {
    const queryEmbedding = await embedFn(query);
    const scores = new Map<string, number>();

    for (const chunk of chunks) {
      const similarity = similarityFn(queryEmbedding, chunk.embedding);
      scores.set(chunk.id, similarity);
    }

    return scores;
  }

  /**
   * キーワード検索
   * @param {string} query 検索クエリ
   * @param {Chunk[]} chunks 検索対象のチャンク
   * @return {Map<string, number>} チャンクIDとスコアのマップ
   */
  private keywordSearch(query: string, chunks: Chunk[]): Map<string, number> {
    const scores = new Map<string, number>();
    const queryKeywords = this.extractKeywords(query);

    for (const chunk of chunks) {
      const chunkKeywords = this.extractKeywords(chunk.text);
      const score = this.calculateKeywordScore(queryKeywords, chunkKeywords);
      scores.set(chunk.id, score);
    }

    return scores;
  }

  /**
   * テキストからキーワードを抽出
   * @param {string} text 抽出対象のテキスト
   * @return {Set<string>} キーワードのセット
   */
  private extractKeywords(text: string): Set<string> {
    const keywords = new Set<string>();
    const normalizedText = text.toLowerCase();

    // 基本キーワードの抽出
    for (const [mainKeyword, synonyms] of Object.entries(this.config.keywordSynonyms)) {
      if (normalizedText.includes(mainKeyword.toLowerCase())) {
        keywords.add(mainKeyword);
      }
      for (const synonym of synonyms) {
        if (normalizedText.includes(synonym.toLowerCase())) {
          keywords.add(mainKeyword);
          break;
        }
      }
    }

    // 数字と時間のパターンを抽出
    const timePatterns = [
      /\d{1,2}:\d{2}/g, // 7:00, 19:30
      /\d{1,2}時/g, // 7時
      /\d{1,2}時間/g, // 1時間
      /\d{1,2}回/g, // 1回
      /\d{1,2}個/g, // 3個
      /\d{1,2}%?/g, // 10%
    ];

    for (const pattern of timePatterns) {
      const matches = normalizedText.match(pattern);
      if (matches) {
        matches.forEach((match) => keywords.add(match));
      }
    }

    return keywords;
  }

  /**
   * キーワードスコアの計算
   * @param {Set<string>} queryKeywords クエリのキーワード
   * @param {Set<string>} chunkKeywords チャンクのキーワード
   * @return {number} Jaccard類似度スコア
   */
  private calculateKeywordScore(queryKeywords: Set<string>, chunkKeywords: Set<string>): number {
    if (queryKeywords.size === 0 || chunkKeywords.size === 0) {
      return 0;
    }

    let intersection = 0;
    for (const keyword of queryKeywords) {
      if (chunkKeywords.has(keyword)) {
        intersection++;
      }
    }

    // Jaccard類似度
    const union = queryKeywords.size + chunkKeywords.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * ハイブリッドスコアの計算
   * @param {Map<string, number>} vectorScores ベクトル検索のスコア
   * @param {Map<string, number>} keywordScores キーワード検索のスコア
   * @param {Chunk[]} chunks チャンク配列
   * @return {ScoredChunk[]} スコア付きチャンクの配列
   */
  private calculateHybridScores(
    vectorScores: Map<string, number>,
    keywordScores: Map<string, number>,
    chunks: Chunk[],
  ): ScoredChunk[] {
    const scoredChunks: ScoredChunk[] = [];
    const allIds = new Set([...vectorScores.keys(), ...keywordScores.keys()]);

    for (const id of allIds) {
      const vectorScore = vectorScores.get(id) || 0;
      const keywordScore = keywordScores.get(id) || 0;

      const hybridScore =
        this.config.vectorWeight * vectorScore +
        this.config.keywordWeight * keywordScore;

      // チャンクを取得
      const chunk = chunks.find((c) => c.id === id);
      if (!chunk) continue;

      scoredChunks.push({
        chunk,
        vectorScore,
        keywordScore,
        hybridScore,
      });
    }

    return scoredChunks;
  }

  /**
   * 同義語辞書を更新
   * @param {Record<string, string[]>} synonyms 追加する同義語辞書
   */
  updateSynonyms(synonyms: Record<string, string[]>): void {
    this.config.keywordSynonyms = { ...this.config.keywordSynonyms, ...synonyms };
  }

  /**
   * 設定を更新
   * @param {Partial<HybridRetrieverConfig>} config 更新する設定
   */
  updateConfig(config: Partial<HybridRetrieverConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
