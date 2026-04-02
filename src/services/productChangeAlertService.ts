import AsyncStorage from '@react-native-async-storage/async-storage/lib/commonjs/index';

import type { ProductChangeAlert } from '../models/productChangeAlert';
import type { ScanHistoryEntry } from './scanHistoryStorage';
import { getAuthSession } from '../store';
import { normalizeIngredientValue } from '../utils/ingredientHighlighting';

const PRODUCT_CHANGE_ALERT_STORAGE_KEY_PREFIX = 'inqoura/product-change-alerts/v1';
const MAX_ALERTS = 24;

function getAlertScopeId(uid?: string | null) {
  return uid ? `user:${uid}` : 'guest';
}

function getStorageKey(scopeId: string) {
  return `${PRODUCT_CHANGE_ALERT_STORAGE_KEY_PREFIX}/${scopeId}`;
}

function getActiveScopeId() {
  return getAlertScopeId(getAuthSession().user?.id);
}

function normalizeAlertList(alerts: ProductChangeAlert[]) {
  return [...alerts]
    .sort(
      (left, right) =>
        new Date(right.detectedAt).getTime() - new Date(left.detectedAt).getTime()
    )
    .slice(0, MAX_ALERTS);
}

function normalizeText(value?: string | null) {
  return normalizeIngredientValue(value || '');
}

function normalizeList(value: string[]) {
  return [...value].map((item) => item.trim().toLowerCase()).sort().join('|');
}

function getChangedFields(previousEntry: ScanHistoryEntry, nextEntry: ScanHistoryEntry) {
  const changedFields: string[] = [];

  if (
    normalizeText(previousEntry.product.ingredientsText) !==
    normalizeText(nextEntry.product.ingredientsText)
  ) {
    changedFields.push('ingredients');
  }

  if (
    normalizeList(previousEntry.product.allergens) !==
    normalizeList(nextEntry.product.allergens)
  ) {
    changedFields.push('allergens');
  }

  if (
    previousEntry.product.additiveCount !== nextEntry.product.additiveCount ||
    normalizeList(previousEntry.product.additiveTags) !==
      normalizeList(nextEntry.product.additiveTags)
  ) {
    changedFields.push('additives');
  }

  return changedFields;
}

function buildAlertSummary(changedFields: string[]) {
  if (changedFields.includes('allergens')) {
    return 'Allergen details changed since your last scan.';
  }

  if (changedFields.includes('ingredients')) {
    return 'Ingredients changed since your last scan.';
  }

  return 'This product changed since your last scan.';
}

async function loadAlertsForScope(scopeId: string) {
  const rawValue = await AsyncStorage.getItem(getStorageKey(scopeId));

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return normalizeAlertList(
      parsedValue.filter(
        (value): value is ProductChangeAlert =>
          Boolean(value) &&
          typeof value === 'object' &&
          typeof value.id === 'string' &&
          typeof value.barcode === 'string' &&
          typeof value.name === 'string' &&
          typeof value.summary === 'string'
      )
    );
  } catch {
    return [];
  }
}

async function saveAlertsForScope(scopeId: string, alerts: ProductChangeAlert[]) {
  await AsyncStorage.setItem(
    getStorageKey(scopeId),
    JSON.stringify(normalizeAlertList(alerts))
  );
}

export async function loadProductChangeAlerts() {
  return loadAlertsForScope(getActiveScopeId());
}

export async function recordProductChangeAlert(
  previousEntry: ScanHistoryEntry,
  nextEntry: ScanHistoryEntry
) {
  const changedFields = getChangedFields(previousEntry, nextEntry);

  if (changedFields.length === 0) {
    return null;
  }

  const scopeId = getActiveScopeId();
  const alerts = await loadAlertsForScope(scopeId);
  const alert: ProductChangeAlert = {
    barcode: nextEntry.barcode,
    changedFields,
    detectedAt: nextEntry.scannedAt,
    id: `${nextEntry.barcode}:${nextEntry.scannedAt}`,
    name: nextEntry.name,
    previousScannedAt: previousEntry.scannedAt,
    severity: changedFields.includes('allergens') ? 'high' : 'caution',
    summary: buildAlertSummary(changedFields),
  };

  await saveAlertsForScope(scopeId, [alert, ...alerts]);
  return alert;
}

export async function clearProductChangeAlertsForUser(uid?: string | null) {
  await AsyncStorage.removeItem(getStorageKey(getAlertScopeId(uid)));
}
