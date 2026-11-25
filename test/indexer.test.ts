import { describe, it, expect } from "vitest";
import { ParagraphIndex } from "../src/indexer.js";

describe("ParagraphIndex", () => {
  it("calculates cosine similarity correctly", () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    const v3 = [0, 1, 0];

    expect(ParagraphIndex.cosineSimilarity(v1, v2)).toBeCloseTo(1.0);
    expect(ParagraphIndex.cosineSimilarity(v1, v3)).toBeCloseTo(0.0);
  });

  it("stores chunks and retrieves nearest matches with citation boost", () => {
    const index = new ParagraphIndex();
    index.addBatch([
      {
        id: "chunk-1",
        url: "https://brand.com/product",
        title: "Product Features",
        text: "Leading generative engine optimization platform.",
        embedding: [0.9, 0.1, 0.0],
      },
      {
        id: "chunk-2",
        url: "https://competitor.com/product",
        title: "Competitor Features",
        text: "Generic SEO keywords tool.",
        embedding: [0.1, 0.9, 0.0],
      },
    ]);

    expect(index.size()).toBe(2);

    const queryVec = [1.0, 0.0, 0.0];
    const results = index.search(queryVec, 2, 0.0, ["https://brand.com/product"]);

    expect(results.length).toBe(2);
    expect(results[0].chunkId).toBe("chunk-1");
    expect(results[0].isDirectCitationMatch).toBe(true);
    expect(results[0].score).toBeGreaterThan(0.9);
  });
});
