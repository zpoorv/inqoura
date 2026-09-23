/**
 * Spoken accessibility verdict synthesizer.
 * Generates natural language announcements for TalkBack and VoiceOver live regions.
 */

export interface VoiceVerdictInput {
  productName?: string;
  healthScore?: number | null;
  status?: 'safe' | 'caution' | 'danger';
  flaggedRestrictions?: string[];
  unmetMemberNames?: string[];
}

export function generateVoiceVerdict({
  productName = 'Product',
  healthScore,
  status = 'caution',
  flaggedRestrictions = [],
  unmetMemberNames = [],
}: VoiceVerdictInput): string {
  const parts: string[] = [];

  // 1. Primary Verdict Announcement
  if (status === 'danger' || unmetMemberNames.length > 0) {
    parts.push('Allergen Alert.');
  } else if (status === 'safe') {
    parts.push('Clean and safe pick.');
  } else {
    parts.push('Caution recommended.');
  }

  // 2. Product Name & Health Score
  if (healthScore != null && healthScore > 0) {
    parts.push(`${productName}, Health Score ${healthScore} out of 100.`);
  } else {
    parts.push(`${productName}.`);
  }

  // 3. Hazardous Restrictions / Conflicts
  if (flaggedRestrictions.length > 0) {
    const list = flaggedRestrictions.slice(0, 3).join(', ');
    parts.push(`Contains ${list}.`);
  }

  // 4. Household Compatibility
  if (unmetMemberNames.length > 0) {
    const members = unmetMemberNames.join(' and ');
    parts.push(`Unsafe for ${members}.`);
  } else if (status === 'safe') {
    parts.push('Compatible with all household dietary profiles.');
  }

  return parts.join(' ');
}
