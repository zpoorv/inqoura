import type { ScanHistoryEntry } from '../services/scanHistoryStorage';

export type HistoryInsight = {
  body: string;
  id: string;
  tone: 'good' | 'neutral' | 'warning';
  title: string;
};

type BuildHistoryInsightsOptions = {
  includePremiumPatterns?: boolean;
};

function getStartOfWeek(date = new Date()) {
  const nextDate = new Date(date);
  const currentDay = nextDate.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  nextDate.setDate(nextDate.getDate() + mondayOffset);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function buildBasicInsights(historyEntries: ScanHistoryEntry[]) {
  const insights: HistoryInsight[] = [];
  const highestScoreEntry = historyEntries.find(
    (entry) => typeof entry.score === 'number' && entry.score >= 80
  );
  const lowestScoreEntry = historyEntries.find(
    (entry) => typeof entry.score === 'number' && entry.score < 50
  );
  const repeatEntry = [...historyEntries]
    .filter((entry) => entry.scanCount >= 2)
    .sort((left, right) => right.scanCount - left.scanCount)[0];

  if (highestScoreEntry) {
    insights.push({
      body: 'This was one of your stronger recent picks for regular use.',
      id: 'best-recent-choice',
      title: `Best recent pick: ${highestScoreEntry.name}`,
      tone: 'good',
    });
  }

  if (lowestScoreEntry) {
    insights.push({
      body: 'This one may be better as an occasional buy rather than a repeat habit.',
      id: 'reconsider-choice',
      title: `Item to reconsider: ${lowestScoreEntry.name}`,
      tone: 'warning',
    });
  }

  if (repeatEntry) {
    insights.push({
      body: `You came back to this ${repeatEntry.scanCount} times, so it may be worth comparing alternatives once.`,
      id: 'repeat-choice',
      title: `Frequent repeat: ${repeatEntry.name}`,
      tone:
        typeof repeatEntry.score === 'number' && repeatEntry.score >= 70
          ? 'good'
          : 'neutral',
    });
  }

  if (insights.length === 0) {
    insights.push({
      body: 'Your saved scans are building up. The more you scan, the more useful this becomes.',
      id: 'build-history',
      title: 'No strong pattern yet',
      tone: 'neutral',
    });
  }

  return insights;
}

function buildPremiumPatternInsights(historyEntries: ScanHistoryEntry[]) {
  const weekStart = getStartOfWeek();
  const weeklyEntries = historyEntries.filter(
    (entry) => new Date(entry.scannedAt).getTime() >= weekStart.getTime()
  );
  const harmfulCount = weeklyEntries.filter(
    (entry) => entry.riskLevel === 'high-risk'
  ).length;
  const strongPickCount = weeklyEntries.filter(
    (entry) => typeof entry.score === 'number' && entry.score >= 80
  ).length;
  const lowScoreCount = weeklyEntries.filter(
    (entry) => typeof entry.score === 'number' && entry.score < 50
  ).length;

  const insights: HistoryInsight[] = [];

  if (harmfulCount > 0) {
    insights.push({
      body:
        harmfulCount === 1
          ? 'One scan this week landed in the stronger warning zone.'
          : `${harmfulCount} scans this week landed in the stronger warning zone.`,
      id: 'harmful-week',
      title: `You scanned ${harmfulCount} higher-risk product${harmfulCount > 1 ? 's' : ''} this week`,
      tone: 'warning',
    });
  }

  if (strongPickCount >= 3) {
    insights.push({
      body: 'That is a solid streak of higher-scoring products in your recent scans.',
      id: 'strong-week',
      title: `${strongPickCount} strong picks showed up this week`,
      tone: 'good',
    });
  }

  if (lowScoreCount >= 2) {
    insights.push({
      body: 'Try simpler ingredient lists or lower-sodium options on your next trip.',
      id: 'low-score-week',
      title: `${lowScoreCount} recent scans were not ideal for frequent use`,
      tone: 'warning',
    });
  }

  return insights;
}

export function buildHistoryInsights(
  historyEntries: ScanHistoryEntry[],
  options: BuildHistoryInsightsOptions = {}
) {
  if (historyEntries.length === 0) {
    return [] as HistoryInsight[];
  }

  const basicInsights = buildBasicInsights(historyEntries);

  if (!options.includePremiumPatterns) {
    return basicInsights.slice(0, 3);
  }

  return [...basicInsights, ...buildPremiumPatternInsights(historyEntries)].slice(
    0,
    4
  );
}
