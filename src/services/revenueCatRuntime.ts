import { subscribeAuthSession } from '../store';
import { refreshCurrentPremiumEntitlement } from './premiumEntitlementService';
import {
  initializeRevenueCatForCurrentUser,
  isRevenueCatNetworkError,
  subscribeToRevenueCatCustomerInfoUpdates,
} from './revenueCatService';

export function startRevenueCatRuntime() {
  let unsubscribeCustomerInfo: () => void = () => {};
  let isDisposed = false;
  let hasAttachedCustomerListener = false;

  const refreshEntitlementSafely = async () => {
    try {
      await refreshCurrentPremiumEntitlement();
    } catch (error) {
      if (isRevenueCatNetworkError(error)) {
        return;
      }

      // Keep billing refresh failures from interrupting the app shell.
    }
  };

  const ensureRuntime = async () => {
    const isReady = await initializeRevenueCatForCurrentUser().catch(() => false);

    if (isDisposed || !isReady) {
      return;
    }

    if (!hasAttachedCustomerListener) {
      unsubscribeCustomerInfo = await subscribeToRevenueCatCustomerInfoUpdates(() => {
        void refreshEntitlementSafely();
      });
      hasAttachedCustomerListener = true;
    }

    await refreshEntitlementSafely();
  };

  void ensureRuntime().catch(() => {
    // Billing runtime should never block app startup.
  });

  const unsubscribeAuth = subscribeAuthSession(() => {
    void ensureRuntime().catch(() => {
      // Auth changes should not surface billing runtime errors in the UI.
    });
  });

  return () => {
    isDisposed = true;
    unsubscribeAuth();
    unsubscribeCustomerInfo();
  };
}
