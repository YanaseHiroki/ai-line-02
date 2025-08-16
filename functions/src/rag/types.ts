export type DocChunk = {
  id: string;
  text: string;
  embedding: number[];
  source?: string;
  page?: number;
};

export type Chunk = {
  id: string;
  text: string;
  embedding: number[];
};

