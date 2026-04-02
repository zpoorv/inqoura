import type { DietProfileId } from '../constants/dietProfiles';
import type { RestrictionId } from '../models/restrictions';
import type { IngredientExplanationLookup } from './ingredientExplanations';

export type IngredientEducation = {
  betterChoiceTip: string | null;
  profileNotes: string[];
};

function matchesAny(lookup: IngredientExplanationLookup, ids: string[]) {
  const haystack = [
    lookup.explanation?.id ?? '',
    lookup.ingredientName,
    lookup.normalizedIngredient,
    lookup.matchedAlias ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return ids.some((id) => haystack.includes(id));
}

export function buildIngredientEducation(
  lookup: IngredientExplanationLookup | null,
  dietProfileId: DietProfileId,
  restrictionIds: RestrictionId[]
): IngredientEducation {
  if (!lookup) {
    return {
      betterChoiceTip: null,
      profileNotes: [],
    };
  }

  const profileNotes = new Set<string>();
  let betterChoiceTip: string | null = lookup.explanation?.betterChoiceTip ?? null;

  if (
    matchesAny(lookup, ['sugar', 'high-fructose-corn-syrup', 'maltodextrin', 'dextrose'])
  ) {
    if (dietProfileId === 'diabetes-aware') {
      profileNotes.add('For diabetes-aware shopping, compare products with less added sugar and more fiber.');
    }

    if (dietProfileId === 'weight-loss') {
      profileNotes.add('For weight-loss goals, this is usually easier to fit occasionally than daily.');
    }

    betterChoiceTip =
      betterChoiceTip ||
      'Look for a version with less added sweetness or a shorter ingredient list next time.';
  }

  if (matchesAny(lookup, ['salt', 'sodium nitrite', 'sodium benzoate', 'msg'])) {
    profileNotes.add('If you are trying to keep packaged foods simpler, compare this with a lower-sodium option.');
  }

  if (
    matchesAny(lookup, [
      'artificial flavor',
      'artificial color',
      'preservatives',
      'emulsifiers',
      'stabilizers',
      'mono and diglycerides',
      'acetylated distarch adipate',
    ])
  ) {
    profileNotes.add('This matters more as a processing clue than as a single ingredient on its own.');
    betterChoiceTip =
      betterChoiceTip ||
      'If you want a simpler everyday option, compare products with fewer texture or flavor additives.';
  }

  if (restrictionIds.includes('soy') && matchesAny(lookup, ['soy', 'soy lecithin', 'soybean oil'])) {
    profileNotes.add('This may clash with your soy filter.');
  }

  if (
    restrictionIds.includes('dairy') &&
    matchesAny(lookup, ['milk', 'whey', 'casein', 'skim milk powder'])
  ) {
    profileNotes.add('This may clash with your dairy filter.');
  }

  if (
    (restrictionIds.includes('vegan') || restrictionIds.includes('vegetarian')) &&
    matchesAny(lookup, ['gelatin', 'honey', 'whey', 'casein'])
  ) {
    profileNotes.add('This may not fit a vegan or vegetarian household profile.');
  }

  return {
    betterChoiceTip,
    profileNotes: [...profileNotes].slice(0, 3),
  };
}
