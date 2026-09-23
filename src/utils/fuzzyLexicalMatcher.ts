/**
 * Levenshtein fuzzy lexical matcher for OCR text correction.
 * Mitigates misspellings, optical artifacts, and smudged ink on packaging labels.
 */

export interface FuzzyMatchResult {
  isMatch: boolean;
  matchedKeyword: string;
  sourceToken: string;
  distance: number;
  similarity: number;
}

/**
 * Computes standard Levenshtein edit distance between two strings.
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const dp: number[][] = Array.from({ length: s1.length + 1 }, () =>
    new Array(s2.length + 1).fill(0)
  );

  for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
  for (let j = 0; j <= s2.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // Deletion
        dp[i][j - 1] + 1,      // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return dp[s1.length][s2.length];
}

/**
 * Computes normalized similarity between 0.0 (no similarity) and 1.0 (exact match).
 */
export function computeSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = computeLevenshteinDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Finds potential allergen spelling variations within packaging OCR text tokens.
 * Only applies fuzzy tolerance (distance <= 2) to tokens with length >= 5 to prevent short-token false positives.
 */
export function findFuzzyAllergenCandidate(
  token: string,
  allergenKeywords: string[],
  maxDistance = 2
): FuzzyMatchResult | null {
  const cleanToken = token.trim().toLowerCase();
  if (cleanToken.length < 3) return null;

  for (const keyword of allergenKeywords) {
    const cleanKeyword = keyword.trim().toLowerCase();

    // Exact match
    if (cleanToken === cleanKeyword) {
      return {
        isMatch: true,
        matchedKeyword: cleanKeyword,
        sourceToken: cleanToken,
        distance: 0,
        similarity: 1.0,
      };
    }

    // Guard: Do not fuzzy-match short words (e.g. "soy", "egg")
    if (cleanKeyword.length < 5 || cleanToken.length < 5) {
      continue;
    }

    const distance = computeLevenshteinDistance(cleanToken, cleanKeyword);
    if (distance <= maxDistance) {
      const similarity = computeSimilarity(cleanToken, cleanKeyword);
      return {
        isMatch: true,
        matchedKeyword: cleanKeyword,
        sourceToken: cleanToken,
        distance,
        similarity,
      };
    }
  }

  return null;
}
