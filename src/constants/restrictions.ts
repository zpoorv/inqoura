import type { RestrictionId } from '../models/restrictions';

export type RestrictionDefinition = {
  description: string;
  id: RestrictionId;
  keywords: string[];
  label: string;
};

export const RESTRICTION_DEFINITIONS: RestrictionDefinition[] = [
  {
    description: 'Flags milk-based ingredients and dairy allergens.',
    id: 'dairy',
    keywords: [
      'milk', 'whey', 'casein', 'cheese', 'butter', 'cream', 'ghee', 'yogurt',
      'lait', 'beurre', 'crème', 'fromage', 'milch', 'käse', 'leche', 'queso',
      'latte', 'burro', 'formaggio', 'en:milk', 'fr:lait', 'de:milch', 'es:leche',
    ],
    label: 'Dairy',
  },
  {
    description: 'Flags egg ingredients and egg-derived product signals.',
    id: 'egg',
    keywords: [
      'egg', 'albumen', 'mayonnaise', 'œuf', 'oeuf', 'ei', 'eier', 'huevo',
      'huevos', 'uovo', 'uova', 'en:eggs', 'fr:oeufs', 'es:huevos', 'de:eier',
    ],
    label: 'Egg',
  },
  {
    description: 'Flags fish ingredients like fish oil, anchovy, and seafood sauces.',
    id: 'fish',
    keywords: [
      'fish', 'anchovy', 'fish oil', 'fish sauce', 'tuna', 'salmon',
      'poisson', 'thon', 'saumon', 'fisch', 'thunfisch', 'lachs',
      'pescado', 'atun', 'atún', 'pesce', 'en:fish',
    ],
    label: 'Fish',
  },
  {
    description: 'Flags wheat, barley, rye, malt, and other gluten-linked ingredients.',
    id: 'gluten',
    keywords: [
      'wheat', 'barley', 'rye', 'malt', 'semolina', 'farina', 'spelt', 'kamut',
      'blé', 'orge', 'seigle', 'weizen', 'gerste', 'roggen', 'dinkel',
      'trigo', 'cebada', 'centeno', 'frumento', 'orzo', 'segale', 'en:gluten',
    ],
    label: 'Gluten',
  },
  {
    description: 'Flags lactose and milk-sugar signals.',
    id: 'lactose',
    keywords: ['lactose', 'milk', 'whey', 'milk solids', 'lactosa', 'lattosio'],
    label: 'Lactose',
  },
  {
    description: 'Flags peanut ingredients and peanut allergens.',
    id: 'peanut',
    keywords: [
      'peanut', 'groundnut', 'arachide', 'erdnuss', 'erdnüsse',
      'cacahuete', 'cacahuate', 'mani', 'maní', 'arachidi', 'en:peanuts',
    ],
    label: 'Peanut',
  },
  {
    description: 'Flags sesame seeds, oils, and sesame-derived ingredients.',
    id: 'sesame',
    keywords: ['sesame', 'tahini', 'til', 'sésame', 'sesam', 'sésamo', 'sesamo', 'en:sesame-seeds'],
    label: 'Sesame',
  },
  {
    description: 'Flags shrimp, prawn, crab, lobster, and shellfish ingredients.',
    id: 'shellfish',
    keywords: [
      'shrimp', 'prawn', 'crab', 'lobster', 'shellfish',
      'crevette', 'crabe', 'homard', 'garnele', 'krabbe',
      'gamba', 'camaron', 'camarón', 'cangrejo', 'en:crustaceans', 'en:molluscs',
    ],
    label: 'Shellfish',
  },
  {
    description: 'Flags soy ingredients such as soy protein, soy lecithin, and soy flour.',
    id: 'soy',
    keywords: ['soy', 'soya', 'soybean', 'soy lecithin', 'soja', 'sojabohne', 'en:soybeans'],
    label: 'Soy',
  },
  {
    description: 'Flags almonds, cashews, walnuts, pistachios, and other tree nuts.',
    id: 'tree-nut',
    keywords: [
      'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan',
      'macadamia', 'brazil nut', 'amande', 'noisette', 'noix',
      'mandel', 'haselnuss', 'walnuss', 'almendra', 'nuez', 'avellana',
      'mandorla', 'nocciola', 'en:nuts',
    ],
    label: 'Tree Nut',
  },
  {
    description: 'Flags likely animal-derived ingredients in packaged foods.',
    id: 'vegan',
    keywords: [
      'milk', 'whey', 'casein', 'cheese', 'butter', 'cream', 'egg',
      'gelatin', 'gelatine', 'honey', 'fish', 'chicken', 'beef', 'pork', 'lard',
      'lait', 'fromage', 'miel', 'poulet', 'boeuf', 'bœuf', 'porc',
      'fleisch', 'schwein', 'pollo', 'carne', 'cerdo',
    ],
    label: 'Vegan',
  },
  {
    description: 'Flags meat, fish, and gelatin signals for vegetarian shoppers.',
    id: 'vegetarian',
    keywords: [
      'fish', 'chicken', 'beef', 'pork', 'gelatin', 'gelatine', 'anchovy', 'lard',
      'poisson', 'poulet', 'boeuf', 'bœuf', 'porc', 'fisch',
      'hähnchen', 'schwein', 'pescado', 'pollo', 'carne', 'cerdo',
    ],
    label: 'Vegetarian',
  },
];

export function getRestrictionDefinition(id: RestrictionId) {
  return RESTRICTION_DEFINITIONS.find((restriction) => restriction.id === id);
}

export function isRestrictionId(value: string): value is RestrictionId {
  return RESTRICTION_DEFINITIONS.some((restriction) => restriction.id === value);
}

