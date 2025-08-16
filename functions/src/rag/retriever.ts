import { HybridRetriever } from "./hybridRetriever";

export type RetrieveDeps<T> = {
  query: string;
  topK: number;
  embed: (text: string) => Promise<number[]>;
  similarity: (a: number[], b: number[]) => number;
  loadAllChunks: () => Promise<T[]>;
  getEmbeddingVector: (chunk: T) => number[];
  useHybridSearch?: boolean; // ハイブリッド検索を使用するかどうか
  hybridConfig?: {
    vectorWeight?: number;
    keywordWeight?: number;
    minScore?: number;
  };
};

export async function retrieveRelevantChunks<T>(deps: RetrieveDeps<T>): Promise<T[]> {
  const {
    query,
    topK,
    embed,
    similarity,
    loadAllChunks,
    getEmbeddingVector,
    useHybridSearch = false,
    hybridConfig = {},
  } = deps;

  const chunks = await loadAllChunks();

  if (useHybridSearch) {
    return await hybridRetrieve(query, topK, chunks, embed, similarity, getEmbeddingVector, hybridConfig);
  } else {
    return await vectorRetrieve(query, topK, chunks, embed, similarity, getEmbeddingVector);
  }
}

/**
 * ベクトル検索のみの実装（既存の実装）
 * @param {string} query 検索クエリ
 * @param {number} topK 取得するチャンク数
 * @param {T[]} chunks 検索対象のチャンク
 * @param {Function} embed 埋め込み関数
 * @param {Function} similarity 類似度計算関数
 * @param {Function} getEmbeddingVector チャンクから埋め込みベクトルを取得する関数
 * @return {Promise<T[]>} 関連チャンクの配列
 */
async function vectorRetrieve<T>(
  query: string,
  topK: number,
  chunks: T[],
  embed: (text: string) => Promise<number[]>,
  similarity: (a: number[], b: number[]) => number,
  getEmbeddingVector: (chunk: T) => number[],
): Promise<T[]> {
  const qvec = await embed(query);

  // 類似度を計算してスコアリング
  const scored = chunks.map((c) => ({ c, s: similarity(qvec, getEmbeddingVector(c)) }));

  // 類似度でソート
  scored.sort((a, b) => b.s - a.s);

  // 類似度が0.05以上のチャンクのみをフィルタリング
  const filtered = scored.filter((x) => x.s >= 0.05);

  // topK個を返す
  return filtered.slice(0, Math.max(0, topK)).map((x) => x.c);
}

/**
 * ハイブリッド検索の実装
 * @param {string} query 検索クエリ
 * @param {number} topK 取得するチャンク数
 * @param {T[]} chunks 検索対象のチャンク
 * @param {Function} embed 埋め込み関数
 * @param {Function} similarity 類似度計算関数
 * @param {Function} getEmbeddingVector チャンクから埋め込みベクトルを取得する関数
 * @param {Object} config ハイブリッド検索の設定
 * @return {Promise<T[]>} 関連チャンクの配列
 */
async function hybridRetrieve<T>(
  query: string,
  topK: number,
  chunks: T[],
  embed: (text: string) => Promise<number[]>,
  similarity: (a: number[], b: number[]) => number,
  getEmbeddingVector: (chunk: T) => number[],
  config: {
    vectorWeight?: number;
    keywordWeight?: number;
    minScore?: number;
  } = {},
): Promise<T[]> {
  // ハイブリッド検索用のチャンク形式に変換
  const hybridChunks = chunks.map((chunk) => ({
    id: (chunk as any).id || Math.random().toString(),
    text: (chunk as any).text || "",
    embedding: getEmbeddingVector(chunk),
    originalChunk: chunk,
  }));

  // ハイブリッド検索を実行
  const hybridRetriever = new HybridRetriever({
    vectorWeight: config.vectorWeight || 0.7,
    keywordWeight: config.keywordWeight || 0.3,
    minScore: config.minScore || 0.05,
  });

  const scoredChunks = await hybridRetriever.retrieve(
    query,
    hybridChunks,
    embed,
    similarity,
  );

  // topK個を返す（元のチャンク形式に戻す）
  return scoredChunks
    .slice(0, topK)
    .map((scored) => (scored.chunk as any).originalChunk);
}


