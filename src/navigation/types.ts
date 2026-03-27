import type { DietProfileId } from '../constants/dietProfiles';
import type { LoginScreenParams } from '../models/auth';
import type { PremiumFeatureId } from '../models/premium';
import type { ResolvedProduct } from '../types/product';
import type { ScanResultSource } from '../types/scanner';

export type RootStackParamList = {
  About: undefined;
  Feedback: undefined;
  Help: undefined;
  Home: undefined;
  History: undefined;
  Login: LoginScreenParams;
  IngredientOcr:
    | {
        profileId?: DietProfileId;
      }
    | undefined;
  PrivacyPolicy: undefined;
  Premium:
    | {
        featureId?: PremiumFeatureId;
      }
    | undefined;
  ProfileDetails: undefined;
  ResetPassword: undefined;
  Scanner:
    | {
        profileId?: DietProfileId;
      }
    | undefined;
  Settings: undefined;
  SignUp: undefined;
  Result: {
    barcode: string;
    barcodeType?: string | null;
    persistToHistory?: boolean;
    profileId?: DietProfileId;
    product: ResolvedProduct;
    resultSource?: ScanResultSource;
  };
};
