import type { User } from 'firebase/auth';

import { storeAuthenticatedUser } from './authHelpers';
import {
  primePremiumEntitlementFromProfile,
  refreshCurrentPremiumEntitlement,
} from './premiumEntitlementService';
import { clearSessionResourceCache } from './sessionResourceCache';
import {
  primeUserProfileFromAuthUser,
  syncCurrentUserProfileToFirestore,
} from './userProfileService';

export async function completeAuthenticatedSession(user: User) {
  const authUser = await storeAuthenticatedUser(user);
  clearSessionResourceCache();
  const localProfile = await primeUserProfileFromAuthUser(authUser);

  primePremiumEntitlementFromProfile(
    localProfile
      ? {
          plan: localProfile.plan,
          role: localProfile.role,
          updatedAt: localProfile.updatedAt,
        }
      : null
  );

  void syncCurrentUserProfileToFirestore()
    .then((profile) => {
      if (!profile) {
        return;
      }

      primePremiumEntitlementFromProfile({
        plan: profile.plan,
        role: profile.role,
        updatedAt: profile.updatedAt,
      });
    })
    .catch(() => null);

  void refreshCurrentPremiumEntitlement().catch(() => null);

  return authUser;
}
