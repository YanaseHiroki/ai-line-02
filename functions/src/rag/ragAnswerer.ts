import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveRelevantChunks } from "./retriever";
import { createFirestoreChunkStore } from "./store";

export function buildRagAnswerer(opts: {
  getApiKey: () => string | undefined;
  topK?: number;
  // test overrides
  embedFn?: (text: string) => Promise<number[]>;
  loadAllChunksFn?: () => Promise<{ id: string; text: string; embedding: number[] }[]>;
  generateFn?: (prompt: string) => Promise<string>;
}) {
  const topK = opts.topK ?? 4;
  return async (query: string): Promise<string> => {
    const apiKey = opts.getApiKey();
    if (!apiKey) return "現在サービスが混雑しています。しばらくしてからお試しください。";

    const embed = opts.embedFn ?? (async (text: string) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const em = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const r = await em.embedContent(text);
      return r.embedding.values as number[];
    });
    const loadAll = opts.loadAllChunksFn ?? createFirestoreChunkStore().loadAllChunks;

    const relevant = await retrieveRelevantChunks({
      query,
      topK,
      embed,
      similarity: (a, b) => {
        const dot = a.reduce((s, v, i) => s + v * b[i], 0);
        const na = Math.hypot(...a);
        const nb = Math.hypot(...b);
        return dot / (na * nb);
      },
      loadAllChunks: loadAll,
      getEmbeddingVector: (c) => c.embedding,
    });

    const context = relevant.map((c, i) => `【${i + 1}】${c.text}`).join("\n\n");
    const prompt = `あなたは有能なサポート担当です。以下のコンテキストに基づき、ユーザーの質問に日本語で簡潔かつ正確に回答してください。

コンテキストが限られている場合でも、一般的な知識に基づいて回答してください。コンテキストに含まれる情報がある場合はそれを優先し、ない場合は一般的な知識で補完してください。

コンテキスト:
${context}

質問:${query}`;

    const generate = opts.generateFn ?? (async (p: string) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const res = await model.generateContent(p);
      return res.response.text();
    });

    const answer = await generate(prompt);
    return answer || "回答を生成できませんでした。";
  };
}

