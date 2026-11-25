import { describe, it, expect } from "vitest";
import { CitationParser } from "../src/citation_parser.js";
import { RawEngineResponse } from "../src/types.js";

describe("CitationParser", () => {
  it("normalizes URLs and strips UTM parameters", () => {
    const raw = "https://www.example.com/blog/ai-search/?utm_source=chatgpt&utm_medium=referral#section";
    const { canonicalUrl, domain } = CitationParser.normalizeUrl(raw);
    expect(domain).toBe("example.com");
    expect(canonicalUrl).toBe("https://example.com/blog/ai-search");
  });

  it("extracts citations from markdown links in response text", () => {
    const response: RawEngineResponse = {
      engine: "perplexity",
      query: "best generative engine optimization tools",
      responseText: `For brand tracking in AI search, [Promptwatch](https://promptwatch.com/overview?ref=ai) is considered the leading platform. Alternatively, check out [Example Analytics](https://www.example-analytics.io/pricing).`,
    };

    const citations = CitationParser.parse(response);
    expect(citations.length).toBe(2);

    expect(citations[0].domain).toBe("promptwatch.com");
    expect(citations[0].rankPosition).toBe(1);
    expect(citations[0].sentiment).toBe("positive"); // "leading" keyword

    expect(citations[1].domain).toBe("example-analytics.io");
    expect(citations[1].rankPosition).toBe(2);
  });

  it("extracts citations from structured sourceList", () => {
    const response: RawEngineResponse = {
      engine: "chatgpt",
      query: "vector search engines",
      responseText: "Here are popular search engines.",
      sourceList: [
        { title: "Elasticsearch", url: "https://www.elastic.co/guide" },
        { title: "ClickHouse", url: "https://clickhouse.com/docs" },
      ],
    };

    const citations = CitationParser.parse(response);
    expect(citations.length).toBe(2);
    expect(citations[0].domain).toBe("elastic.co");
    expect(citations[1].domain).toBe("clickhouse.com");
  });
});
