import { loadUserProfile, saveCurrentUserPreferences } from './userProfileService';

function uniqueCodes(codes: string[]) {
  return Array.from(new Set(codes.filter(Boolean)));
}

export async function loadSavedProductCollections() {
  const profile = await loadUserProfile();

  return {
    comparisonProductCodes: profile?.comparisonProductCodes ?? [],
    favoriteProductCodes: profile?.favoriteProductCodes ?? [],
  };
}

export async function toggleFavoriteProductCode(productCode: string) {
  const profile = await loadUserProfile();
  const currentCodes = profile?.favoriteProductCodes ?? [];
  const nextCodes = currentCodes.includes(productCode)
    ? currentCodes.filter((code) => code !== productCode)
    : uniqueCodes([productCode, ...currentCodes]);

  await saveCurrentUserPreferences({
    favoriteProductCodes: nextCodes,
  });

  return nextCodes;
}

export async function toggleComparisonProductCode(productCode: string) {
  const profile = await loadUserProfile();
  const currentCodes = profile?.comparisonProductCodes ?? [];
  const nextCodes = currentCodes.includes(productCode)
    ? currentCodes.filter((code) => code !== productCode)
    : uniqueCodes([...currentCodes.slice(-1), productCode]);

  await saveCurrentUserPreferences({
    comparisonProductCodes: nextCodes,
  });

  return nextCodes;
}

export async function clearComparisonProductCodes() {
  await saveCurrentUserPreferences({
    comparisonProductCodes: [],
  });

  return [];
}
