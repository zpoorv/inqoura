import { addDoc, collection, getFirestore } from 'firebase/firestore';

import type {
  CorrectionReport,
  CorrectionReportReason,
} from '../models/correctionReport';
import type { ProductFoodStatus } from '../utils/productType';
import type { ResultConfidence } from '../utils/resultAnalysis';
import { getFirebaseAppInstance } from './firebaseApp';
import { getAuthSession } from '../store';

type SubmitCorrectionReportInput = {
  barcode: string;
  confidence: ResultConfidence;
  foodStatus: ProductFoodStatus;
  priorityScore: number;
  productName: string;
  reason: CorrectionReportReason;
  resultSource: 'barcode' | 'ingredient-ocr';
  summary: string;
  topConcern: string | null;
};

function getDb() {
  return getFirestore(getFirebaseAppInstance());
}

export function buildCorrectionReportSummary(
  reason: CorrectionReportReason,
  topConcern: string | null
) {
  switch (reason) {
    case 'wrong-score':
      return topConcern
        ? `The score or verdict may be off for a product flagged around ${topConcern}.`
        : 'The score or verdict may not match this product.';
    case 'wrong-product-details':
      return 'The product name, image, brand, or key details look wrong.';
    case 'bad-ingredient-read':
      return 'The ingredient read looks partial, noisy, or clearly incorrect.';
    case 'wrong-alternatives':
      return 'The suggested alternatives do not seem like the right fit.';
    default:
      return 'This product may need a manual review.';
  }
}

export async function submitCorrectionReport(
  input: SubmitCorrectionReportInput
) {
  const session = getAuthSession();
  const now = new Date().toISOString();
  const report: Omit<CorrectionReport, 'id'> = {
    barcode: input.barcode,
    confidence: input.confidence,
    createdAt: now,
    foodStatus: input.foodStatus,
    priorityScore: input.priorityScore,
    productName: input.productName,
    reason: input.reason,
    reporterEmail: session.user?.email ?? null,
    reporterName: session.user?.displayName ?? null,
    reporterUid: session.user?.id ?? null,
    resultSource: input.resultSource,
    status: 'open',
    summary: input.summary,
    topConcern: input.topConcern,
  };

  const docRef = await addDoc(collection(getDb(), 'correctionReports'), report);
  return { ...report, id: docRef.id } satisfies CorrectionReport;
}
