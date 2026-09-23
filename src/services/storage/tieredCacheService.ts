import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ResolvedProduct } from '../../types/product';

const L1_CAPACITY = 50;
const L2_KEY_PREFIX = '@inqoura_l2_prod_';

/**
 * L1 in-memory LRU cache.
 * Key: Barcode, Value: ResolvedProduct
 */
const l1Cache = new Map<string, ResolvedProduct>();

/**
 * Retrieves a product from the multi-tier cache.
 * Checks L1 in-memory (< 1ms) first, then falls back to L2 persistent AsyncStorage (< 15ms).
 */
export async function getCachedProduct(barcode: string): Promise<ResolvedProduct | null> {
  if (!barcode) return null;

  // 1. L1 Memory Hit
  if (l1Cache.has(barcode)) {
    const product = l1Cache.get(barcode)!;
    // Refresh LRU order (delete & re-insert)
    l1Cache.delete(barcode);
    l1Cache.set(barcode, product);
    return product;
  }

  // 2. L2 Persistent Storage Hit
  try {
    const raw = await AsyncStorage.getItem(`${L2_KEY_PREFIX}${barcode}`);
    if (raw) {
      const product = JSON.parse(raw) as ResolvedProduct;
      // Promote to L1
      promoteToL1(barcode, product);
      return product;
    }
  } catch {
    // Non-fatal read error
  }

  return null;
}

/**
 * Persists a product into both L1 in-memory and L2 storage.
 */
export async function saveCachedProduct(barcode: string, product: ResolvedProduct): Promise<void> {
  if (!barcode || !product) return;

  // Save to L1
  promoteToL1(barcode, product);

  // Save to L2
  try {
    await AsyncStorage.setItem(`${L2_KEY_PREFIX}${barcode}`, JSON.stringify(product));
  } catch {
    // Non-fatal write error
  }
}

/**
 * Removes a product from all cache tiers.
 */
export async function removeCachedProduct(barcode: string): Promise<void> {
  if (!barcode) return;

  l1Cache.delete(barcode);

  try {
    await AsyncStorage.removeItem(`${L2_KEY_PREFIX}${barcode}`);
  } catch {
    // Non-fatal removal error
  }
}

/**
 * Inserts or refreshes a product in L1 memory with LRU eviction.
 */
function promoteToL1(barcode: string, product: ResolvedProduct): void {
  if (l1Cache.has(barcode)) {
    l1Cache.delete(barcode);
  } else if (l1Cache.size >= L1_CAPACITY) {
    // Evict least-recently used (first key in iteration order)
    const oldestKey = l1Cache.keys().next().value;
    if (oldestKey) {
      l1Cache.delete(oldestKey);
    }
  }
  l1Cache.set(barcode, product);
}

/**
 * Returns diagnostic metrics for the L1 cache.
 */
export function getTieredCacheMetrics(): { l1Size: number; l1Capacity: number } {
  return {
    l1Size: l1Cache.size,
    l1Capacity: L1_CAPACITY,
  };
}

/**
 * Resets the in-memory L1 cache (useful for test suites and memory pressure).
 */
export function clearL1MemoryCache(): void {
  l1Cache.clear();
}
