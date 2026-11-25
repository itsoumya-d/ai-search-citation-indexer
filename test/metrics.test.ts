import { describe, it, expect } from "vitest";
import { MetricsCalculator } from "../src/metrics.js";
import { ExtractedCitation } from "../src/types.js";

describe("MetricsCalculator", () => {
  it("aggregates domain metrics and computes reciprocal rank score", () => {
    const batches = [
      {
        query: "query 1",
        citations: [
          {
            rawUrl: "https://site-a.com/page",
            canonicalUrl: "https://site-a.com/page",
            domain: "site-a.com",
            rankPosition: 1,
            sentiment: "positive" as const,
          },
          {
            rawUrl: "https://site-b.com/page",
            canonicalUrl: "https://site-b.com/page",
            domain: "site-b.com",
            rankPosition: 2,
            sentiment: "neutral" as const,
          },
        ],
      },
      {
        query: "query 2",
        citations: [
          {
            rawUrl: "https://site-a.com/another",
            canonicalUrl: "https://site-a.com/another",
            domain: "site-a.com",
            rankPosition: 2,
            sentiment: "positive" as const,
          },
        ],
      },
    ];

    const metrics = MetricsCalculator.aggregateDomainMetrics(batches);
    expect(metrics.size).toBe(2);

    const siteA = metrics.get("site-a.com")!;
    expect(siteA.totalOccurrences).toBe(2);
    expect(siteA.uniqueQueries).toBe(2);
    expect(siteA.averagePosition).toBe(1.5);
    // 1/1 + 1/2 = 1.5
    expect(siteA.reciprocalRankScore).toBe(1.5);
    expect(siteA.positiveMentions).toBe(2);

    const sov = MetricsCalculator.computeShareOfVoice(metrics, "site-a.com");
    // total score = 1.5 (site-a) + 0.5 (site-b) = 2.0. Share = 1.5/2.0 = 75%
    expect(sov.targetSharePct).toBe(75);
  });
});
