import type { ComparisonSessionEntry } from '../models/comparisonSession';
import { buildResultAnalysis } from './resultAnalysis';

export type ShelfComparisonRow = {
  barcode: string;
  confidence: string;
  decisionSummary: string;
  decisionVerdict: string;
  name: string;
  score: number | null;
  topConcern: string | null;
};

export type ShelfComparisonSummary = {
  bestFallbackBarcode: string | null;
  bestForRegularUseBarcode: string | null;
  rows: ShelfComparisonRow[];
  whyThisWins: string;
};

const DECISION_PRIORITY: Record<ShelfComparisonRow['decisionVerdict'], number> = {
  'good-regular-pick': 3,
  'okay-occasionally': 2,
  'not-ideal-often': 1,
  'need-better-data': 0,
};

function toDisplayConfidence(value: ShelfComparisonRow['confidence']) {
  switch (value) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Partial data';
    default:
      return 'Needs review';
  }
}

function rankRows(rows: ShelfComparisonRow[]) {
  return [...rows].sort((left, right) => {
    const verdictGap =
      DECISION_PRIORITY[right.decisionVerdict] - DECISION_PRIORITY[left.decisionVerdict];

    if (verdictGap !== 0) {
      return verdictGap;
    }

    return (right.score ?? -1) - (left.score ?? -1);
  });
}

export function buildShelfComparisonSummary(
  entries: ComparisonSessionEntry[]
): ShelfComparisonSummary {
  const rows = entries.map((entry) => {
    const analysis = buildResultAnalysis(entry.product, entry.profileId);

    return {
      barcode: entry.barcode,
      confidence: analysis.confidence,
      decisionSummary: analysis.decisionSummary,
      decisionVerdict: analysis.decisionVerdict,
      name: entry.name,
      score: analysis.insights.smartScore,
      topConcern: analysis.topConcern,
    } satisfies ShelfComparisonRow;
  });

  const rankedRows = rankRows(rows);
  const bestForRegularUse = rankedRows[0] ?? null;
  const bestFallback = rankedRows.find(
    (row) =>
      row.barcode !== bestForRegularUse?.barcode &&
      row.decisionVerdict !== 'need-better-data'
  );

  const whyThisWins = bestForRegularUse
    ? bestForRegularUse.topConcern
      ? `${bestForRegularUse.name} leads because it avoids the stronger issue around ${bestForRegularUse.topConcern.toLowerCase()}.`
      : `${bestForRegularUse.name} leads because it is the cleanest regular-use pick in this group.`
    : 'Scan a few products in the same shelf to get a clearer comparison.';

  return {
    bestFallbackBarcode: bestFallback?.barcode ?? null,
    bestForRegularUseBarcode: bestForRegularUse?.barcode ?? null,
    rows: rankedRows.map((row) => ({
      ...row,
      confidence: toDisplayConfidence(row.confidence),
    })),
    whyThisWins,
  };
}
