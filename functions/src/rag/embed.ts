import { GoogleGenerativeAI } from "@google/generative-ai";

export function createGeminiEmbedder(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  return async (text: string): Promise<number[]> => {
    const res = await model.embedContent(text);
    return res.embedding.values as number[];
  };
}



