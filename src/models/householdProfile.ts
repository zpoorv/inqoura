import type { DietProfileId } from '../constants/dietProfiles';
import type { RestrictionId, RestrictionSeverity } from './restrictions';

export type HouseholdProfile = {
  dietProfileId: DietProfileId;
  id: string;
  name: string;
  restrictionIds: RestrictionId[];
  restrictionSeverity: RestrictionSeverity;
};
