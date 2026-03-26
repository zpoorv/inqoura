import type { ResolvedNutrition } from '../types/product';

export type ProductOverrideLink = {
  label: string;
  url: string;
};

export type ProductOverrideRecord = {
  additiveTags?: string[] | null;
  allergens?: string[] | null;
  alternativeLinks?: ProductOverrideLink[] | null;
  barcode: string;
  brand?: string | null;
  categories?: string[] | null;
  imageUrl?: string | null;
  ingredientsText?: string | null;
  labels?: string[] | null;
  name?: string | null;
  nameReason?: string | null;
  notes?: string | null;
  nutrition?: Partial<ResolvedNutrition> | null;
  quantity?: string | null;
  updatedAt?: string | null;
};
