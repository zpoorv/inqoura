import type { PremiumFeatureId } from '../models/premium';

export const PREMIUM_MONTHLY_PRODUCT_ID = 'premium_monthly';

export const PREMIUM_FEATURE_COPY: Record<
  PremiumFeatureId,
  { description: string; shortLabel: string; title: string }
> = {
  'ingredient-ocr': {
    description:
      'Photograph ingredient labels and run the same scoring pipeline even when a barcode is missing.',
    shortLabel: 'Ingredient OCR',
    title: 'Ingredient label OCR',
  },
  'share-result-card': {
    description:
      'Export polished result cards through the native share sheet for friends, family, or social posts.',
    shortLabel: 'Share Cards',
    title: 'Shareable result cards',
  },
};

export const PREMIUM_PAYWALL_FEATURES = [
  'Unlock ingredient label OCR for barcode-free products.',
  'Share polished result cards from the result screen.',
  'Keep premium access separate from admin roles and future billing providers.',
];

export const PREMIUM_PRICE_PREVIEW_COPY =
  'Monthly pricing will be shown by Google Play at checkout based on country.';
