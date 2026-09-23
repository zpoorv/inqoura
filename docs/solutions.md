# Inqoura Comprehensive Remediation & Implementation Plan

**Target Document:** `solutions.md`  
**Related Audit:** [`problems.md`](problems.md)  
**Target Platform:** Android (Release), iOS, Web Preview  

This document presents an actionable, step-by-step engineering roadmap to resolve every weakness and vulnerability cataloged in [`problems.md`](problems.md). Each section outlines the technical solution, exact file modifications, architecture considerations, and verification criteria.

---

## Roadmap Overview

```
Phase 1: Safety & Algorithmic Accuracy (Allergen Tokenizer, Multilingual Dictionaries, Health Scoring)
   │
   ▼
Phase 2: Monetization, Billing & Privacy Compliance (Guest Entitlements, UMP Consent, AdMob Env Validation)
   │
   ▼
Phase 3: Backend, Cloud & Security Hardening (Firestore Chunking, Rule Optimization, Admin Hardening)
   │
   ▼
Phase 4: Architecture & Code Health (Decomposing ResultScreen, AsyncStorage Imports, Navigation Polish)
   │
   ▼
Phase 5: Observability & Resilience (Crashlytics/Sentry, OpenFoodFacts User-Agent, History Compaction)
   │
   ▼
Phase 6: Automated Testing & Verification (Jest Pure Logic Suite, Regression Testing)
```

---

## Phase 1: Critical Health, Safety & Algorithmic Fixes

### 1.1 Fix Allergen & Restriction Token Matching & Negation Filtering
* **Goal:** Eliminate false positives like `"eggplant"` matching `"egg"`, and `"gluten-free"` matching `"gluten"`.
* **Files to Modify:**
  * [`src/utils/restrictionMatching.ts`](src/utils/restrictionMatching.ts)
  * [`src/constants/restrictions.ts`](src/constants/restrictions.ts)
* **Implementation Details:**
  1. **Token Boundary Matching:** Replace `value.includes(normalizedKeyword)` with regex word boundary matching:
     ```ts
     const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}(?:$|[^a-z0-9])`, 'i');
     ```
  2. **Safe Phrase Exclusions (Negation Detection):**
     * Define a negation list for each allergen (e.g. `"gluten-free"`, `"dairy-free"`, `"egg-free"`, `"peanut-free"`, `"non-dairy"`).
     * If an ingredient or label matches a certified free-from phrase, suppress the corresponding allergen alert.
  3. **Disambiguation Exceptions:**
     * Create an explicit blacklist of safe words containing substrings (e.g., `"eggplant"` $\to$ not `"egg"`, `"butternut"` $\to$ not `"nut"`, `"grapefruit"` $\to$ not `"grape"`).

### 1.2 Implement Multilingual Restriction & Harmful Additive Dictionaries
* **Goal:** Ensure products with ingredient lists in French, German, Spanish, Italian, and other supported languages are accurately screened for allergens and additives.
* **Files to Modify:**
  * [`src/constants/restrictions.ts`](src/constants/restrictions.ts)
  * [`src/constants/harmfulIngredients.ts`](src/constants/harmfulIngredients.ts)
  * [`src/types/product.ts`](src/types/product.ts)
* **Implementation Details:**
  1. Add localized keyword sets to `RESTRICTION_DEFINITIONS`:
     * **Dairy:** *lait, beurre, crème, fromage, milch, käse, queso, leche, latte*.
     * **Gluten:** *blé, weizen, trigo, frumento, orge, gerste, cebada, seigle, roggen, centeno*.
     * **Egg:** *œuf, ei, huevo, uovo*.
     * **Peanut:** *arachide, erdnuss, cacahuete, arachidi*.
     * **Fish / Shellfish:** *poisson, fisch, pescado, pesce, crevette, garnele, gamba, gambero*.
  2. Map standardized OpenFoodFacts multilingual taxonomy tags (`en:gluten`, `fr:gluten`, `de:gluten`, `es:gluten`) into the matcher so structured API tags match directly regardless of language.

### 1.3 Unicode-Aware "Recognizable Ingredient" Health Scoring
* **Goal:** Prevent non-English/accented foods from being penalized as 0% recognizable.
* **Files to Modify:**
  * [`src/utils/productHealthScore.ts`](src/utils/productHealthScore.ts)
* **Implementation Details:**
  1. Replace the ASCII-only regex `/^[a-z\s-]+$/` with a Unicode letter pattern:
     ```ts
     const UNICODE_WORD_PATTERN = /^[\p{L}\s-]+$/u;
     ```
  2. Strip common diacritics / accents during normalization using `ingredient.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`.
  3. Maintain language-agnostic additive identification by prioritizing E-number patterns (`/\be ?\d{3,4}[a-z]?\b/i`) and standardized chemical markers over word count heuristics.

### 1.4 Refined Food vs. Non-Food Classification
* **Goal:** Prevent non-food products (baby oil, massage oil, cosmetic items) from scoring as food.
* **Files to Modify:**
  * [`src/utils/productType.ts`](src/utils/productType.ts)
* **Implementation Details:**
  1. Remove generic `'oil'` from `FOOD_KEYWORDS`. Replace with culinary oils: `'olive oil'`, `'vegetable oil'`, `'sunflower oil'`, `'canola oil'`, `'coconut oil'`, `'cooking oil'`.
  2. Add non-culinary oil triggers to `NON_FOOD_KEYWORDS`: `'motor oil'`, `'engine oil'`, `'baby oil'`, `'massage oil'`, `'mineral oil'`, `'diffuser'`.

---

## Phase 2: Monetization, Billing & Privacy Compliance Fixes

### 2.1 Guest User Subscription Entitlement Support
* **Goal:** Allow guest (unauthenticated) users to subscribe without having their paid access locked out.
* **Files to Modify:**
  * [`src/services/premiumEntitlementService.ts`](src/services/premiumEntitlementService.ts)
  * [`src/screens/account/PremiumScreen.tsx`](src/screens/account/PremiumScreen.tsx)
* **Implementation Details:**
  1. In `loadCurrentPremiumEntitlement()`:
     * Check `revenueCatCustomerInfo` before checking Firebase authentication.
     * If RevenueCat returns an active entitlement (`getRevenueCatPremiumState(customerInfo).isActive === true`), grant premium access locally regardless of Firebase session status:
       ```ts
       const revenueCatState = getRevenueCatPremiumState(revenueCatCustomerInfo);
       if (revenueCatState.isActive) {
         const entitlement = buildPremiumEntitlement(
           trustedProfile.profile ?? { plan: 'premium', role: 'user', updatedAt: new Date().toISOString() },
           revenueCatState,
           'revenuecat'
         );
         setPremiumSession(entitlement);
         return entitlement;
       }
       ```
  2. On user sign-up/login, call `Purchases.logIn(newUserId)` in [`revenueCatService.ts`](src/services/revenueCatService.ts) to link the anonymous RevenueCat customer account to their new Firebase UID.

### 2.2 In-App AdMob Privacy Consent Management (GDPR/UMP)
* **Goal:** Fulfill Google Play and EU User Consent Policy mandates.
* **Files to Modify:**
  * [`src/services/adMobService.ts`](src/services/adMobService.ts)
  * [`src/screens/account/SupportSettingsScreen.tsx`](src/screens/account/SupportSettingsScreen.tsx)
* **Implementation Details:**
  1. Export a helper function `showAdConsentPrivacyOptions()` in `adMobService.ts`:
     ```ts
     export async function showAdConsentPrivacyOptions() {
       const mobileAdsModule = await import('react-native-google-mobile-ads');
       return mobileAdsModule.AdsConsent.showPrivacyOptionsForm();
     }
     ```
  2. Add a **"Privacy & Ad Preferences"** row in Support / Settings allowing EU/EEA/UK users to open Google's privacy options form and modify their consent anytime.

### 2.3 Production Build Environment Validation
* **Goal:** Ensure production builds fail fast if production AdMob unit IDs are missing.
* **Files to Modify:**
  * [`src/services/adMobService.ts`](src/services/adMobService.ts)
  * Build scripts / CI configuration
* **Implementation Details:**
  1. In release mode (`!__DEV__`), throw a clear runtime configuration warning or report a fatal log if `EXPO_PUBLIC_ADMOB_*` matches the fallback test ID `ca-app-pub-3940256099942544...`.

---

## Phase 3: Backend, Cloud & Security Hardening

### 3.1 Chunked Firestore Batch Operations (500-Op Limit Fix)
* **Goal:** Prevent account deletion and history replacement crashes for users with large scan histories.
* **Files to Modify:**
  * [`src/services/cloudUserDataService.ts`](src/services/cloudUserDataService.ts)
* **Implementation Details:**
  1. Implement a generic batch chunking utility:
     ```ts
     const FIRESTORE_BATCH_LIMIT = 400; // Safe threshold below 500 limit

     async function commitBatchInChunks<T>(
       db: Firestore,
       items: T[],
       buildOp: (batch: WriteBatch, item: T) => void
     ) {
       for (let i = 0; i < items.length; i += FIRESTORE_BATCH_LIMIT) {
         const chunk = items.slice(i, i + FIRESTORE_BATCH_LIMIT);
         const batch = writeBatch(db);
         chunk.forEach((item) => buildOp(batch, item));
         await batch.commit();
       }
     }
     ```
  2. Refactor `deleteRemoteUserData(uid)` and `replaceRemoteScanHistory(uid, entries)` to delete/write documents using chunked batches.

### 3.2 Eliminate Firestore Read Amplification in Security Rules
* **Goal:** Cut unnecessary billable Firestore document reads on administrative queries.
* **Files to Modify:**
  * [`firestore.rules`](firestore.rules)
* **Implementation Details:**
  1. Ensure admin authentication strictly uses Firebase Custom Claims (`request.auth.token.admin == true`).
  2. Deprecate `hasAdminRoleDocument()` in security rules once admin claims are fully populated via `scripts/grant_admin_claim.mjs`.

### 3.3 Harden Admin Panel Server
* **Goal:** Protect administrative tooling against unauthorized network access and brute-force attempts.
* **Files to Modify:**
  * [`admin_panel/server.mjs`](admin_panel/server.mjs)
* **Implementation Details:**
  1. Ensure server listens strictly on `127.0.0.1` (never `0.0.0.0`).
  2. Add essential security headers:
     * `X-Content-Type-Options: nosniff`
     * `Content-Security-Policy: default-src 'self' https://*.firebaseio.com https://*.googleapis.com;`
  3. Add in-memory sliding window IP rate limiting for authentication attempts (e.g. max 10 attempts per minute per IP).

---

## Phase 4: Architecture, Code Quality & `AGENTS.md` Alignment

### 4.1 Modularize `ResultScreen.tsx` (< 200 Lines Rule)
* **Goal:** Break down the 2,102-line monolithic screen into focused, single-responsibility components under `src/components/result/`.
* **Proposed Structure:**
  ```
  src/
  ├── screens/
  │   └── core/
  │       ├── ResultScreen.tsx           (~180 lines: coordinator, routing, state)
  │       └── resultScreenStyles.ts      (Extracted style sheet)
  └── components/
      └── result/
          ├── ResultHeroScoreCard.tsx    (Score wheel, health grade badge)
          ├── ResultVerdictCard.tsx      (Decision summary & quick use guidance)
          ├── ResultNutritionGrid.tsx    (NutriScore, NOVA, nutrients breakdown)
          ├── ResultIngredientsList.tsx  (Highlighted ingredients & explanation trigger)
          ├── ResultActionFooter.tsx     (Share, report issue, trust verification)
          └── ResultShareModal.tsx       (ViewShot capture & template picker)
  ```
* **Also Refactor:**
  * [`src/components/ShareResultCard.tsx`](src/components/ShareResultCard.tsx) (827 lines $\to$ isolate style template skins into separate files).
  * [`src/services/gamificationService.ts`](src/services/gamificationService.ts) (726 lines $\to$ separate quest evaluators and streak storage).

### 4.2 Standardize Bottom Tab Navigation
* **Goal:** Preserve screen scroll positions and component lifecycle across primary routes.
* **Files to Modify:**
  * [`src/navigation/RootNavigator.tsx`](src/navigation/RootNavigator.tsx)
* **Implementation Details:**
  1. Replace the custom absolute stack overlay with standard `@react-navigation/bottom-tabs` for the 5 primary tabs: `Home`, `Scanner`, `History`, `Premium`, `Account`.
  2. Move detail screens (`Result`, `Help`, `Settings`) into a parent Native Stack Navigator wrapping the Tab Navigator.
  3. Remove arbitrary bottom padding computations (`Math.max(insets.bottom + 122, 148)`) across individual screens.

### 4.3 Replace Private AsyncStorage Import Shim
* **Goal:** Eliminate bundler risks and remove unnecessary declaration files.
* **Files to Modify:**
  * 20+ files in `src/services/`
  * [`src/types/async-storage.d.ts`](src/types/async-storage.d.ts) (Delete file)
* **Implementation Details:**
  1. Replace all occurrences of:
     ```ts
     import AsyncStorage from '@react-native-async-storage/async-storage/lib/commonjs/index';
     ```
     with standard package import:
     ```ts
     import AsyncStorage from '@react-native-async-storage/async-storage';
     ```
  2. Delete `src/types/async-storage.d.ts`.

### 4.4 Hoist Component Stylesheets
* **Goal:** Eliminate frame drops caused by creating 500-line stylesheets on every render of child components.
* **Files to Modify:**
  * [`src/screens/core/ResultScreen.tsx`](src/screens/core/ResultScreen.tsx) (`MetricChip`)
* **Implementation Details:**
  1. Hoist style creation to component module level or inject only the dynamic colors:
     ```ts
     // Instead of createStyles(colors, typography) on every chip:
     <View style={[styles.metricChip, { borderColor: dynamicColor }]} />
     ```

---

## Phase 5: Observability, Error Handling & Reliability

### 5.1 Connect Remote Telemetry & Crash Reporting
* **Goal:** Gain real-time visibility into production crashes and failed scan lookups.
* **Files to Modify:**
  * [`src/services/appMonitoringService.ts`](src/services/appMonitoringService.ts)
  * [`src/services/analyticsService.ts`](src/services/analyticsService.ts)
  * [`src/App.tsx`](src/App.tsx)
* **Implementation Details:**
  1. Wire `setMonitoringAdapter` during app bootstrap to forward fatal and non-fatal errors to Sentry or Firebase Crashlytics:
     ```ts
     setMonitoringAdapter((record) => {
       if (record.level === 'fatal') {
         // crashlytics().recordError(new Error(record.message));
       }
     });
     ```
  2. Wire `setAnalyticsAdapter` to log events via Firebase Analytics.

### 5.2 Add OpenFoodFacts Compliant User-Agent
* **Goal:** Prevent 429 rate-limiting and 403 blocks from OpenFoodFacts API.
* **Files to Modify:**
  * [`src/services/http.ts`](src/services/http.ts)
* **Implementation Details:**
  1. Define a standard user agent header:
     ```ts
     const USER_AGENT = `Inqoura - Android - Version 1.1.1 - https://inqoura.web.app`;
     ```
  2. Pass `{ headers: { 'User-Agent': USER_AGENT } }` into all fetch requests directed to OpenFoodFacts.

### 5.3 Optimize Local Scan History Storage Payload
* **Goal:** Keep AsyncStorage read/write operations under 50ms and eliminate UI stutters.
* **Files to Modify:**
  * [`src/services/scanHistoryStorage.ts`](src/services/scanHistoryStorage.ts)
* **Implementation Details:**
  1. Instead of storing the full `ResolvedProduct` in the history array, store a lightweight record `ScanHistorySummary`:
     ```ts
     type ScanHistorySummary = {
       barcode: string;
       name: string;
       brand: string | null;
       imageUrl: string | null;
       score: number | null;
       gradeLabel: string | null;
       riskLevel: string;
       riskSummary: string;
       scannedAt: string;
     };
     ```
  2. Full product details can remain in `sessionResourceCache` or be loaded on-demand when tapping an item.

### 5.4 Defensive Null Checks in History Search
* **Goal:** Prevent unhandled crashes when searching history items with unknown profile IDs.
* **Files to Modify:**
  * [`src/screens/core/HistoryScreen.tsx`](src/screens/core/HistoryScreen.tsx)
* **Implementation Details:**
  ```ts
  // Replace:
  getDietProfileDefinition(entry.profileId).label
  // With:
  getDietProfileDefinition(entry.profileId)?.label ?? ''
  ```

---

## Phase 6: Automated Testing & Verification

### 6.1 Test Environment Setup
* **Dependencies to Install:**
  * `jest`
  * `jest-expo`
  * `@testing-library/react-native`
  * `@types/jest`
* **Configuration:**
  * Add `"test": "jest"` to `package.json`.
  * Create `jest.config.js` with preset `jest-expo`.

### 6.2 Test Suite Matrix
Create targeted unit test suites for all pure algorithmic functions:

| Test Suite | File Under Test | Test Cases Covered |
| :--- | :--- | :--- |
| `restrictionMatching.test.ts` | `src/utils/restrictionMatching.ts` | Eggplant vs Egg, Gluten-Free oat products, Dairy-free cheese, Multilingual terms |
| `productHealthScore.test.ts` | `src/utils/productHealthScore.ts` | Accented French/Spanish ingredients, E-number penalties, Additive scoring, Missing nutrition fallbacks |
| `householdFit.test.ts` | `src/utils/householdFit.ts` | Multiple family profiles, Strict vs Moderate restrictions, Conflicting allergens |
| `productType.test.ts` | `src/utils/productType.ts` | Edible oils vs Baby/Motor oils, Cosmetics, Packaged snacks |
| `cloudUserDataService.test.ts` | `src/services/cloudUserDataService.ts` | Batch chunking with 1,200 history items to verify $\le 400$ op chunking |

---

## Execution Status & Progress

- [x] **Safety & Algorithmic Accuracy (Completed)**
  - [x] Implement token boundary and negation matching in `restrictionMatching.ts` (prevents "eggplant" triggering "egg", handles "-free" negations).
  - [x] Support Unicode letters (`\p{L}`) in health score recognizable ingredient calculation.
  - [x] Add European language keywords and Open Food Facts taxonomy tags to allergen definitions.
  - [x] Distinguish culinary/edible oils from non-food or cosmetic oils in food classification.
- [x] **Backend & Cloud Resilience (Completed)**
  - [x] Chunk Firestore batch writes (<= 500 operations) in `cloudUserDataService.ts`.
  - [x] Add compliant `User-Agent` header (`Inqoura-App/1.1.1`) to Open Food Facts API requests.
- [x] **Cross-Platform & Web Support (Completed)**
  - [x] Configure `app.json` web output to `"single"` for React Navigation SPA mode.
  - [x] Create web mock in `src/mocks/googleMobileAdsMock.ts` and Metro interceptor in `metro.config.js` to prevent web bundler hangs.
- [x] **Automated Domain Testing (Completed)**
  - [x] Implement automated test suite in `scripts/test_domain_logic.mjs` run via `npm test`.
  - [x] Add automated test coverage for allergen boundary matching, health score Unicode parsing, oil classification, and batch chunking.
- [ ] **Follow-Up Engineering Sprints (In Progress)**
  - [ ] Update `loadCurrentPremiumEntitlement()` to unlock guest RevenueCat purchases.
  - [ ] Replace deep AsyncStorage imports across `src/services/` and delete `async-storage.d.ts`.
  - [ ] Add safety null check in `HistoryScreen.tsx`.
  - [ ] Decompose `ResultScreen.tsx` into modular components under `src/components/result/`.
  - [ ] Add AdMob privacy options button in settings.
  - [ ] Wire remote crash reporting adapter in `appMonitoringService.ts`.
