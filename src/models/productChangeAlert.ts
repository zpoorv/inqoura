export type ProductChangeAlert = {
  barcode: string;
  changedFields: string[];
  detectedAt: string;
  id: string;
  name: string;
  previousScannedAt: string;
  severity: 'caution' | 'high';
  summary: string;
};
