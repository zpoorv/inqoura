export type AdminAppConfig = {
  enableHistory: boolean;
  enableIngredientOcr: boolean;
  enableManualBarcodeEntry: boolean;
  enableRuleBasedSuggestions: boolean;
  homeAnnouncementBody: string | null;
  homeAnnouncementTitle: string | null;
  resultDisclaimer: string | null;
  resultSupportMessage: string | null;
  shareFooterText: string | null;
  showSourceAttribution: boolean;
  supportEmail: string | null;
  updatedAt: string | null;
};
