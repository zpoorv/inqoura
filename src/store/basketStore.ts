import { useSyncExternalStore } from 'react';
import type { ResolvedProduct } from '../types/product';

export interface BasketItem {
  product: ResolvedProduct;
  scannedAt: number;
  hasAllergenHazard: boolean;
  score: number;
}

export interface BasketState {
  items: BasketItem[];
  isSessionActive: boolean;
  totalItems: number;
  averageScore: number;
  allergenAlertCount: number;
}

type BasketListener = () => void;

let items: BasketItem[] = [];
let isSessionActive = false;
const listeners = new Set<BasketListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function computeProductScore(product: ResolvedProduct): number {
  if (product.adminMetadata?.customScore != null) {
    return product.adminMetadata.customScore;
  }
  // Heuristic based on Nutri-Score / NOVA
  let baseScore = 75;
  if (product.nutriScore) {
    const map: Record<string, number> = { a: 95, b: 80, c: 60, d: 40, e: 20 };
    baseScore = map[product.nutriScore.toLowerCase()] ?? 60;
  }
  if (product.novaGroup === 4) {
    baseScore = Math.min(baseScore, 45);
  } else if (product.novaGroup === 1) {
    baseScore = Math.max(baseScore, 85);
  }
  return baseScore;
}

function computeSnapshot(): BasketState {
  const totalItems = items.length;
  const allergenAlertCount = items.filter((item) => item.hasAllergenHazard).length;
  const averageScore =
    totalItems === 0
      ? 100
      : Math.round(items.reduce((sum, item) => sum + item.score, 0) / totalItems);

  return {
    items: [...items],
    isSessionActive,
    totalItems,
    averageScore,
    allergenAlertCount,
  };
}

let cachedSnapshot = computeSnapshot();

function updateState() {
  cachedSnapshot = computeSnapshot();
  notify();
}

export function addBasketItem(product: ResolvedProduct, hasAllergenHazard = false) {
  const score = computeProductScore(product);
  items = [
    {
      product,
      scannedAt: Date.now(),
      hasAllergenHazard,
      score,
    },
    ...items,
  ];
  updateState();
}

export function removeBasketItem(barcode: string) {
  items = items.filter((item) => item.product.barcode !== barcode);
  updateState();
}

export function clearBasket() {
  items = [];
  updateState();
}

export function setBasketSessionActive(active: boolean) {
  isSessionActive = active;
  updateState();
}

export function getBasketState(): BasketState {
  return cachedSnapshot;
}

export function subscribeBasket(listener: BasketListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useBasketStore(): BasketState & {
  addItem: typeof addBasketItem;
  removeItem: typeof removeBasketItem;
  clear: typeof clearBasket;
  setActive: typeof setBasketSessionActive;
} {
  const state = useSyncExternalStore(subscribeBasket, getBasketState, getBasketState);

  return {
    ...state,
    addItem: addBasketItem,
    removeItem: removeBasketItem,
    clear: clearBasket,
    setActive: setBasketSessionActive,
  };
}
