import type { DietProfileId } from '../constants/dietProfiles';
import type { AppearanceMode, AppLookId } from './preferences';
import type { ShareCardStyleId } from './shareCardStyle';

export type UserRole = 'admin' | 'premium' | 'user';
export type HistoryNotificationCadence = 'smart' | 'weekly';

export type UserProfile = {
  appLookId: AppLookId;
  appearanceMode: AppearanceMode;
  comparisonProductCodes: string[];
  countryCode: string | null;
  createdAt: string;
  dietProfileId: DietProfileId;
  email: string;
  favoriteProductCodes: string[];
  historyInsightsEnabled: boolean;
  historyNotificationCadence: HistoryNotificationCadence;
  historyNotificationsEnabled: boolean;
  name: string;
  plan: 'free' | 'premium';
  role: UserRole;
  shareCardStyleId: ShareCardStyleId;
  uid: string;
  updatedAt: string;
};
