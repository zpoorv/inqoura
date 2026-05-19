import type { PremiumFeatureId } from '../models/premium';

export const PREMIUM_MONTHLY_PRODUCT_ID = 'premium_monthly';

export const PREMIUM_FEATURE_COPY: Record<
  PremiumFeatureId,
  { description: string; shortLabel: string; title: string }
> = {
  'deeper-result-guidance': {
    description:
      'See a clearer breakdown of what most affected a product score, what matters most, and how often the product fits.',
    shortLabel: 'Deeper Guidance',
    title: 'Deeper result guidance',
  },
  'advanced-ocr-recovery': {
    description:
      'Premium is focused on richer product guidance, sharing, and personalization in the current app experience.',
    shortLabel: 'Premium Access',
    title: 'Premium membership',
  },
  'ingredient-ocr': {
    description:
      'Premium is currently centered on deeper result guidance, richer sharing, and personalization across the main app flow.',
    shortLabel: 'Premium Access',
    title: 'Premium membership',
  },
  'weekly-history-insights': {
    description:
      'Premium keeps richer scan-based insight tools available as the history experience continues to grow.',
    shortLabel: 'History Insights',
    title: 'History insight tools',
  },
  'favorites-and-comparisons': {
    description:
      'Premium focuses on deeper guidance, richer history signals, and better sharing in the current release.',
    shortLabel: 'Premium Access',
    title: 'Premium membership',
  },
  'history-personalization': {
    description:
      'Unlock richer scan patterns, repeat-buy signals, and stronger shopping nudges in your history settings.',
    shortLabel: 'History Insights',
    title: 'History personalization',
  },
  'ad-free-experience': {
    description:
      'Premium keeps the experience centered on product guidance, sharing, and personalization tools.',
    shortLabel: 'Premium Access',
    title: 'Premium membership',
  },
  'share-result-card': {
    description:
      'Unlock five extra share-card styles and remove the daily export cap when you want to share results.',
    shortLabel: 'Share Styles',
    title: 'Premium share-card styles',
  },
  'app-look-presets': {
    description:
      'Choose from five extra premium app looks to personalize how Inqoura feels across the app.',
    shortLabel: 'UI Looks',
    title: 'Premium UI looks',
  },
};

export const PREMIUM_FREE_PLAN_FEATURES = [
  'Barcode scanning with trust score, product verdict, and ingredient highlights.',
  'Saved history with reopen, search, and cleanup tools.',
  'One share-card style with 5 result-card exports per day.',
  'Theme, language, and core account settings.',
];

export const PREMIUM_PRIMARY_VALUE_FEATURES = [
  'Deeper result guidance that explains what most affected a score.',
  'Unlimited share-card exports with five extra premium share-card styles.',
  'Premium history insights and stronger scan-based nudges.',
  'Five extra app looks in appearance settings.',
];

export const PREMIUM_BONUS_FEATURES = [
  'Plan restore and billing tools in one place.',
  'Premium access synced across your signed-in devices.',
];

export const PREMIUM_PRICE_PREVIEW_COPY =
  'Monthly pricing will be shown by Google Play at checkout based on country.';
