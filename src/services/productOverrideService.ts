import { doc, getDoc, getFirestore } from 'firebase/firestore';

import type {
  ProductOverrideLink,
  ProductOverrideRecord,
} from '../models/productOverride';
import type { ProductSourceInfo, ResolvedProduct } from '../types/product';
import { getFirebaseAppInstance } from './firebaseApp';

const overrideCache = new Map<string, ProductOverrideRecord | null>();
const pendingOverrideLookups = new Map<string, Promise<ProductOverrideRecord | null>>();

function getDb() {
  return getFirestore(getFirebaseAppInstance());
}

function getOverrideDocRef(barcode: string) {
  return doc(getDb(), 'productOverrides', barcode);
}

function sanitizeStringArray(value: string[] | null | undefined) {
  return (value ?? []).map((item) => item.trim()).filter(Boolean);
}

function sanitizeAlternativeLinks(value: ProductOverrideLink[] | null | undefined) {
  return (value ?? [])
    .map((item) => ({
      description: item.description?.trim() || '',
      label: item.label?.trim() || '',
      url: item.url?.trim() || '',
    }))
    .filter((item) => item.label && item.description && item.url);
}

function hasCustomAlternativesField(override: ProductOverrideRecord) {
  return Object.prototype.hasOwnProperty.call(override, 'healthierAlternatives');
}

function mergeNutrition(
  product: ResolvedProduct,
  override: ProductOverrideRecord
): ResolvedProduct['nutrition'] {
  if (!override.nutrition) {
    return product.nutrition;
  }

  return {
    ...product.nutrition,
    ...override.nutrition,
  };
}

export async function loadProductOverride(barcode: string) {
  if (overrideCache.has(barcode)) {
    return overrideCache.get(barcode) ?? null;
  }

  const pendingLookup = pendingOverrideLookups.get(barcode);

  if (pendingLookup) {
    return pendingLookup;
  }

  const lookupPromise = (async () => {
    try {
      const snapshot = await getDoc(getOverrideDocRef(barcode));
      const overrideValue = snapshot.exists()
        ? ({ barcode, ...snapshot.data() } as ProductOverrideRecord)
        : null;

      overrideCache.set(barcode, overrideValue);
      return overrideValue;
    } catch {
      overrideCache.set(barcode, null);
      return null;
    } finally {
      pendingOverrideLookups.delete(barcode);
    }
  })();

  pendingOverrideLookups.set(barcode, lookupPromise);
  return lookupPromise;
}

export function applyProductOverride(
  product: ResolvedProduct | null,
  override: ProductOverrideRecord | null
) {
  if (!override) {
    return product;
  }

  const overrideSource: ProductSourceInfo = {
    id: 'product_override',
    label: 'Inqoura Override',
    note:
      'This product includes manual corrections stored by Inqoura to improve names, images, or product details.',
    status: 'used',
  };

  if (!product) {
    return {
      additiveCount: sanitizeStringArray(override.additiveTags).length,
      additiveTags: sanitizeStringArray(override.additiveTags),
      adminMetadata: {
        customGradeLabel: override.adminGradeLabel ?? null,
        customScore: override.adminScore ?? null,
        customSummary: override.adminSummary?.trim() || null,
        customVerdict: override.adminVerdict?.trim() || null,
        hasCustomAlternatives: hasCustomAlternativesField(override),
        hasManagedData: true,
        healthierAlternatives: sanitizeAlternativeLinks(
          override.healthierAlternatives
        ),
        notes: override.notes?.trim() || null,
        sourceNote: override.sourceNote?.trim() || null,
        updatedAt: override.updatedAt?.trim() || null,
      },
      allergens: sanitizeStringArray(override.allergens),
      barcode: override.barcode,
      brand: override.brand?.trim() || null,
      categories: sanitizeStringArray(override.categories),
      code: override.barcode,
      ecoScore: null,
      imageUrl: override.imageUrl?.trim() || null,
      ingredientsImageUrl: null,
      ingredientsText: override.ingredientsText?.trim() || null,
      labels: sanitizeStringArray(override.labels),
      name: override.name?.trim() || `Catalog entry ${override.barcode}`,
      nameReason:
        override.nameReason?.trim() ||
        'This product name comes from an Inqoura manual override.',
      novaGroup: null,
      nutrition: override.nutrition ?? {},
      nutritionImageUrl: null,
      nutriScore: null,
      quantity: override.quantity?.trim() || null,
      sources: [overrideSource],
    };
  }

  const nextSources = product.sources.some((source) => source.id === 'product_override')
    ? product.sources
    : [overrideSource, ...product.sources];
  const additiveTags = sanitizeStringArray(override.additiveTags);

  return {
    ...product,
    additiveCount: additiveTags.length > 0 ? additiveTags.length : product.additiveCount,
    additiveTags: additiveTags.length > 0 ? additiveTags : product.additiveTags,
    adminMetadata: {
      customGradeLabel:
        override.adminGradeLabel ?? product.adminMetadata?.customGradeLabel ?? null,
      customScore: override.adminScore ?? product.adminMetadata?.customScore ?? null,
      customSummary:
        override.adminSummary?.trim() || product.adminMetadata?.customSummary || null,
      customVerdict:
        override.adminVerdict?.trim() || product.adminMetadata?.customVerdict || null,
      hasCustomAlternatives: hasCustomAlternativesField(override),
      hasManagedData: true,
      healthierAlternatives: sanitizeAlternativeLinks(
        override.healthierAlternatives
      ),
      notes: override.notes?.trim() || product.adminMetadata?.notes || null,
      sourceNote: override.sourceNote?.trim() || product.adminMetadata?.sourceNote || null,
      updatedAt: override.updatedAt?.trim() || product.adminMetadata?.updatedAt || null,
    },
    allergens:
      sanitizeStringArray(override.allergens).length > 0
        ? sanitizeStringArray(override.allergens)
        : product.allergens,
    brand: override.brand?.trim() || product.brand,
    categories:
      sanitizeStringArray(override.categories).length > 0
        ? sanitizeStringArray(override.categories)
        : product.categories,
    imageUrl: override.imageUrl?.trim() || product.imageUrl,
    ingredientsText: override.ingredientsText?.trim() || product.ingredientsText,
    labels:
      sanitizeStringArray(override.labels).length > 0
        ? sanitizeStringArray(override.labels)
        : product.labels,
    name: override.name?.trim() || product.name,
    nameReason: override.nameReason?.trim() || product.nameReason,
    nutrition: mergeNutrition(product, override),
    quantity: override.quantity?.trim() || product.quantity,
    sources: nextSources,
  };
}
