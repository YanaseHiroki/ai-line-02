import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveRelevantChunks } from "./retriever";
import { createFirestoreChunkStore } from "./store";

const MAX_ANSWER_LENGTH = 500;

export function buildRagAnswerer(opts: {
  getApiKey: () => string | undefined;
  topK?: number;
  // test overrides
  embedFn?: (text: string) => Promise<number[]>;
  loadAllChunksFn?: () => Promise<{ id: string; text: string; embedding: number[] }[]>;
  generateFn?: (prompt: string) => Promise<string>;
}) {
  const topK = opts.topK ?? 4; // 6から4に戻してパフォーマンスを改善
  return async (query: string): Promise<string> => {
    const startTime = Date.now();
    const apiKey = opts.getApiKey();
    if (!apiKey) return "現在サービスが混雑しています。しばらくしてからお試しください。";

    // 埋め込み処理の時間計測
    const embedStart = Date.now();
    const embed = opts.embedFn ?? (async (text: string) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const em = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const r = await em.embedContent(text);
      return r.embedding.values as number[];
    });
    const qvec = await embed(query);
    const embedTime = Date.now() - embedStart;
    console.log(`Embedding time: ${embedTime}ms`);

    // チャンク読み込みの時間計測
    const loadStart = Date.now();
    const loadAll = opts.loadAllChunksFn ?? createFirestoreChunkStore().loadAllChunks;
    const chunks = await loadAll();
    const loadTime = Date.now() - loadStart;
    console.log(`Load chunks time: ${loadTime}ms (${chunks.length} chunks)`);

    // 検索処理の時間計測
    const retrievalStart = Date.now();
    const relevant = await retrieveRelevantChunks({
      query,
      topK,
      embed: async () => qvec, // 既に計算済みの埋め込みを使用
      similarity: (a, b) => {
        const dot = a.reduce((s, v, i) => s + v * b[i], 0);
        const na = Math.hypot(...a);
        const nb = Math.hypot(...b);
        return dot / (na * nb);
      },
      loadAllChunks: async () => chunks, // 既に読み込み済みのチャンクを使用
      getEmbeddingVector: (c) => c.embedding,
    });
    const retrievalTime = Date.now() - retrievalStart;
    console.log(`Retrieval time: ${retrievalTime}ms (retrieved ${relevant.length} chunks)`);

    const context = relevant.map((c, i) => `【${i + 1}】${c.text}`).join("\n\n");

    // プロンプトを改善してより明確な指示を追加
    const prompt = `あなたは有能なサポート担当です。ユーザーの質問に日本語で正確に回答してください。

回答内容：
・もし質問がコンテキストに関連する内容であれば、コンテキストの内容に基づいて回答してください。
・コンテキストと関係ない質問に対しても回答してください。
・コンテキストの内容を最大限活用して、具体的で実用的な回答を提供してください。

注意点：
・資料に基づく回答かどうかについて言及せず回答内容だけを返す。
・資料に基づく回答の場合でも、資料のどこに書いてあるかに言及せず回答内容だけを返す。
・コンテキストの内容を自然に組み合わせて、包括的な回答を作成してください。

不要な記述例：
・資料にはーーの内容はありませんが
・資料にはーーに関する具体的な記述はありませんが
・ーーは、今回の資料からは直接読み取れません

回答は最大${MAX_ANSWER_LENGTH}文字以内で簡潔にしてください。

コンテキスト:
${context}

質問:${query}`;

    // LLM生成の時間計測
    const generateStart = Date.now();
    const generate = opts.generateFn ?? (async (p: string) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const res = await model.generateContent(p);
      return res.response.text();
    });

    const answer = await generate(prompt);
    const generateTime = Date.now() - generateStart;
    console.log(`LLM generation time: ${generateTime}ms`);

    if (!answer) return "回答を生成できませんでした。";

    // 500文字より長い場合、499文字に切り詰めて「…」を追加
    if (answer.length > MAX_ANSWER_LENGTH) {
      return answer.slice(0, MAX_ANSWER_LENGTH - 1) + "…";
    }

    const totalTime = Date.now() - startTime;
    console.log(`Total RAG time: ${totalTime}ms`);

    // 最も遅いステップを特定
    const times = [
      { name: "Embedding", time: embedTime },
      { name: "Load chunks", time: loadTime },
      { name: "Retrieval", time: retrievalTime },
      { name: "LLM generation", time: generateTime },
    ];
    const slowest = times.reduce((a, b) => a.time > b.time ? a : b);
    console.log(`Slowest step: ${slowest.name} (${slowest.time}ms)`);

    return answer;
  };
}

