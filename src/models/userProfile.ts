import type { DietProfileId } from '../constants/dietProfiles';
import type { AppearanceMode } from './preferences';

export type UserRole = 'admin' | 'premium' | 'user';

export type UserProfile = {
  age: number | null;
  appearanceMode: AppearanceMode;
  countryCode: string | null;
  createdAt: string;
  dietProfileId: DietProfileId;
  email: string;
  name: string;
  plan: 'free' | 'premium';
  role: UserRole;
  uid: string;
  updatedAt: string;
};
