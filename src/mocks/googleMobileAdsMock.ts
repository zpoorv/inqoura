import { View, Text } from 'react-native';

export const TestIds = {
  REWARDED: '',
  NATIVE: '',
};

export const AdsConsent = {
  requestInfoUpdate: async () => ({ canRequestAds: false, isConsentFormAvailable: false }),
  showConsentFormIfRequired: async () => ({ canRequestAds: false }),
  getUserChoices: async () => ({ storeAndAccessInformationOnDevice: false }),
};

export const AdsConsentStatus = {
  OBTAINED: 'OBTAINED',
  REQUIRED: 'REQUIRED',
  NOT_REQUIRED: 'NOT_REQUIRED',
  UNKNOWN: 'UNKNOWN',
};

export const RewardedAd = {
  createForAdRequest: () => ({
    load: () => {},
    addAdEventListener: () => () => {},
  }),
};

export const RewardedAdEventType = {
  LOADED: 'loaded',
  EARNED_REWARD: 'earned_reward',
  ERROR: 'error',
};

export const NativeAdView = View;
export const AdIconView = View;
export const HeadlineView = Text;
export const TaglineView = Text;
export const AdvertiserView = Text;
export const CallToActionView = View;

export default function mobileAds() {
  return {
    initialize: async () => [],
    setRequestConfiguration: async () => {},
  };
}
