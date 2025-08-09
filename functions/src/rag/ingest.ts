import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { v4 as uuidv4 } from "uuid";
import { splitText } from "./split";
import { createGeminiEmbedder } from "./embed";
import { createFirestoreChunkStore } from "./store";
import { DocChunk } from "./types";

export async function ingestPdfFile(filePath: string, source?: string): Promise<number> {
  const abs = path.resolve(filePath);
  const buf = fs.readFileSync(abs);
  const data = await pdf(buf);
  const chunks = await splitText(data.text || "");
  const apiKey = process.env.GENAI_API_KEY;
  if (!apiKey) throw new Error("GENAI_API_KEY is not set");
  const embed = createGeminiEmbedder(apiKey);
  const store = createFirestoreChunkStore();
  const toSave: DocChunk[] = [];
  let pageCounter = 1;
  for (const t of chunks) {
    const embedding = await embed(t);
    toSave.push({ id: uuidv4(), text: t, embedding, source: source ?? path.basename(abs), page: pageCounter++ });
  }
  await store.saveChunks(toSave);
  return toSave.length;
}

// CLI usage: tsx src/rag/ingest.ts ./path/to/file.pdf
if (require.main === module) {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error("Usage: tsx src/rag/ingest.ts <pdfPath>");
    process.exit(1);
  }
  ingestPdfFile(pdfPath)
    .then((n) => {
      console.log(`Ingested ${n} chunks`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

