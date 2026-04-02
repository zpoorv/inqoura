import { getRestrictionDefinition } from '../constants/restrictions';
import type { RestrictionId, RestrictionSeverity } from '../models/restrictions';
import type { ResolvedProduct } from '../types/product';
import { normalizeIngredientValue, toIngredientList } from './ingredientHighlighting';

export type RestrictionMatch = {
  id: RestrictionId;
  label: string;
  matchedBy: 'allergen' | 'ingredient' | 'label';
  matchedKeyword: string;
};

export type RestrictionAssessment = {
  matches: RestrictionMatch[];
  summary: string | null;
  tone: 'clear' | 'caution' | 'avoid';
};

function buildSearchableValues(product: ResolvedProduct) {
  return {
    allergens: product.allergens.map(normalizeIngredientValue),
    ingredients: toIngredientList(product.ingredientsText).map(normalizeIngredientValue),
    labels: [...product.labels, ...product.categories].map(normalizeIngredientValue),
  };
}

function findKeywordMatch(values: string[], keywords: string[]) {
  for (const value of values) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeIngredientValue(keyword);

      if (value.includes(normalizedKeyword)) {
        return normalizedKeyword;
      }
    }
  }

  return null;
}

function buildSummary(matches: RestrictionMatch[], severity: RestrictionSeverity) {
  if (matches.length === 0) {
    return null;
  }

  const labels = Array.from(new Set(matches.map((match) => match.label)));

  if (severity === 'strict') {
    return `Avoid for your selected settings: ${labels.join(', ')}.`;
  }

  return `Watch for your selected settings: ${labels.join(', ')}.`;
}

export function assessProductRestrictions(
  product: ResolvedProduct,
  restrictionIds: RestrictionId[],
  severity: RestrictionSeverity
): RestrictionAssessment {
  if (restrictionIds.length === 0) {
    return {
      matches: [],
      summary: null,
      tone: 'clear',
    };
  }

  const searchableValues = buildSearchableValues(product);
  const matches: RestrictionMatch[] = [];

  restrictionIds.forEach((restrictionId) => {
    const definition = getRestrictionDefinition(restrictionId);

    if (!definition) {
      return;
    }

    const allergenMatch = findKeywordMatch(searchableValues.allergens, definition.keywords);

    if (allergenMatch) {
      matches.push({
        id: definition.id,
        label: definition.label,
        matchedBy: 'allergen',
        matchedKeyword: allergenMatch,
      });
      return;
    }

    const ingredientMatch = findKeywordMatch(
      searchableValues.ingredients,
      definition.keywords
    );

    if (ingredientMatch) {
      matches.push({
        id: definition.id,
        label: definition.label,
        matchedBy: 'ingredient',
        matchedKeyword: ingredientMatch,
      });
      return;
    }

    const labelMatch = findKeywordMatch(searchableValues.labels, definition.keywords);

    if (labelMatch) {
      matches.push({
        id: definition.id,
        label: definition.label,
        matchedBy: 'label',
        matchedKeyword: labelMatch,
      });
    }
  });

  return {
    matches,
    summary: buildSummary(matches, severity),
    tone:
      matches.length === 0 ? 'clear' : severity === 'strict' ? 'avoid' : 'caution',
  };
}
