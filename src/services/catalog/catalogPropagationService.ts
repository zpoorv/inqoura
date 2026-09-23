import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { getFirebaseAppInstance } from '../firebaseApp';
import type { ResolvedProduct } from '../../types/product';
import { saveCachedProduct } from '../storage/tieredCacheService';
import { validateBarcodeChecksum, validateNutritionalInvariants } from '../../utils/nutritionalInvariants';

export interface PropagationResult {
  committed: boolean;
  persistedLocally: boolean;
  reason?: string;
}

/**
 * Propagates newly scanned, uncataloged product reports to Cloud Firestore and local tiered cache.
 * Implements the "Scan-Once, Benefit-All" crowdsourced propagation model.
 */
export async function propagateSynthesizedProduct(
  product: ResolvedProduct
): Promise<PropagationResult> {
  const barcode = product.barcode;

  // 1. Always save to local L1/L2 cache first (zero-delay offline user experience)
  await saveCachedProduct(barcode, product);

  // 2. Validate Barcode Checksum
  if (!validateBarcodeChecksum(barcode)) {
    return {
      committed: false,
      persistedLocally: true,
      reason: 'Rejected: Invalid barcode checksum.',
    };
  }

  // 3. Physical Nutritional Invariants Validation (Anti-Poisoning Gate)
  const invariantCheck = validateNutritionalInvariants(product.nutrition);
  if (!invariantCheck.isValid) {
    return {
      committed: false,
      persistedLocally: true,
      reason: `Rejected: Invariant violation (${invariantCheck.errors.join('; ')})`,
    };
  }

  // 4. Remote Firestore Auto-Commit
  try {
    const db = getFirestore(getFirebaseAppInstance());
    const docRef = doc(db, 'products', barcode);

    // Immutable Overwrite Protection: Check if document already exists
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      return {
        committed: false,
        persistedLocally: true,
        reason: 'Catalog entry already exists; immutable client overwrite blocked.',
      };
    }

    const payload = {
      barcode,
      product_name: product.name,
      brand: product.brand || 'Unknown Brand',
      categories: product.categories || [],
      ingredients_text: product.ingredientsText || '',
      allergens: product.allergens || [],
      additives: product.additiveTags || [],
      nova_group: product.novaGroup || 3,
      nutri_score: product.nutriScore || 'c',
      nutrition: product.nutrition || {},
      verification_status: 'pending_verification',
      is_locked: false,
      scan_count: 1,
      consensus_score: 0.5,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await setDoc(docRef, payload);

    return {
      committed: true,
      persistedLocally: true,
    };
  } catch (err) {
    return {
      committed: false,
      persistedLocally: true,
      reason: `Firestore commit error: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}
