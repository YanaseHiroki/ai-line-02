import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { splitText } from "./split";
import { createFirestoreChunkStore } from "./store";
import { createGeminiEmbedder } from "./embed";
import { DocChunk } from "./types";

type Opts = {
  embedFn?: (text: string) => Promise<number[]>;
  saveChunks?: (chunks: DocChunk[]) => Promise<void>;
};

export async function ingestMarkdownFile(filePath: string, opts: Opts = {}): Promise<number> {
  const abs = path.resolve(filePath);
  const text = fs.readFileSync(abs, "utf8");
  const chunks = await splitText(text);
  if (chunks.length === 0) return 0;

  const embed = opts.embedFn ?? createGeminiEmbedder(process.env.GENAI_API_KEY ?? "");
  const save = opts.saveChunks ?? createFirestoreChunkStore().saveChunks;

  const toSave: DocChunk[] = [];
  for (const t of chunks) {
    const embedding = await embed(t);
    toSave.push({ id: uuidv4(), text: t, embedding, source: path.basename(abs) });
  }
  await save(toSave);
  return toSave.length;
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


