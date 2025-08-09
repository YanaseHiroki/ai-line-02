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
  const scored = chunks.map((c) => ({ c, s: similarity(qvec, getEmbeddingVector(c)) }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, Math.max(0, topK)).map((x) => x.c);
}


