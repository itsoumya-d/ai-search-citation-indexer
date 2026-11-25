export type EngineType =
  | "chatgpt"
  | "perplexity"
  | "claude"
  | "gemini"
  | "google_ai_overview";

export interface RawEngineResponse {
  engine: EngineType;
  query: string;
  responseText: string;
  sourceList?: Array<{
    title?: string;
    url: string;
  }>;
  timestamp?: string;
}

export type SentimentCategory = "positive" | "neutral" | "negative";

export interface ExtractedCitation {
  rawUrl: string;
  canonicalUrl: string;
  domain: string;
  title?: string;
  rankPosition: number;
  snippet?: string;
  sentiment: SentimentCategory;
}

export interface DomainCitationMetric {
  domain: string;
  totalOccurrences: number;
  uniqueQueries: number;
  averagePosition: number;
  reciprocalRankScore: number;
  positiveMentions: number;
  neutralMentions: number;
  negativeMentions: number;
}

export interface ParagraphChunk {
  id: string;
  url: string;
  title: string;
  text: string;
  embedding: number[];
}

export interface RetrievalMatch {
  chunkId: string;
  url: string;
  title: string;
  score: number;
  text: string;
  isDirectCitationMatch: boolean;
}
