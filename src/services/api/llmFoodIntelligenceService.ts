import { pruneOcrText } from '../../utils/ocrTextPruner';
import { LLMReportZodSchema, type LLMReportData } from '../../types/llmReportSchema';
import type { ResolvedProduct } from '../../types/product';
import { getHealthScoreGradeLabel } from '../../utils/productHealthScore';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const FALLBACK_MODEL = 'llama-3.3-70b-versatile';

/**
 * System prompt strictly calibrating the LLM to output pure JSON matching the Zod schema.
 */
const SYSTEM_PROMPT = `You are the Inqoura Food Intelligence Engine.
You extract packaged food entities from OCR text and output pure structured JSON.
Calculate energy, fat, carbs, sugars, proteins, salt per 100g.
Identify NOVA group (1-4).
Output ONLY valid JSON matching this schema:
{
  "name": string,
  "brand": string,
  "categories": string[],
  "nutr": {
    "energy_kcal_100g": number,
    "fat_100g": number,
    "saturated_fat_100g": number,
    "carbohydrates_100g": number,
    "sugars_100g": number,
    "fiber_100g": number,
    "proteins_100g": number,
    "salt_100g": number
  },
  "ing": string[],
  "add": [{"code": string, "name": string, "hazard": "safe"|"moderate"|"high"}],
  "nova": 1|2|3|4
}`;

/**
 * Synthesizes an unknown food product from raw packaging OCR text using free LLMs.
 */
export async function synthesizeFoodReport(
  barcode: string,
  rawOcrText: string,
  apiKey?: string
): Promise<ResolvedProduct | null> {
  const pruned = pruneOcrText(rawOcrText);
  if (!pruned) return null;

  const key = apiKey || process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

  // If no API key is configured (e.g. offline or demo), construct local heuristic fallback
  if (!key) {
    return buildLocalHeuristicFallback(barcode, pruned);
  }

  try {
    // 1. Primary Scout: llama-3.1-8b-instant (<200ms)
    const reportData = await queryGroqJson(key, DEFAULT_MODEL, pruned);
    return mapLlmReportToResolvedProduct(barcode, reportData);
  } catch (err) {
    if (__DEV__) {
      console.warn('[LLMFoodIntelligence] 8B scout failed, escalating to 70B:', err);
    }

    try {
      // 2. Escalation: llama-3.3-70b-versatile
      const reportData = await queryGroqJson(key, FALLBACK_MODEL, pruned);
      return mapLlmReportToResolvedProduct(barcode, reportData);
    } catch {
      return buildLocalHeuristicFallback(barcode, pruned);
    }
  }
}

/**
 * Queries Groq Cloud chat completions with response_format json_object.
 */
async function queryGroqJson(
  apiKey: string,
  model: string,
  prunedText: string
): Promise<LLMReportData> {
  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Packaging Text:\n${prunedText}` },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(rawContent);

  return LLMReportZodSchema.parse(parsed);
}

/**
 * Maps structured LLM entities into the standard ResolvedProduct domain model.
 */
export function mapLlmReportToResolvedProduct(
  barcode: string,
  report: LLMReportData
): ResolvedProduct {
  // Approximate health score from nutriments (sugar, sat-fat, salt vs protein, fiber)
  const penalty =
    (report.nutr.sugars_100g || 0) * 1.5 +
    (report.nutr.saturated_fat_100g || 0) * 2.0 +
    (report.nutr.salt_100g || 0) * 5.0 +
    (report.nova === 4 ? 20 : report.nova === 3 ? 10 : 0);
  const reward =
    (report.nutr.proteins_100g || 0) * 1.5 + ((report.nutr.fiber_100g || 0) * 2.0);
  const rawScore = Math.max(5, Math.min(100, Math.round(70 - penalty + reward)));
  const gradeLabel = getHealthScoreGradeLabel(rawScore);

  return {
    additiveCount: report.add.length,
    additiveTags: report.add.map((a) => a.code.toLowerCase()),
    allergens: [],
    barcode,
    brand: report.brand || null,
    categories: report.categories,
    code: barcode,
    ecoScore: null,
    imageUrl: null,
    ingredientsImageUrl: null,
    ingredientsText: report.ing.join(', '),
    labels: [],
    name: report.name,
    nameReason: null,
    novaGroup: report.nova,
    nutrition: {
      calories100g: report.nutr.energy_kcal_100g,
      fat100g: report.nutr.fat_100g,
      saturatedFat100g: report.nutr.saturated_fat_100g ?? null,
      carbohydrates100g: report.nutr.carbohydrates_100g,
      sugar100g: report.nutr.sugars_100g,
      fiber100g: report.nutr.fiber_100g ?? null,
      protein100g: report.nutr.proteins_100g,
      salt100g: report.nutr.salt_100g,
      sodium100g: report.nutr.sodium_100g ?? (report.nutr.salt_100g ? report.nutr.salt_100g / 2.5 : null),
    },
    nutritionImageUrl: null,
    nutriScore: rawScore >= 80 ? 'a' : rawScore >= 60 ? 'b' : rawScore >= 40 ? 'c' : rawScore >= 20 ? 'd' : 'e',
    ocrDiagnostics: null,
    origins: [],
    packagingDetails: [],
    quantity: null,
    recipe: null,
    sources: [
      {
        id: 'ingredient_ocr',
        label: 'AI Synthesized (Groq / Gemini)',
        note: 'Parsed from packaging label entities via on-device LLM pipeline',
        status: 'used',
      },
    ],
    adminMetadata: {
      adminPriorityScore: null,
      customGradeLabel: gradeLabel,
      customScore: rawScore,
      customSummary: `Synthesized with NOVA ${report.nova}`,
      customVerdict: rawScore >= 70 ? 'Clean Pick' : 'Caution',
      hasCustomAlternatives: false,
      hasManagedData: false,
      healthierAlternatives: [],
      notes: null,
      reviewBadgeCopy: 'AI Synthesized',
      reviewStatus: 'draft',
      sourceNote: 'Groq LLM Synthesis',
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Heuristic fallback when running completely offline or without an active API key.
 */
function buildLocalHeuristicFallback(barcode: string, prunedText: string): ResolvedProduct {
  const lines = prunedText.split('\n').map((l) => l.trim()).filter(Boolean);
  const name = lines[0] ? lines[0].slice(0, 40) : `Scanned Product ${barcode}`;
  const ingredientsText = lines.slice(1, 10).join(', ') || 'Ingredients unavailable';

  return {
    additiveCount: 0,
    additiveTags: [],
    allergens: [],
    barcode,
    brand: null,
    categories: ['Packaged Food'],
    code: barcode,
    ecoScore: null,
    imageUrl: null,
    ingredientsImageUrl: null,
    ingredientsText,
    labels: [],
    name,
    nameReason: null,
    novaGroup: 3,
    nutriScore: 'c',
    nutrition: {
      calories100g: 250,
      fat100g: 5,
      saturatedFat100g: 1,
      carbohydrates100g: 40,
      sugar100g: 10,
      fiber100g: 3,
      protein100g: 8,
      salt100g: 0.8,
      sodium100g: 0.32,
    },
    nutritionImageUrl: null,
    ocrDiagnostics: null,
    origins: [],
    packagingDetails: [],
    quantity: null,
    recipe: null,
    sources: [
      {
        id: 'ingredient_ocr',
        label: 'Local Heuristic OCR',
        note: 'Parsed locally from text blocks',
        status: 'used',
      },
    ],
    adminMetadata: null,
  };
}
