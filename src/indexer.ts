import { ParagraphChunk, RetrievalMatch } from "./types.js";

export class ParagraphIndex {
  private chunks: Map<string, ParagraphChunk> = new Map();

  public add(chunk: ParagraphChunk): void {
    this.chunks.set(chunk.id, chunk);
  }

  public addBatch(chunks: ParagraphChunk[]): void {
    for (const chunk of chunks) {
      this.add(chunk);
    }
  }

  public size(): number {
    return this.chunks.size;
  }

  /**
   * Computes dot product normalized cosine similarity between two vector embeddings.
   */
  public static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 0;
    return dot / denom;
  }

  /**
   * Reranks and retrieves top-k chunks matching a query embedding.
   */
  public search(
    queryEmbedding: number[],
    topK = 5,
    minThreshold = 0.0,
    citedUrls: string[] = []
  ): RetrievalMatch[] {
    const citedSet = new Set(citedUrls.map((u) => u.toLowerCase().trim()));
    const scored: RetrievalMatch[] = [];

    for (const chunk of this.chunks.values()) {
      const rawSim = ParagraphIndex.cosineSimilarity(queryEmbedding, chunk.embedding);
      if (rawSim >= minThreshold) {
        const isCited = citedSet.has(chunk.url.toLowerCase().trim());
        // Apply 20% grounding boost if the chunk URL is explicitly cited by an engine
        const finalScore = isCited ? Math.min(1.0, rawSim * 1.2) : rawSim;

        scored.push({
          chunkId: chunk.id,
          url: chunk.url,
          title: chunk.title,
          score: Number(finalScore.toFixed(4)),
          text: chunk.text,
          isDirectCitationMatch: isCited,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}
