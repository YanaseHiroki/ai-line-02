import { describe, it, expect } from 'vitest';
import { retrieveRelevantChunks } from '../src/rag/retriever';

type Chunk = { id: string; text: string; embedding: number[] };

const fakeEmbed = async (text: string): Promise<number[]> => {
  if (text.includes('営業時間')) return [1, 0];
  if (text.includes('所在地')) return [0, 1];
  return [0.5, 0.5];
};

const cosine = (a: number[], b: number[]) => {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.hypot(...a);
  const nb = Math.hypot(...b);
  return dot / (na * nb);
};

describe('retrieveRelevantChunks', () => {
  it('営業時間の質問で営業時間チャンクが上位になる', async () => {
    const chunks: Chunk[] = [
      { id: 'c1', text: '当店の営業時間は9:00-18:00です。', embedding: [1, 0] },
      { id: 'c2', text: '当店の所在地は東京都渋谷区です。', embedding: [0, 1] },
    ];

    const result = await retrieveRelevantChunks<Chunk>({
      query: '営業時間は？',
      topK: 1,
      embed: fakeEmbed,
      similarity: cosine,
      loadAllChunks: async () => chunks,
      getEmbeddingVector: (c) => c.embedding,
    });

    expect(result[0].id).toBe('c1');
  });
});


