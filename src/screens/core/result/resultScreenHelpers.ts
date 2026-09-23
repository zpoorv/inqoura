import type { AppColors } from '../../../constants/theme';
import { getGradeTone } from '../../../utils/gradeTone';
import type {
  DecisionVerdict,
  ResultAnalysis,
  ResultConfidence,
} from '../../../utils/resultAnalysis';
import type { HighlightedIngredient } from '../../../utils/ingredientHighlighting';
import type { ScanResultSource } from '../../../types/scanner';

export type TranslateFn = (
  key: string,
  values?: Record<string, number | string | null | undefined>
) => string;

export function getToneColor(colors: AppColors, tone: 'good' | 'neutral' | 'warning') {
  if (tone === 'good') {
    return colors.success;
  }

  if (tone === 'warning') {
    return colors.warning;
  }

  return colors.textMuted;
}

export function getIngredientToneColor(colors: AppColors, risk: HighlightedIngredient['risk']) {
  switch (risk) {
    case 'high-risk':
      return colors.danger;
    case 'caution':
      return colors.warning;
    default:
      return colors.success;
  }
}

export function getIngredientToneBackground(colors: AppColors, risk: HighlightedIngredient['risk']) {
  switch (risk) {
    case 'high-risk':
      return colors.dangerMuted;
    case 'caution':
      return colors.warningMuted;
    default:
      return colors.successMuted;
  }
}

export function getIngredientRiskLabel(t: TranslateFn, risk: HighlightedIngredient['risk']) {
  switch (risk) {
    case 'high-risk':
      return t('High Risk');
    case 'caution':
      return t('Caution');
    default:
      return t('Safe');
  }
}

export function getOffScoreTone(grade?: string | null) {
  return getGradeTone(grade);
}

export function getHealthScoreTheme(colors: AppColors, score: number | null, t: TranslateFn) {
  if (score === null) {
    return {
      accent: colors.textMuted,
      background: colors.background,
      label: t('Needs More Data'),
      progress: 0,
      text: colors.text,
    };
  }

  if (score >= 80) {
    return {
      accent: colors.success,
      background: colors.successMuted,
      label: t('Great Choice'),
      progress: score,
      text: colors.success,
    };
  }

  if (score >= 50) {
    return {
      accent: colors.warning,
      background: colors.warningMuted,
      label: t('Moderate'),
      progress: score,
      text: colors.warning,
    };
  }

  return {
    accent: colors.danger,
    background: colors.dangerMuted,
    label: t('Needs Caution'),
    progress: score,
    text: colors.danger,
  };
}

export function getScanCompletionCopy(resultSource: ScanResultSource, t: TranslateFn) {
  return {
    body: t('Product loaded.'),
  };
}

export function getQuickUseGuidance(
  verdict: DecisionVerdict | null,
  score: number | null,
  foodStatus: ResultAnalysis['foodStatus'] | null,
  confidence: ResultConfidence | null,
  t: TranslateFn
) {
  if (verdict === 'good-regular-pick') {
    return t('Good regular pick');
  }

  if (verdict === 'okay-occasionally') {
    return t('Okay occasionally');
  }

  if (verdict === 'not-ideal-often') {
    return t('Not ideal often');
  }

  if (verdict === 'need-better-data') {
    return t('Need better data');
  }

  if (foodStatus === 'non-food') {
    return t('Not scored as food');
  }

  if (foodStatus === 'unclear') {
    return t('Needs a closer look');
  }

  if (confidence === 'low') {
    return t('Use as a rough guide');
  }

  if (score === null) {
    return t('Needs more detail');
  }

  if (score >= 80) {
    return t('Good for regular use');
  }

  if (score >= 60) {
    return t('Okay in moderation');
  }

  if (score >= 40) {
    return t('Best kept occasional');
  }

  return t('Not ideal for frequent use');
}

export function getConfidenceTone(colors: AppColors, confidence: ResultConfidence | null) {
  if (confidence === 'high') {
    return colors.success;
  }

  if (confidence === 'medium') {
    return colors.warning;
  }

  return colors.danger;
}

export function getConfidenceBackground(colors: AppColors, confidence: ResultConfidence | null) {
  if (confidence === 'high') {
    return colors.successMuted;
  }

  if (confidence === 'medium') {
    return colors.warningMuted;
  }

  return colors.dangerMuted;
}

export function getConfidenceLabel(confidence: ResultConfidence | null, t: TranslateFn) {
  if (confidence === 'high') {
    return t('High confidence');
  }

  if (confidence === 'medium') {
    return t('Partial data');
  }

  return t('Needs review');
}
