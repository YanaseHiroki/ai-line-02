import { GoogleGenerativeAI } from "@google/generative-ai";

export function buildAnswerer() {
  return async (query: string): Promise<string> => {
    const apiKey = process.env.GENAI_API_KEY;
    if (!apiKey) {
      return "現在サービスが混雑しています。しばらくしてからお試しください。";
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(query);
    const text = result.response.text();
    return text || "回答を生成できませんでした。";
  };
}


