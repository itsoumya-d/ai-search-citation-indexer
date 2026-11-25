import { DomainCitationMetric, ExtractedCitation } from "./types.js";

export class MetricsCalculator {
  /**
   * Aggregates citation performance for all domains observed across multiple query runs.
   */
  public static aggregateDomainMetrics(
    queryCitationBatches: Array<{ query: string; citations: ExtractedCitation[] }>
  ): Map<string, DomainCitationMetric> {
    const domainStats = new Map<
      string,
      {
        totalOccurrences: number;
        queries: Set<string>;
        positionSum: number;
        reciprocalRankSum: number;
        positiveMentions: number;
        neutralMentions: number;
        negativeMentions: number;
      }
    >();

    for (const batch of queryCitationBatches) {
      const domainsInBatch = new Set<string>();

      for (const citation of batch.citations) {
        const domain = citation.domain;
        if (!domainStats.has(domain)) {
          domainStats.set(domain, {
            totalOccurrences: 0,
            queries: new Set(),
            positionSum: 0,
            reciprocalRankSum: 0,
            positiveMentions: 0,
            neutralMentions: 0,
            negativeMentions: 0,
          });
        }

        const stat = domainStats.get(domain)!;
        stat.totalOccurrences += 1;
        domainsInBatch.add(domain);
        stat.positionSum += citation.rankPosition;
        stat.reciprocalRankSum += 1 / citation.rankPosition;

        if (citation.sentiment === "positive") stat.positiveMentions += 1;
        else if (citation.sentiment === "negative") stat.negativeMentions += 1;
        else stat.neutralMentions += 1;
      }

      for (const domain of domainsInBatch) {
        domainStats.get(domain)!.queries.add(batch.query);
      }
    }

    const result = new Map<string, DomainCitationMetric>();
    for (const [domain, stat] of domainStats.entries()) {
      result.set(domain, {
        domain,
        totalOccurrences: stat.totalOccurrences,
        uniqueQueries: stat.queries.size,
        averagePosition: Number((stat.positionSum / stat.totalOccurrences).toFixed(2)),
        reciprocalRankScore: Number(stat.reciprocalRankSum.toFixed(4)),
        positiveMentions: stat.positiveMentions,
        neutralMentions: stat.neutralMentions,
        negativeMentions: stat.negativeMentions,
      });
    }

    return result;
  }

  /**
   * Computes comparative visibility score for a target domain vs competitors.
   */
  public static computeShareOfVoice(
    metrics: Map<string, DomainCitationMetric>,
    targetDomain: string
  ): { targetSharePct: number; topCompetitors: DomainCitationMetric[] } {
    let totalScore = 0;
    let targetScore = 0;

    const list = Array.from(metrics.values()).sort(
      (a, b) => b.reciprocalRankScore - a.reciprocalRankScore
    );

    for (const m of list) {
      totalScore += m.reciprocalRankScore;
      if (m.domain === targetDomain) {
        targetScore = m.reciprocalRankScore;
      }
    }

    const targetSharePct =
      totalScore > 0 ? Number(((targetScore / totalScore) * 100).toFixed(2)) : 0;

    return {
      targetSharePct,
      topCompetitors: list.slice(0, 5),
    };
  }
}
