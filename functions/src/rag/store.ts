import admin from "firebase-admin";
import { DocChunk } from "./types";

// Initialize admin if not already initialized (safe for emulator and prod)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const COLLECTION = "chunks";

export type ChunkStore = {
  saveChunks: (chunks: DocChunk[]) => Promise<void>;
  loadAllChunks: () => Promise<DocChunk[]>;
};

export function createFirestoreChunkStore(): ChunkStore {
  return {
    async saveChunks(chunks: DocChunk[]): Promise<void> {
      const batch = db.batch();
      for (const ch of chunks) {
        const ref = db.collection(COLLECTION).doc(ch.id);
        batch.set(ref, ch);
      }
      await batch.commit();
    },
    async loadAllChunks(): Promise<DocChunk[]> {
      const snap = await db.collection(COLLECTION).get();
      return snap.docs.map((d) => d.data() as DocChunk);
    },
  };
}

