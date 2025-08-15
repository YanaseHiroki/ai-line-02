import fs from "fs";
import path from "path";
import { splitMarkdownByFineGrained } from "./markdownSplitter";

export type DocChunk = {
  text: string;
  embedding: number[];
};

type Opts = {
  embedFn?: (text: string) => Promise<number[]>;
  saveChunks?: (chunks: DocChunk[]) => Promise<void>;
  maxChunkSize?: number;
};

export async function ingestMarkdownFile(filePath: string, opts: Opts = {}): Promise<number> {
  const abs = path.resolve(filePath);
  const text = fs.readFileSync(abs, "utf8");

  // 細かい粒度の分割を使用（###レベルで分割）
  const chunks = splitMarkdownByFineGrained(text, opts.maxChunkSize ?? 1500);
  if (chunks.length === 0) return 0;

  const embedFn = opts.embedFn ?? defaultEmbedFn;
  const saveChunks = opts.saveChunks ?? defaultSaveChunks;

  const docChunks: DocChunk[] = [];

  for (const chunk of chunks) {
    const embedding = await embedFn(chunk);
    docChunks.push({ text: chunk, embedding });
  }

  await saveChunks(docChunks);
  return docChunks.length;
}

async function defaultEmbedFn(): Promise<number[]> {
  // デフォルトの埋め込み関数（実際の実装ではGemini Embeddingsを使用）
  return new Array(768).fill(0).map(() => Math.random() - 0.5);
}

async function defaultSaveChunks(chunks: DocChunk[]): Promise<void> {
  // デフォルトの保存関数（実際の実装ではFirestoreに保存）
  console.log(`Saving ${chunks.length} chunks to store`);
  for (const chunk of chunks) {
    console.log(`Chunk (${chunk.text.length} chars): ${chunk.text.substring(0, 100)}...`);
  }
}

// CLI usage: tsx src/rag/ingestMarkdown.ts ./path/to/file.md
if (require.main === module) {
  const mdPath = process.argv[2];
  if (!mdPath) {
    console.error("Usage: tsx src/rag/ingestMarkdown.ts <mdPath>");
    process.exit(1);
  }
  ingestMarkdownFile(mdPath)
    .then((n) => {
      console.log(`Ingested ${n} chunks`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}


