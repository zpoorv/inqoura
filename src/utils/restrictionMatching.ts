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

// Explicit safe terms that contain allergen substrings or negation phrases
const SAFE_EXCLUSIONS: Record<RestrictionId, string[]> = {
  dairy: ['dairy-free', 'dairy free', 'milk-free', 'milk free', 'sans lait', 'sin leche', 'laktosefrei', 'non-dairy'],
  egg: ['eggplant', 'aubergine', 'egg-free', 'egg free', 'sans oeuf', 'sans œuf', 'sin huevo'],
  fish: ['starfish', 'jellyfish', 'silverfish'],
  gluten: ['gluten-free', 'gluten free', 'sans gluten', 'sin gluten', 'glutenfrei', 'senza glutine', 'maltodextrin'],
  lactose: ['lactose-free', 'lactose free', 'sans lactose', 'sin lactosa', 'laktosefrei'],
  peanut: ['peanut-free', 'peanut free', 'nut-free', 'nut free', 'sans arachide'],
  sesame: ['sesame-free', 'sesame free'],
  shellfish: ['shellfish-free'],
  soy: ['soy-free', 'soy free', 'soya-free', 'sans soja'],
  'tree-nut': ['nut-free', 'nut free', 'butternut', 'nutmeg', 'coconut', 'coco'],
  vegan: ['eggplant', 'plant-based', 'vegan', 'dairy-free'],
  vegetarian: ['eggplant', 'vegetarian', 'vegan', 'plant-based'],
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function matchKeywordToken(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  const normalizedKeyword = normalizeIngredientValue(keyword);
  const normalizedText = normalizeIngredientValue(text);
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}(?:s|es)?([^a-z0-9]|$)`, 'i');
  return pattern.test(normalizedText);
}

function buildSearchableValues(product: ResolvedProduct) {
  return {
    allergens: product.allergens.map(normalizeIngredientValue),
    ingredients: toIngredientList(product.ingredientsText).map(normalizeIngredientValue),
    labels: [...product.labels, ...product.categories].map(normalizeIngredientValue),
  };
}

function hasNegationOrExclusion(value: string, restrictionId: RestrictionId): boolean {
  const exclusions = SAFE_EXCLUSIONS[restrictionId] || [];
  return exclusions.some((exclusion) => value.includes(exclusion));
}

function findKeywordMatch(values: string[], keywords: string[], restrictionId: RestrictionId) {
  for (const value of values) {
    if (!value) {
      continue;
    }

    // Skip evaluation if item contains explicit exclusion phrase (e.g., 'gluten-free' or 'eggplant')
    if (hasNegationOrExclusion(value, restrictionId)) {
      continue;
    }

    for (const keyword of keywords) {
      const normalizedKeyword = normalizeIngredientValue(keyword);

      // Support structured tag prefixes like 'en:gluten' or 'fr:lait' directly
      if (normalizedKeyword.includes(':') && value.includes(normalizedKeyword)) {
        return normalizedKeyword;
      }

      // Word boundary regex prevents substrings like 'egg' matching inside 'eggplant'
      // while supporting regular singular and plural forms (e.g., 'almond' matching 'almonds')
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}(?:s|es)?([^a-z0-9]|$)`, 'i');
      if (pattern.test(value)) {
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

    const allergenMatch = findKeywordMatch(
      searchableValues.allergens,
      definition.keywords,
      restrictionId
    );

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
      definition.keywords,
      restrictionId
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

    const labelMatch = findKeywordMatch(
      searchableValues.labels,
      definition.keywords,
      restrictionId
    );

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
    tone: matches.length === 0 ? 'clear' : severity === 'strict' ? 'avoid' : 'caution',
  };
}
