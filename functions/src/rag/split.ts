import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function splitText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
    separators: ["\n\n", "\n", "。", "、", " "],
  });
  const docs = await splitter.createDocuments([text]);
  return docs.map((d) => d.pageContent);
}



