import { z } from 'zod';

/**
 * Strict runtime schema for structured food intelligence reports synthesized by free LLMs.
 * Enforces scientific bounds and prevents hallucinations.
 */
export const LLMReportZodSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().default('Unknown Brand'),
  categories: z.array(z.string()).default([]),
  nutr: z.object({
    energy_kcal_100g: z.number().min(0).max(900),
    fat_100g: z.number().min(0).max(100),
    saturated_fat_100g: z.number().min(0).max(100).optional(),
    carbohydrates_100g: z.number().min(0).max(100),
    sugars_100g: z.number().min(0).max(100),
    fiber_100g: z.number().min(0).max(100).optional(),
    proteins_100g: z.number().min(0).max(100),
    salt_100g: z.number().min(0).max(100),
    sodium_100g: z.number().min(0).max(40).optional(),
  }),
  ing: z.array(z.string()).min(1, 'At least one ingredient is required'),
  add: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      hazard: z.enum(['safe', 'moderate', 'high']),
    })
  ).default([]),
  nova: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export type LLMReportData = z.infer<typeof LLMReportZodSchema>;
