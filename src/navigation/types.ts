import type { DietProfileId } from '../constants/dietProfiles';
import type { AuthScreenParams } from '../models/auth';
import type { PremiumFeatureId } from '../models/premium';
import type { ResolvedProduct } from '../types/product';
import type { ScanResultSource } from '../types/scanner';

export type RootStackParamList = {
  About: undefined;
  Account: undefined;
  AccountIntro: AuthScreenParams;
  AccountSettings: undefined;
  AppearanceSettings: undefined;
  Feedback: undefined;
  Help: undefined;
  Home: undefined;
  History: undefined;
  HouseholdSettings: undefined;
  NotificationCenter: undefined;
  NotificationSettings: undefined;
  PrivacyPolicy: undefined;
  Premium:
    | {
        featureId?: PremiumFeatureId;
      }
    | undefined;
  ResetPassword: undefined;
  Scanner:
    | {
        profileId?: DietProfileId;
      }
    | undefined;
  SupportSettings: undefined;
  Result: {
    barcode: string;
    barcodeType?: string | null;
    persistToHistory?: boolean;
    profileId?: DietProfileId;
    product: ResolvedProduct;
    productSnapshotSource?: 'search-cache' | 'search-index';
    revalidateOnOpen?: boolean;
    resultSource?: ScanResultSource;
  };
};
