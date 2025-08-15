export type RetrieveDeps<T> = {
  query: string;
  topK: number;
  embed: (text: string) => Promise<number[]>;
  similarity: (a: number[], b: number[]) => number;
  loadAllChunks: () => Promise<T[]>;
  getEmbeddingVector: (chunk: T) => number[];
};

export async function retrieveRelevantChunks<T>(deps: RetrieveDeps<T>): Promise<T[]> {
  const { query, topK, embed, similarity, loadAllChunks, getEmbeddingVector } = deps;
  const qvec = await embed(query);
  const chunks = await loadAllChunks();

  // 類似度を計算してスコアリング
  const scored = chunks.map((c) => ({ c, s: similarity(qvec, getEmbeddingVector(c)) }));

  // 類似度でソート
  scored.sort((a, b) => b.s - a.s);

  // 類似度が0.1以上のチャンクのみをフィルタリング（閾値を戻してパフォーマンスを改善）
  const filtered = scored.filter((x) => x.s >= 0.1);

  // topK個を返す（フィルタリング後の結果がtopK未満の場合は全て返す）
  return filtered.slice(0, Math.max(0, topK)).map((x) => x.c);
}


