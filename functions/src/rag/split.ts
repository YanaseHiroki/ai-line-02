import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function splitText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400, // 800から400に変更してより細かい分割
    chunkOverlap: 80, // 120から80に変更
    separators: ["\n\n", "\n", "。", "、", " ", "：", "（", "）", "【", "】"], // より多くの区切り文字を追加
  });
  const docs = await splitter.createDocuments([text]);
  return docs.map((d) => d.pageContent);
}

