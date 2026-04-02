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
    keywords: ['milk', 'whey', 'casein', 'cheese', 'butter', 'cream', 'ghee', 'yogurt'],
    label: 'Dairy',
  },
  {
    description: 'Flags egg ingredients and egg-derived product signals.',
    id: 'egg',
    keywords: ['egg', 'albumen', 'mayonnaise'],
    label: 'Egg',
  },
  {
    description: 'Flags fish ingredients like fish oil, anchovy, and seafood sauces.',
    id: 'fish',
    keywords: ['fish', 'anchovy', 'fish oil', 'fish sauce', 'tuna', 'salmon'],
    label: 'Fish',
  },
  {
    description: 'Flags wheat, barley, rye, malt, and other gluten-linked ingredients.',
    id: 'gluten',
    keywords: ['wheat', 'barley', 'rye', 'malt', 'semolina', 'farina', 'spelt'],
    label: 'Gluten',
  },
  {
    description: 'Flags lactose and milk-sugar signals.',
    id: 'lactose',
    keywords: ['lactose', 'milk', 'whey', 'milk solids'],
    label: 'Lactose',
  },
  {
    description: 'Flags peanut ingredients and peanut allergens.',
    id: 'peanut',
    keywords: ['peanut', 'groundnut'],
    label: 'Peanut',
  },
  {
    description: 'Flags sesame seeds, oils, and sesame-derived ingredients.',
    id: 'sesame',
    keywords: ['sesame', 'tahini', 'til'],
    label: 'Sesame',
  },
  {
    description: 'Flags shrimp, prawn, crab, lobster, and shellfish ingredients.',
    id: 'shellfish',
    keywords: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish'],
    label: 'Shellfish',
  },
  {
    description: 'Flags soy ingredients such as soy protein, soy lecithin, and soy flour.',
    id: 'soy',
    keywords: ['soy', 'soya', 'soybean', 'soy lecithin'],
    label: 'Soy',
  },
  {
    description: 'Flags almonds, cashews, walnuts, pistachios, and other tree nuts.',
    id: 'tree-nut',
    keywords: [
      'almond',
      'cashew',
      'walnut',
      'pistachio',
      'hazelnut',
      'pecan',
      'macadamia',
      'brazil nut',
    ],
    label: 'Tree Nut',
  },
  {
    description: 'Flags likely animal-derived ingredients in packaged foods.',
    id: 'vegan',
    keywords: [
      'milk',
      'whey',
      'casein',
      'cheese',
      'butter',
      'cream',
      'egg',
      'gelatin',
      'gelatine',
      'honey',
      'fish',
      'chicken',
      'beef',
      'pork',
      'lard',
    ],
    label: 'Vegan',
  },
  {
    description: 'Flags meat, fish, and gelatin signals for vegetarian shoppers.',
    id: 'vegetarian',
    keywords: ['fish', 'chicken', 'beef', 'pork', 'gelatin', 'gelatine', 'anchovy', 'lard'],
    label: 'Vegetarian',
  },
];

export function getRestrictionDefinition(id: RestrictionId) {
  return RESTRICTION_DEFINITIONS.find((restriction) => restriction.id === id);
}

export function isRestrictionId(value: string): value is RestrictionId {
  return RESTRICTION_DEFINITIONS.some((restriction) => restriction.id === value);
}
