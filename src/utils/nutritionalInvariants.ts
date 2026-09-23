import type { ResolvedNutrition } from '../types/product';

export interface InvariantValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates physical and nutritional invariants before saving any crowdsourced product document.
 * Enforces the laws of physics and mathematics to block catalog poisoning.
 */
export function validateNutritionalInvariants(
  nutrition: ResolvedNutrition | null | undefined
): InvariantValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!nutrition) {
    return { isValid: true, errors, warnings };
  }

  const {
    calories100g = 0,
    fat100g = 0,
    saturatedFat100g = 0,
    carbohydrates100g = 0,
    sugar100g = 0,
    fiber100g = 0,
    protein100g = 0,
    salt100g = 0,
  } = nutrition;

  // 1. Energy Bounds (Pure fat is 900 kcal/100g; nothing on earth can exceed 900 kcal/100g)
  if (calories100g != null) {
    if (calories100g < 0) {
      errors.push('Energy cannot be negative.');
    } else if (calories100g > 900) {
      errors.push(`Energy (${calories100g} kcal/100g) exceeds the physical limit of 900 kcal/100g.`);
    }
  }

  // 2. Macronutrient Conservation Law (Sum of parts cannot exceed 100g, allowing 0.5g rounding slack)
  const macroSum =
    (fat100g || 0) +
    (carbohydrates100g || 0) +
    (protein100g || 0) +
    (fiber100g || 0) +
    (salt100g || 0);

  if (macroSum > 100.5) {
    errors.push(`Total macronutrients (${macroSum.toFixed(1)}g) exceed 100g per 100g product.`);
  }

  // 3. Subsumption checks
  if (sugar100g != null && carbohydrates100g != null && sugar100g > carbohydrates100g + 0.1) {
    errors.push(`Sugars (${sugar100g}g) cannot exceed total carbohydrates (${carbohydrates100g}g).`);
  }

  if (saturatedFat100g != null && fat100g != null && saturatedFat100g > fat100g + 0.1) {
    errors.push(`Saturated fat (${saturatedFat100g}g) cannot exceed total fat (${fat100g}g).`);
  }

  // 4. Atwater Caloric Deviation Warning
  if (calories100g != null && calories100g > 0 && macroSum > 0) {
    const expectedAtwater =
      (fat100g || 0) * 9 +
      (carbohydrates100g || 0) * 4 +
      (protein100g || 0) * 4 +
      (fiber100g || 0) * 2;

    const diff = Math.abs(calories100g - expectedAtwater);
    if (diff > 80) {
      warnings.push(`Declared calories (${calories100g}) deviate significantly from Atwater sum (${Math.round(expectedAtwater)} kcal).`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates EAN-13, EAN-8, and UPC-A Modulo-10 checksum digits.
 */
export function validateBarcodeChecksum(barcode: string): boolean {
  if (!barcode || !/^\d+$/.test(barcode)) return false;

  const len = barcode.length;
  if (len !== 8 && len !== 12 && len !== 13 && len !== 14) {
    // Non-standard SKU / internal code (not verifiable via Modulo-10)
    return true;
  }

  const digits = barcode.split('').map(Number);
  const checkDigit = digits[digits.length - 1];
  const payload = digits.slice(0, digits.length - 1);

  // Compute Modulo-10 from right to left
  let sum = 0;
  let weight = 3;

  for (let i = payload.length - 1; i >= 0; i--) {
    sum += payload[i] * weight;
    weight = weight === 3 ? 1 : 3;
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}
