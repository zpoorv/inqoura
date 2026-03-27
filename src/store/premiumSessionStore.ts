import {
  createDefaultPremiumEntitlement,
  type PremiumEntitlement,
} from '../models/premium';

type PremiumSessionListener = (entitlement: PremiumEntitlement) => void;

const listeners = new Set<PremiumSessionListener>();

let currentPremiumEntitlement = createDefaultPremiumEntitlement();

export function getPremiumSession() {
  return currentPremiumEntitlement;
}

export function setPremiumSession(nextEntitlement: PremiumEntitlement) {
  currentPremiumEntitlement = nextEntitlement;
  listeners.forEach((listener) => listener(currentPremiumEntitlement));
}

export function clearPremiumSession() {
  setPremiumSession(createDefaultPremiumEntitlement());
}

export function subscribePremiumSession(listener: PremiumSessionListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
