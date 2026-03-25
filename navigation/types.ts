import type { DietProfileId } from '../constants/dietProfiles';
import type { ResolvedProduct } from '../services/productLookup';

export type RootStackParamList = {
  Home: undefined;
  History: undefined;
  Scanner:
    | {
        profileId?: DietProfileId;
      }
    | undefined;
  Result: {
    barcode: string;
    barcodeType?: string | null;
    persistToHistory?: boolean;
    profileId?: DietProfileId;
    product: ResolvedProduct;
  };
};
