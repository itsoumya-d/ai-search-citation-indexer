# AI Search Citation Indexer

High-throughput generative engine citation extractor and paragraph-level embedding indexer for Generative Engine Optimization (GEO) pipelines.

## Capabilities
- Ingests LLM search answers (ChatGPT, Perplexity, Claude, Gemini).
- Extracts cited URLs, anchor domains, rank positions, and sentiment/grounding signals.
- Computes aggregate domain citation share and positional weighting across query clusters.
- In-memory paragraph embedding similarity reranking using normalized cosine distance.

## Testing & Build
```bash
npm install
npm run build
npm test
```
