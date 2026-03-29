import {
  DEFAULT_DIET_PROFILE_ID,
  type DietProfileId,
} from '../constants/dietProfiles';
import type { ResolvedProduct } from '../types/product';
import {
  explainIngredient,
  type IngredientExplanationLookup,
} from './ingredientExplanations';
import {
  highlightIngredients,
  type HighlightedIngredient,
} from './ingredientHighlighting';
import { analyzeProduct, type ProductInsights } from './productInsights';
import {
  getAlternativeProductSuggestions,
  type ProductSuggestion,
} from './productSuggestions';
import {
  buildShareableResultData,
  type ShareableResultData,
} from './shareableResult';
import {
  classifyProductFoodStatus,
  type ProductFoodStatus,
} from './productType';

export type ExplainedIngredient = HighlightedIngredient & {
  displayName: string;
  explanationLookup: IngredientExplanationLookup;
};

export type ResultConfidence = 'high' | 'medium' | 'low';

export type ResultIngredientAnalysis = {
  cautionIngredients: string[];
  explainedIngredients: ExplainedIngredient[];
  highRiskIngredients: string[];
};

export type ResultAnalysis = {
  confidence: ResultConfidence;
  confidenceReason: string;
  foodStatus: ProductFoodStatus;
  ingredientAnalysis: ResultIngredientAnalysis;
  isScoreSuppressed?: boolean;
  insights: ProductInsights;
  shareableResult: ShareableResultData | null;
  suggestions: ProductSuggestion[];
};

const resultAnalysisCache = new Map<string, ResultAnalysis>();

function uniqueLabels(
  ingredients: HighlightedIngredient[],
  risk: HighlightedIngredient['risk']
) {
  return Array.from(
    new Set(
      ingredients
        .filter((ingredient) => ingredient.risk === risk)
        .map((ingredient) => ingredient.match?.label)
        .filter((label): label is string => Boolean(label))
    )
  );
}

function getResultAnalysisCacheKey(
  product: ResolvedProduct,
  profileId: DietProfileId
) {
  return [
    profileId,
    product.code,
    product.barcode,
    product.novaGroup ?? 'nova-none',
    product.nutrition.sugar100g ?? 'sugar-none',
    product.nutrition.salt100g ?? 'salt-none',
    product.ingredientsText ?? 'ingredients-none',
    product.ocrDiagnostics?.parseCompleteness ?? 'ocr-none',
    product.ocrDiagnostics?.matchedIngredientCount ?? 'ocr-matches-none',
    product.ocrDiagnostics?.rejectedNoiseCount ?? 'ocr-noise-none',
    product.adminMetadata?.updatedAt ?? 'override-none',
    product.adminMetadata?.hasCustomAlternatives ? 'custom-alts' : 'rule-alts',
  ].join('|');
}

function countNutritionSignals(product: ResolvedProduct) {
  return [
    product.nutrition.calories100g,
    product.nutrition.sugar100g,
    product.nutrition.salt100g,
    product.nutrition.saturatedFat100g,
    product.nutrition.protein100g,
    product.nutrition.fiber100g,
  ].filter((value) => value !== null && value !== undefined).length;
}

function getUsedSourceId(product: ResolvedProduct) {
  return product.sources.find((source) => source.status === 'used')?.id ?? null;
}

function getConfidenceAssessment(
  product: ResolvedProduct,
  foodStatus: ProductFoodStatus
): {
  confidence: ResultConfidence;
  confidenceReason: string;
  isScoreSuppressed: boolean;
} {
  const hasIngredients = Boolean(product.ingredientsText?.trim());
  const nutritionSignalCount = countNutritionSignals(product);
  const usedSourceId = getUsedSourceId(product);
  const hasAdminOverride = Boolean(product.adminMetadata?.hasManagedData);
  const ocrDiagnostics = product.ocrDiagnostics;
  let score = 0;

  if (foodStatus === 'non-food') {
    return {
      confidence: 'low',
      confidenceReason: 'This does not look like a food or drink item.',
      isScoreSuppressed: true,
    };
  }

  if (foodStatus === 'unclear') {
    return {
      confidence: 'low',
      confidenceReason: 'We need clearer food details before scoring this confidently.',
      isScoreSuppressed: true,
    };
  }

  if (hasAdminOverride) {
    score += 4;
  }

  if (usedSourceId === 'product_override') {
    score += 3;
  } else if (usedSourceId === 'open_food_facts') {
    score += 2;
  } else if (usedSourceId === 'ingredient_ocr') {
    score += 1;
  }

  if (hasIngredients) {
    score += 2;
  } else {
    score -= 2;
  }

  if (nutritionSignalCount >= 4) {
    score += 2;
  } else if (nutritionSignalCount >= 2) {
    score += 1;
  } else if (nutritionSignalCount === 0) {
    score -= 1;
  }

  if (foodStatus === 'food') {
    score += 1;
  }

  if (ocrDiagnostics) {
    if (ocrDiagnostics.parseCompleteness >= 0.78) {
      score += 2;
    } else if (ocrDiagnostics.parseCompleteness >= 0.55) {
      score += 1;
    } else {
      score -= 2;
    }

    if (ocrDiagnostics.rejectedNoiseCount >= 4) {
      score -= 1;
    }
  }

  if (score >= 6) {
    return {
      confidence: 'high',
      confidenceReason: hasAdminOverride
        ? 'High confidence from a reviewed product record.'
        : 'High confidence from clear ingredients and nutrition details.',
      isScoreSuppressed: false,
    };
  }

  if (score >= 3) {
    return {
      confidence: 'medium',
      confidenceReason:
        'Partial details are available, so this is useful but not fully complete.',
      isScoreSuppressed: false,
    };
  }

  return {
    confidence: 'low',
    confidenceReason: ocrDiagnostics
      ? 'Needs review because the ingredient photo looked partial or noisy.'
      : 'Needs review because this product record is missing too many details.',
    isScoreSuppressed: false,
  };
}

function softenInsights(
  insights: ProductInsights,
  confidence: ResultConfidence,
  isScoreSuppressed: boolean,
  foodStatus: ProductFoodStatus
) {
  if (foodStatus === 'non-food' || foodStatus === 'unclear') {
    return insights;
  }

  if (isScoreSuppressed) {
    return {
      ...insights,
      gradeLabel: null,
      smartScore: null,
      summary: 'This result needs a closer look before we show a score.',
      verdict: 'Needs review',
    };
  }

  if (confidence !== 'low') {
    return insights;
  }

  return {
    ...insights,
    summary: `${insights.summary} This read is based on partial details.`,
    verdict: 'Use this as a rough guide',
  };
}

export function buildResultAnalysis(
  product: ResolvedProduct,
  profileId: DietProfileId = DEFAULT_DIET_PROFILE_ID
) {
  const cacheKey = getResultAnalysisCacheKey(product, profileId);
  const cachedValue = resultAnalysisCache.get(cacheKey);

  if (cachedValue) {
    return cachedValue;
  }

  const highlightedIngredients = highlightIngredients(product.ingredientsText);
  const ingredientAnalysis: ResultIngredientAnalysis = {
    cautionIngredients: uniqueLabels(highlightedIngredients, 'caution'),
    explainedIngredients: highlightedIngredients.map((ingredient) => {
      const explanationLookup = explainIngredient(ingredient.ingredient);

      return {
        ...ingredient,
        displayName:
          explanationLookup.explanation?.name || ingredient.ingredient,
        explanationLookup,
      };
    }),
    highRiskIngredients: uniqueLabels(highlightedIngredients, 'high-risk'),
  };
  const foodStatus = classifyProductFoodStatus(product);
  const confidenceAssessment = getConfidenceAssessment(product, foodStatus);
  const insights = softenInsights(
    analyzeProduct(product, profileId),
    confidenceAssessment.confidence,
    confidenceAssessment.isScoreSuppressed,
    foodStatus
  );
  const analysis = {
    confidence: confidenceAssessment.confidence,
    confidenceReason: confidenceAssessment.confidenceReason,
    foodStatus,
    ingredientAnalysis,
    isScoreSuppressed: confidenceAssessment.isScoreSuppressed,
    insights,
    shareableResult: confidenceAssessment.isScoreSuppressed
      ? null
      : buildShareableResultData(product, profileId, insights),
    suggestions:
      confidenceAssessment.confidence === 'low' ||
      confidenceAssessment.isScoreSuppressed
        ? []
        : getAlternativeProductSuggestions(product, profileId, insights),
  };

  resultAnalysisCache.set(cacheKey, analysis);

  if (resultAnalysisCache.size > 24) {
    const oldestKey = resultAnalysisCache.keys().next().value;

    if (oldestKey) {
      resultAnalysisCache.delete(oldestKey);
    }
  }

  return analysis;
}
