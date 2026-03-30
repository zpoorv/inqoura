import type { DietProfileId } from '../constants/dietProfiles';
import type { ResolvedProduct } from '../types/product';
import type { ResultConfidence } from '../utils/resultAnalysis';

export type ComparisonSessionEntry = {
  addedAt: string;
  barcode: string;
  confidence: ResultConfidence;
  decisionSummary: string;
  decisionVerdict: string;
  name: string;
  product: ResolvedProduct;
  profileId: DietProfileId;
  topConcern: string | null;
};

export type ComparisonSession = {
  entries: ComparisonSessionEntry[];
  updatedAt: string | null;
};
