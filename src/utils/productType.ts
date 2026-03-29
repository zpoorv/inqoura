import type { ResolvedProduct } from '../types/product';

export type ProductFoodStatus = 'food' | 'likely-food' | 'unclear' | 'non-food';

const FOOD_KEYWORDS = [
  'food',
  'drink',
  'beverage',
  'snack',
  'chips',
  'juice',
  'milk',
  'sauce',
  'mayonnaise',
  'mayo',
  'dip',
  'spread',
  'dressing',
  'chutney',
  'pickle',
  'ketchup',
  'biscuits',
  'cookie',
  'candy',
  'chocolate',
  'rice',
  'bread',
  'noodle',
  'tea',
  'coffee',
  'water',
  'spice',
  'seasoning',
  'flour',
  'oil',
  'yogurt',
  'curd',
  'cheese',
  'fruit',
  'vegetable',
  'masala',
  'seasoning',
];

const NON_FOOD_KEYWORDS = [
  'lighter',
  'battery',
  'cleaner',
  'detergent',
  'soap',
  'shampoo',
  'conditioner',
  'toothpaste',
  'cosmetic',
  'perfume',
  'deodorant',
  'candle',
  'incense',
  'paint',
  'glue',
  'plastic',
  'stationery',
  'toy',
  'fabric',
  'hardware',
  'furniture',
  'cleaning',
  'air freshener',
  'polish',
];

const FOOD_PACKAGING_HINTS = [
  'vegetarian',
  'vegan',
  'contains',
  'ingredients',
  'nutrition',
  'allergen',
  'serving',
  'ready to eat',
  'best before',
];

function countKeywordMatches(value: string, keywords: string[]) {
  return keywords.filter((keyword) => value.includes(keyword)).length;
}

function buildSearchableText(product: ResolvedProduct) {
  return [
    product.name,
    product.brand,
    product.ingredientsText,
    product.nameReason,
    ...product.categories,
    ...product.labels,
    ...product.allergens,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getNutritionSignalCount(product: ResolvedProduct) {
  return Object.values(product.nutrition).filter(
    (value) => value !== null && value !== undefined
  ).length;
}

export function classifyProductFoodStatus(
  product: ResolvedProduct
): ProductFoodStatus {
  const searchableText = buildSearchableText(product);
  const nonFoodMatches = countKeywordMatches(searchableText, NON_FOOD_KEYWORDS);
  const foodMatches = countKeywordMatches(searchableText, FOOD_KEYWORDS);
  const packagingHints = countKeywordMatches(searchableText, FOOD_PACKAGING_HINTS);
  const nutritionSignals = getNutritionSignalCount(product);
  const hasIngredients = Boolean(product.ingredientsText?.trim());
  const hasAdditives = product.additiveCount > 0 || product.additiveTags.length > 0;
  const hasFoodStructure =
    nutritionSignals >= 2 || hasIngredients || hasAdditives || packagingHints > 0;

  if (nonFoodMatches >= 2 && !hasFoodStructure) {
    return 'non-food';
  }

  if (nonFoodMatches > 0 && nutritionSignals === 0 && !hasIngredients) {
    return foodMatches > 0 ? 'unclear' : 'non-food';
  }

  if (nutritionSignals >= 3 && (hasIngredients || foodMatches > 0)) {
    return 'food';
  }

  if (hasIngredients && (foodMatches > 0 || packagingHints > 0 || hasAdditives)) {
    return 'food';
  }

  if (nutritionSignals >= 2 || hasIngredients || foodMatches > 0 || hasAdditives) {
    return 'likely-food';
  }

  if (foodMatches > 0 || packagingHints > 0) {
    return 'unclear';
  }

  return nonFoodMatches > 0 ? 'non-food' : 'unclear';
}

export function isLikelyFoodProduct(product: ResolvedProduct) {
  const foodStatus = classifyProductFoodStatus(product);
  return foodStatus === 'food' || foodStatus === 'likely-food';
}
