import type { ResolvedProduct } from '../services/productLookup';

export type RootStackParamList = {
  Home: undefined;
  Scanner: undefined;
  Result: {
    barcode: string;
    barcodeType?: string | null;
    product: ResolvedProduct;
  };
};
