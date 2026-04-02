import type { ResolvedProduct } from '../types/product';

export type EnvironmentalImpactInsight = {
  highlights: string[];
  summary: string;
  title: string;
  tone: 'good' | 'neutral' | 'warning';
};

function normalizeEcoScore(ecoScore: string | null | undefined) {
  const normalizedScore = ecoScore?.trim().toUpperCase() ?? null;
  return normalizedScore && ['A', 'B', 'C', 'D', 'E'].includes(normalizedScore)
    ? normalizedScore
    : null;
}

function buildPackagingNote(packagingDetails: string[]) {
  const normalizedPackaging = packagingDetails.join(' ').toLowerCase();

  if (
    normalizedPackaging.includes('plastic') ||
    normalizedPackaging.includes('sachet') ||
    normalizedPackaging.includes('multi-layer') ||
    normalizedPackaging.includes('multimaterial')
  ) {
    return {
      summary: 'Packaging looks more material-heavy, so this one may create more throwaway waste.',
      tone: 'warning' as const,
    };
  }

  if (
    normalizedPackaging.includes('glass') ||
    normalizedPackaging.includes('paper') ||
    normalizedPackaging.includes('metal') ||
    normalizedPackaging.includes('recyclable')
  ) {
    return {
      summary: 'Packaging looks a bit easier to sort or recycle than heavily mixed packs.',
      tone: 'good' as const,
    };
  }

  return {
    summary: 'Packaging details are available, but they do not clearly point to a lighter or heavier footprint.',
    tone: 'neutral' as const,
  };
}

export function buildEnvironmentalImpactInsight(
  product: ResolvedProduct
): EnvironmentalImpactInsight | null {
  const ecoScore = normalizeEcoScore(product.ecoScore);
  const origins = (product.origins ?? []).slice(0, 2);
  const packagingDetails = (product.packagingDetails ?? []).slice(0, 3);

  if (!ecoScore && origins.length === 0 && packagingDetails.length === 0) {
    return null;
  }

  const highlights: string[] = [];

  if (ecoScore) {
    highlights.push(`Eco score: ${ecoScore}`);
  }

  if (origins.length > 0) {
    highlights.push(`Origin: ${origins.join(', ')}`);
  }

  if (packagingDetails.length > 0) {
    highlights.push(`Packaging: ${packagingDetails.join(', ')}`);
  }

  if (ecoScore === 'A' || ecoScore === 'B') {
    return {
      highlights,
      summary:
        'This product shows a lighter footprint signal than many packaged foods, though packaging still matters.',
      title: 'Lighter footprint signal',
      tone: 'good',
    };
  }

  if (ecoScore === 'D' || ecoScore === 'E') {
    return {
      highlights,
      summary:
        'This product shows a heavier footprint signal, so it may be worth comparing alternatives if you have similar options nearby.',
      title: 'Heavier footprint signal',
      tone: 'warning',
    };
  }

  if (ecoScore === 'C') {
    return {
      highlights,
      summary: 'This product lands in a middle range for environmental impact.',
      title: 'Mixed footprint signal',
      tone: 'neutral',
    };
  }

  const packagingNote = buildPackagingNote(packagingDetails);

  return {
    highlights,
    summary: packagingNote.summary,
    title: 'More footprint context',
    tone: packagingNote.tone,
  };
}
