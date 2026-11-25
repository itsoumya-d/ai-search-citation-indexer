import { ExtractedCitation, RawEngineResponse, SentimentCategory } from "./types.js";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "gclid",
  "fbclid",
  "_ga",
]);

const POSITIVE_TERMS = ["best", "recommended", "leading", "top", "excellent", "great", "superior", "preferred"];
const NEGATIVE_TERMS = ["avoid", "worst", "poor", "issue", "bug", "broken", "inferior", "problem", "warning"];

export class CitationParser {
  /**
   * Normalizes a raw URL by stripping tracking params, trailing slashes, and lowercasing domain.
   */
  public static normalizeUrl(rawUrl: string): { canonicalUrl: string; domain: string } {
    try {
      const parsed = new URL(rawUrl.trim());
      let domain = parsed.hostname.toLowerCase();
      if (domain.startsWith("www.")) {
        domain = domain.slice(4);
      }
      parsed.hostname = domain;

      // Strip tracking params
      for (const param of Array.from(parsed.searchParams.keys())) {
        if (TRACKING_PARAMS.has(param.toLowerCase())) {
          parsed.searchParams.delete(param);
        }
      }

      // Normalize pathname
      let pathname = parsed.pathname;
      if (pathname.length > 1 && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
      }
      parsed.pathname = pathname;

      // Drop hash
      parsed.hash = "";

      return {
        canonicalUrl: parsed.toString(),
        domain,
      };
    } catch {
      const cleaned = rawUrl.trim().toLowerCase().replace(/^https?:\/\//, "");
      const domain = cleaned.split("/")[0].replace(/^www\./, "");
      return {
        canonicalUrl: rawUrl.trim(),
        domain,
      };
    }
  }

  /**
   * Classifies sentiment of snippet around citation.
   */
  public static classifySentiment(text: string): SentimentCategory {
    const lower = text.toLowerCase();
    let posCount = 0;
    let negCount = 0;

    for (const term of POSITIVE_TERMS) {
      if (lower.includes(term)) posCount++;
    }
    for (const term of NEGATIVE_TERMS) {
      if (lower.includes(term)) negCount++;
    }

    if (posCount > negCount) return "positive";
    if (negCount > posCount) return "negative";
    return "neutral";
  }

  /**
   * Extracts and normalizes all citations from an engine response.
   */
  public static parse(response: RawEngineResponse): ExtractedCitation[] {
    const rawMatches: Array<{ rawUrl: string; title?: string; index: number; snippet?: string }> = [];

    // 1. Check explicit source list
    if (response.sourceList && response.sourceList.length > 0) {
      for (let i = 0; i < response.sourceList.length; i++) {
        const item = response.sourceList[i];
        if (item.url) {
          rawMatches.push({
            rawUrl: item.url,
            title: item.title,
            index: i,
          });
        }
      }
    }

    // 2. Parse Markdown links [Title](https://...)
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = mdLinkRegex.exec(response.responseText)) !== null) {
      const title = match[1];
      const url = match[2];
      const matchIndex = match.index;
      const start = Math.max(0, matchIndex - 60);
      const end = Math.min(response.responseText.length, matchIndex + match[0].length + 60);
      const snippet = response.responseText.slice(start, end).replace(/\s+/g, " ").trim();

      rawMatches.push({
        rawUrl: url,
        title,
        index: matchIndex,
        snippet,
      });
    }

    // 3. Parse bare URLs (https?://...)
    const bareUrlRegex = /(?<!\()(https?:\/\/[^\s\)<>"]+)/g;
    while ((match = bareUrlRegex.exec(response.responseText)) !== null) {
      const url = match[1];
      const matchIndex = match.index;
      const alreadyCaptured = rawMatches.some((m) => Math.abs(m.index - matchIndex) < 5);
      if (!alreadyCaptured) {
        const start = Math.max(0, matchIndex - 60);
        const end = Math.min(response.responseText.length, matchIndex + url.length + 60);
        const snippet = response.responseText.slice(start, end).replace(/\s+/g, " ").trim();

        rawMatches.push({
          rawUrl: url,
          index: matchIndex,
          snippet,
        });
      }
    }

    // Deduplicate by canonicalUrl preserving order of appearance
    const seen = new Map<string, ExtractedCitation>();
    let currentRank = 1;

    rawMatches.sort((a, b) => a.index - b.index);

    for (const m of rawMatches) {
      const { canonicalUrl, domain } = CitationParser.normalizeUrl(m.rawUrl);
      if (!seen.has(canonicalUrl)) {
        const sentiment = m.snippet ? CitationParser.classifySentiment(m.snippet) : "neutral";
        seen.set(canonicalUrl, {
          rawUrl: m.rawUrl,
          canonicalUrl,
          domain,
          title: m.title,
          rankPosition: currentRank++,
          snippet: m.snippet,
          sentiment,
        });
      }
    }

    return Array.from(seen.values());
  }
}
