import type { ProductFoodStatus } from '../utils/productType';
import type { ResultConfidence } from '../utils/resultAnalysis';

export type CorrectionReportReason =
  | 'wrong-score'
  | 'wrong-product-details'
  | 'bad-ingredient-read'
  | 'wrong-alternatives'
  | 'other';

export type CorrectionReportStatus = 'open' | 'reviewing' | 'resolved';

export type CorrectionReport = {
  barcode: string;
  confidence: ResultConfidence;
  createdAt: string;
  foodStatus: ProductFoodStatus;
  id: string;
  priorityScore: number;
  productName: string;
  reason: CorrectionReportReason;
  reporterEmail: string | null;
  reporterName: string | null;
  reporterUid: string | null;
  resultSource: 'barcode' | 'ingredient-ocr';
  status: CorrectionReportStatus;
  summary: string;
  topConcern: string | null;
};
