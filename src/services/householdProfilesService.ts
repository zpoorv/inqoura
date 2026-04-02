import {
  DEFAULT_DIET_PROFILE_ID,
  isDietProfileId,
} from '../constants/dietProfiles';
import { isRestrictionId } from '../constants/restrictions';
import type { HouseholdProfile } from '../models/householdProfile';
import type { RestrictionId, RestrictionSeverity } from '../models/restrictions';
import { AuthServiceError } from './authHelpers';
import { loadUserProfile, saveCurrentUserPreferences } from './userProfileService';

const MAX_HOUSEHOLD_PROFILES = 4;

export type EffectiveShoppingProfile = {
  dietProfileId: HouseholdProfile['dietProfileId'];
  name: string;
  restrictionIds: RestrictionId[];
  restrictionSeverity: RestrictionSeverity;
  usesHouseholdProfile: boolean;
};

function normalizeRestrictionSeverity(value: unknown): RestrictionSeverity {
  return value === 'caution' ? 'caution' : 'strict';
}

function normalizeHouseholdProfiles(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as HouseholdProfile[];
  }

  return input
    .map((value) => {
      if (!value || typeof value !== 'object') {
        return null;
      }

      const candidate = value as Partial<HouseholdProfile>;

      if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') {
        return null;
      }

      const rawDietProfileId = candidate.dietProfileId;
      const dietProfileId =
        typeof rawDietProfileId === 'string' && isDietProfileId(rawDietProfileId)
          ? rawDietProfileId
          : DEFAULT_DIET_PROFILE_ID;

      return {
        dietProfileId,
        id: candidate.id,
        name: candidate.name.trim(),
        restrictionIds: Array.isArray(candidate.restrictionIds)
          ? candidate.restrictionIds.filter(isRestrictionId)
          : [],
        restrictionSeverity: normalizeRestrictionSeverity(candidate.restrictionSeverity),
      } satisfies HouseholdProfile;
    })
    .filter(
      (profile): profile is HouseholdProfile =>
        profile !== null && Boolean(profile.name.trim())
    )
    .slice(0, MAX_HOUSEHOLD_PROFILES);
}

export async function loadHouseholdProfileState() {
  const profile = await loadUserProfile();
  const householdProfiles = normalizeHouseholdProfiles(profile?.householdProfiles);
  const activeHouseholdProfileId =
    typeof profile?.activeHouseholdProfileId === 'string' &&
    householdProfiles.some((item) => item.id === profile.activeHouseholdProfileId)
      ? profile.activeHouseholdProfileId
      : null;

  return {
    activeHouseholdProfileId,
    householdProfiles,
  };
}

export async function loadEffectiveShoppingProfile(): Promise<EffectiveShoppingProfile> {
  const profile = await loadUserProfile();
  const householdProfiles = normalizeHouseholdProfiles(profile?.householdProfiles);
  const activeHouseholdProfile =
    householdProfiles.find((item) => item.id === profile?.activeHouseholdProfileId) ?? null;

  if (activeHouseholdProfile) {
    return {
      dietProfileId: activeHouseholdProfile.dietProfileId,
      name: activeHouseholdProfile.name,
      restrictionIds: activeHouseholdProfile.restrictionIds,
      restrictionSeverity: activeHouseholdProfile.restrictionSeverity,
      usesHouseholdProfile: true,
    };
  }

  return {
    dietProfileId: profile?.dietProfileId ?? DEFAULT_DIET_PROFILE_ID,
    name: profile?.name?.trim() || 'You',
    restrictionIds: profile?.restrictionIds ?? [],
    restrictionSeverity: profile?.restrictionSeverity ?? 'strict',
    usesHouseholdProfile: false,
  };
}

export async function saveHouseholdProfile(
  input: Omit<HouseholdProfile, 'id'> & { id?: string | null }
) {
  const profileName = input.name.trim();

  if (!profileName) {
    throw new AuthServiceError('Enter a name for this household profile.');
  }

  const currentState = await loadHouseholdProfileState();
  const nextProfile: HouseholdProfile = {
    dietProfileId: isDietProfileId(input.dietProfileId)
      ? input.dietProfileId
      : DEFAULT_DIET_PROFILE_ID,
    id: input.id?.trim() || `household-${Date.now()}`,
    name: profileName,
    restrictionIds: input.restrictionIds.filter(isRestrictionId),
    restrictionSeverity: normalizeRestrictionSeverity(input.restrictionSeverity),
  };
  const remainingProfiles = currentState.householdProfiles.filter(
    (profile) => profile.id !== nextProfile.id
  );
  const nextProfiles = [nextProfile, ...remainingProfiles].slice(0, MAX_HOUSEHOLD_PROFILES);
  const nextActiveHouseholdProfileId =
    currentState.activeHouseholdProfileId && currentState.householdProfiles.length > 0
      ? currentState.activeHouseholdProfileId === nextProfile.id
        ? nextProfile.id
        : currentState.activeHouseholdProfileId
      : nextProfile.id;

  await saveCurrentUserPreferences({
    activeHouseholdProfileId: nextActiveHouseholdProfileId,
    householdProfiles: nextProfiles,
  });

  return {
    activeHouseholdProfileId: nextActiveHouseholdProfileId,
    householdProfiles: nextProfiles,
  };
}

export async function setActiveHouseholdProfile(id: string | null) {
  await saveCurrentUserPreferences({
    activeHouseholdProfileId: id,
  });
}

export async function deleteHouseholdProfile(id: string) {
  const currentState = await loadHouseholdProfileState();
  const nextProfiles = currentState.householdProfiles.filter((profile) => profile.id !== id);
  const nextActiveHouseholdProfileId =
    currentState.activeHouseholdProfileId === id ? null : currentState.activeHouseholdProfileId;

  await saveCurrentUserPreferences({
    activeHouseholdProfileId: nextActiveHouseholdProfileId,
    householdProfiles: nextProfiles,
  });

  return {
    activeHouseholdProfileId: nextActiveHouseholdProfileId,
    householdProfiles: nextProfiles,
  };
}
