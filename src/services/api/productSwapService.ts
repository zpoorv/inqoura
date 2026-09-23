import type { ResolvedProduct } from '../../types/product';
import { matchKeywordToken } from '../../utils/restrictionMatching';

function computeScore(product: ResolvedProduct): number {
  if (product.adminMetadata?.customScore != null) {
    return product.adminMetadata.customScore;
  }
  let score = 70;
  if (product.nutriScore) {
    const scores: Record<string, number> = { a: 95, b: 80, c: 60, d: 40, e: 20 };
    score = scores[product.nutriScore.toLowerCase()] ?? 60;
  }
  if (product.novaGroup === 1) score += 10;
  if (product.novaGroup === 4) score -= 30;
  return Math.max(0, Math.min(100, score));
}

/**
 * Clean Swaps Engine: Automatically finds healthier, cleaner alternatives
 * in the same grocery aisle category with NOVA <= 2 and zero household allergens.
 */
export function findCleanSwaps(
  targetProduct: ResolvedProduct,
  catalogPool: ResolvedProduct[],
  householdAllergens: string[] = []
): ResolvedProduct[] {
  const targetScore = computeScore(targetProduct);
  const targetCategories = new Set(targetProduct.categories.map((c) => c.toLowerCase().trim()));

  const candidates = catalogPool.filter((product) => {
    // Cannot swap with itself
    if (product.barcode === targetProduct.barcode) return false;

    // Must share at least one category tag if categories exist
    if (targetCategories.size > 0 && product.categories.length > 0) {
      const sharesCategory = product.categories.some((c) =>
        targetCategories.has(c.toLowerCase().trim())
      );
      if (!sharesCategory) return false;
    }

    // Must be better than target product
    const score = computeScore(product);
    if (score <= targetScore) return false;

    // Clean criteria: Less processed (NOVA 1 or 2)
    if (product.novaGroup != null && product.novaGroup > 2) {
      return false;
    }

    // Must be safe from household allergens
    if (householdAllergens.length > 0) {
      const hasConflict = householdAllergens.some((allergen) => {
        if (product.allergens && product.allergens.some((a) => matchKeywordToken(a, allergen))) {
          return true;
        }
        if (product.ingredientsText && matchKeywordToken(product.ingredientsText, allergen)) {
          return true;
        }
        return false;
      });
      if (hasConflict) return false;
    }

    return true;
  });

  // Sort descending by score
  candidates.sort((a, b) => computeScore(b) - computeScore(a));

  return candidates.slice(0, 3);
}
