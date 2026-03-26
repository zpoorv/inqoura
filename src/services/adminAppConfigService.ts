import { doc, getDoc, getFirestore } from 'firebase/firestore';

import type { AdminAppConfig } from '../models/adminAppConfig';
import { getFirebaseAppInstance } from './firebaseApp';

const DEFAULT_ADMIN_APP_CONFIG: AdminAppConfig = {
  enableHistory: true,
  enableIngredientOcr: true,
  enableManualBarcodeEntry: true,
  enableRuleBasedSuggestions: true,
  homeAnnouncementBody: null,
  homeAnnouncementTitle: null,
  resultDisclaimer: null,
  resultSupportMessage: null,
  shareFooterText: null,
  showSourceAttribution: true,
  supportEmail: null,
  updatedAt: null,
};

let configCache: AdminAppConfig | null = null;
let pendingConfigRequest: Promise<AdminAppConfig> | null = null;

function getDb() {
  return getFirestore(getFirebaseAppInstance());
}

export async function loadAdminAppConfig() {
  if (configCache) {
    return configCache;
  }

  if (pendingConfigRequest) {
    return pendingConfigRequest;
  }

  pendingConfigRequest = (async () => {
    try {
      const snapshot = await getDoc(doc(getDb(), 'adminConfig', 'general'));
      const value = snapshot.exists()
        ? { ...DEFAULT_ADMIN_APP_CONFIG, ...(snapshot.data() as Partial<AdminAppConfig>) }
        : DEFAULT_ADMIN_APP_CONFIG;

      configCache = value;
      return value;
    } catch {
      configCache = DEFAULT_ADMIN_APP_CONFIG;
      return DEFAULT_ADMIN_APP_CONFIG;
    } finally {
      pendingConfigRequest = null;
    }
  })();

  return pendingConfigRequest;
}

export function clearAdminAppConfigCache() {
  configCache = null;
  pendingConfigRequest = null;
}
