import AsyncStorage from '@react-native-async-storage/async-storage/lib/commonjs/index';

import type { ResolvedProduct } from '../types/product';
import { getAuthSession } from '../store';

const COMMON_PRODUCT_STORAGE_KEY_PREFIX = 'inqoura/common-products/v1';
const MAX_COMMON_PRODUCTS = 120;

export type CommonProductRecord = {
  barcode: string;
  brand: string | null;
  categories: string[];
  code: string;
  lastUsedAt: string;
  name: string;
  product: ResolvedProduct;
  usageCount: number;
};

function getCommonProductScopeId(uid?: string | null) {
  return uid ? `user:${uid}` : 'guest';
}

function getStorageKey(scopeId: string) {
  return `${COMMON_PRODUCT_STORAGE_KEY_PREFIX}/${scopeId}`;
}

function getActiveScopeId() {
  return getCommonProductScopeId(getAuthSession().user?.id);
}

function normalizeRecords(records: CommonProductRecord[]) {
  return [...records]
    .sort((left, right) => {
      if (right.usageCount !== left.usageCount) {
        return right.usageCount - left.usageCount;
      }

      return (
        new Date(right.lastUsedAt).getTime() - new Date(left.lastUsedAt).getTime()
      );
    })
    .slice(0, MAX_COMMON_PRODUCTS);
}

async function loadRecordsForScope(scopeId: string) {
  const rawValue = await AsyncStorage.getItem(getStorageKey(scopeId));

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return normalizeRecords(
      parsedValue.filter(
        (value): value is CommonProductRecord =>
          Boolean(value) &&
          typeof value === 'object' &&
          typeof value.barcode === 'string' &&
          typeof value.code === 'string' &&
          typeof value.name === 'string' &&
          typeof value.lastUsedAt === 'string' &&
          typeof value.usageCount === 'number' &&
          typeof value.product === 'object'
      )
    );
  } catch {
    return [];
  }
}

async function saveRecordsForScope(scopeId: string, records: CommonProductRecord[]) {
  await AsyncStorage.setItem(
    getStorageKey(scopeId),
    JSON.stringify(normalizeRecords(records))
  );
}

function createSearchableText(record: CommonProductRecord) {
  return [
    record.name,
    record.barcode,
    record.brand,
    ...record.categories,
    record.product.ingredientsText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export async function loadCommonProducts() {
  return loadRecordsForScope(getActiveScopeId());
}

export async function rememberCommonProduct(barcode: string, product: ResolvedProduct) {
  const scopeId = getActiveScopeId();
  const records = await loadRecordsForScope(scopeId);
  const existingRecord = records.find(
    (record) => record.barcode === barcode || record.code === product.code
  );
  const nextRecord: CommonProductRecord = {
    barcode,
    brand: product.brand,
    categories: product.categories,
    code: product.code || barcode,
    lastUsedAt: new Date().toISOString(),
    name: product.name,
    product,
    usageCount: (existingRecord?.usageCount ?? 0) + 1,
  };
  const nextRecords = records.filter(
    (record) => record.barcode !== barcode && record.code !== product.code
  );

  nextRecords.push(nextRecord);
  await saveRecordsForScope(scopeId, nextRecords);
}

export async function loadCommonProductByBarcode(barcode: string) {
  const records = await loadCommonProducts();

  return (
    records.find((record) => record.barcode === barcode || record.code === barcode) ?? null
  );
}

export async function searchCommonProducts(query: string, limit = 12) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return loadUsualBuyProducts(limit);
  }

  const records = await loadCommonProducts();
  return records
    .filter((record) => createSearchableText(record).includes(normalizedQuery))
    .slice(0, limit);
}

export async function loadUsualBuyProducts(limit = 12) {
  const records = await loadCommonProducts();
  return normalizeRecords(records).slice(0, limit);
}

export async function clearCommonProductsForUser(uid?: string | null) {
  await AsyncStorage.removeItem(getStorageKey(getCommonProductScopeId(uid)));
}
