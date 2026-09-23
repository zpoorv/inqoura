# Inqoura Project Analysis Report

**Generated on:** September 23, 2026  
**Project:** Inqoura (`inqoura` v1.1.1)  
**Target Platform:** Android (Primary Store Release), iOS (Compatible), Web (Preview)

---

## 1. Executive Summary

**Inqoura** is an advanced packaged-food decision assistant and ingredient scanner application built with **React Native (0.81.5)**, **Expo (SDK 54)**, and **React 19**. The application enables users to make informed grocery and dietary decisions through live barcode scanning, OCR-based ingredient text extraction, algorithmic nutritional scoring, allergen and dietary restriction matching, and multi-member household compatibility assessments.

The codebase is in an advanced pre-release / beta stage preparing for Android Google Play Store launch. It features a complete mobile client, robust multi-language internationalization (12 languages including RTL support), fine-grained Firebase Firestore security rules, RevenueCat subscription monetization, AdMob advertising integrations, and an operational standalone Node.js administrative panel.

---

## 2. Architecture & Technical Stack

```
+---------------------------------------------------------------------------------+
|                                 Inqoura Client                                  |
|                                                                                 |
|  +--------------------+  +--------------------+  +---------------------------+  |
|  |   Screens (18)     |  |  Components (~45)  |  |       Stores (5)          |  |
|  | - Core (Home, Scan,|  | - Reusable Cards   |  | - authSessionStore        |  |
|  |   Result, History) |  | - Modals & Sheets  |  | - premiumSessionStore     |  |
|  | - Account & Auth   |  | - Skeletons & Tips |  | - profileSessionStore     |  |
|  | - Support & Legal  |  | - Share Visualizers|  | - notificationCenterStore |  |
|  +--------------------+  +--------------------+  +---------------------------+  |
|            |                       |                           |                |
|  +---------------------------------------------------------------------------+  |
|  |                           Services Layer (~45)                            |  |
|  | - productLookup, openFoodFacts, productCatalogService                     |  |
|  | - authService, firebaseAuth, cloudUserDataService, sessionDataService     |  |
|  | - revenueCatService, adMobService, gamificationService                   |  |
|  | - scanHistoryStorage, barcodeLookupCache, sessionResourceCache           |  |
|  +---------------------------------------------------------------------------+  |
|            |                       |                           |                |
|  +--------------------+  +--------------------+  +---------------------------+  |
|  |     Utils (25)     |  |    Models (18)     |  |      Constants (22)       |  |
|  | - productHealthScore| | - userProfile      |  | - theme, colors           |  |
|  | - resultAnalysis   |  | - restrictions     |  | - translations (12 langs) |  |
|  | - householdFit     |  | - householdProfile |  | - harmfulIngredients      |  |
|  | - restrictionMatch |  | - premium          |  | - dietProfiles, gamify    |  |
|  +--------------------+  +--------------------+  +---------------------------+  |
+---------------------------------------------------------------------------------+
                         |                                  |
                         v                                  v
+---------------------------------------+  +--------------------------------------+
|            External APIs              |  |         Internal Tooling             |
| - OpenFoodFacts API (Product DB)      |  | - admin_panel/ (Node server :4173)   |
| - Firebase Auth & Cloud Firestore     |  | - scripts/ (bootstrap, indexer)      |
| - RevenueCat (Subscriptions)          |  | - privacy/ (static web compliance)   |
| - Google Mobile Ads (AdMob)           |  |                                      |
| - MLKit (On-device Text OCR)          |  |                                      |
+---------------------------------------+  +--------------------------------------+
```

### Core Technologies
- **Framework & Runtime:** Expo SDK ~54.0.33, React 19.1.0, React Native 0.81.5, Node 20+.
- **Language & Typings:** TypeScript ~5.9.2 (Strict type-checking active).
- **Navigation:** `@react-navigation/native` v7, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`.
- **Vision & Scanning:** `expo-camera` for real-time barcode scanning, `@infinitered/react-native-mlkit-text-recognition` for OCR parsing of physical ingredient labels, `expo-image-picker` and `expo-image-manipulator` for gallery selection.
- **Backend & Cloud:** Firebase Auth (Email/Password, Google Sign-In via `@react-native-google-signin/google-signin`), Cloud Firestore, Cloud Storage, Firebase App Check / Play Integrity.
- **Monetization:** RevenueCat (`react-native-purchases` and `react-native-purchases-ui`), AdMob (`react-native-google-mobile-ads` with rewarded and native ads).
- **State Management:** Custom reactive observer stores (`src/store/`) utilizing subscription hooks and listeners, bypassing heavy third-party libraries (no Redux).
- **Offline & Caching:** Multi-layer cache (`sessionResourceCache.ts`, `barcodeLookupCache.ts`, `@react-native-async-storage/async-storage`).
- **Sharing & UI Utilities:** `react-native-view-shot` for snapshotting customized verdict summary cards, `expo-sharing`, `expo-haptics`.

---

## 3. Key Subsystems & Feature Breakdown

### 3.1 Scanner & Decision Verdict Pipeline
1. **Input Vectors:** Real-time barcode scan via camera, manual numeric barcode input modal, or label OCR capture.
2. **Catalog Resolution:** Stale-while-revalidate / cache-first lookup querying local cache -> Firestore product catalog overrides -> OpenFoodFacts REST API.
3. **Health Scoring Algorithm:** (`src/utils/productHealthScore.ts`):
   - Computes a comprehensive 0-100 score starting from a balanced base.
   - Adjusts for Nova group processing levels, Nutri-Score grades, recognizable vs. unrecognizable ingredient ratios, high-risk additives (e.g., sodium nitrite, artificial flavors, HFCS, aspartame), and nutrient densities (sugar, salt, saturated fat).
4. **Dietary & Allergen Filtering:** Evaluates user restrictions (Dairy, Gluten, Eggs, Fish, Peanuts, Soy, Shellfish, Tree nuts, Sesame, Lactose, Vegan, Vegetarian, Palm Oil) with match severity ratings.
5. **Household Fit Assessment:** Evaluates product safety across multiple household members simultaneously, flagging any conflicting profile rules.
6. **Verdict Formulation:** Assigns clear decision tiers (`Good regular pick`, `Okay occasionally`, `Not ideal often`, `Need better data`).

### 3.2 User Experience & Engagement
- **Guest-First Workflow:** Full scanning and evaluation accessible immediately without mandatory sign-up; accounts can be linked subsequently to preserve history and sync across devices.
- **Gamification:** Quests, daily scan streak counters, badge tiers, and product trust validation loops (`src/services/gamificationService.ts`).
- **Personalization:** App look customizer (custom light/dark/brand accents), dietary profile presets, custom share-card styles.
- **Notifications:** In-app Notification Center (`src/screens/support/NotificationCenterScreen.tsx`) paired with local background reminders for scan re-evaluations.

### 3.3 Internationalization (i18n)
- Comprehensive multi-lingual support covering 12 languages: English, Spanish, Simplified Chinese, Hindi, Arabic, Portuguese, French, Japanese, German, Korean, Indonesian, and Russian.
- Built-in Right-to-Left (RTL) handling for Arabic (`isRightToLeftLanguage`).

### 3.4 Admin Operations & Security
- **Admin Portal (`admin_panel/`):** Self-contained Node HTTP server running on port 4173 with authentication guards, product catalog manager, user account inspector, correction report moderator, and runtime app configuration toggles.
- **Security Hardening:** Documented compliance protocols (`FIREBASE_GITHUB_SECURITY_CHECKLIST.md`, `SECURITY_HARDENING.md`, `PLAY_INTEGRITY_PLAN.md`).
- **Firestore Security Rules (`firestore.rules`):** Over 340 lines of battle-tested rules strictly enforcing field schemas, type validations, string length bounds, owner permissions, and admin custom claims.

---

## 4. Evaluation Against Project Rules (`AGENTS.md`)

| Rule | Status | Analysis |
| :--- | :---: | :--- |
| **Use React Native with Expo only** | **PASS** | Strict adherence. Uses Expo SDK 54, Expo config plugins, and standard React Native components. |
| **Use functional components with hooks** | **PASS** | 100% functional component codebase. Standard hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useFocusEffect`) applied consistently. |
| **Keep components small and reusable** | **MIXED** | UI components in `src/components/` are modular and reusable, but select components (notably `ShareResultCard.tsx` at 827 lines) have accumulated excessive presentation and style logic. |
| **Do not add unnecessary dependencies** | **PASS** | Every package in `package.json` maps directly to required core capabilities (camera, purchases, ads, auth, storage). No extraneous helper libraries. |
| **Use simple and clean UI** | **PASS** | Cohesive card-based design system, unified color tokens, skeleton loaders, and tactile haptic feedback. |
| **Avoid complex state management (no Redux)** | **PASS** | Avoids Redux/MobX. Uses lightweight, subscription-based reactive stores (`src/store/index.ts`). |
| **Architecture separation** | **PASS** | Strict structural boundaries maintained: Screens -> Layout, Components -> UI, Services -> API/Storage, Utils -> Logic, Models -> Types. |
| **Keep files under 200 lines if possible** | **VIOLATIONS IDENTIFIED** | **Several critical files significantly exceed the 200-line guideline (see Hotspots below).** |

### File Length Hotspots (> 200 Lines)
While utility and dictionary files (`translations.ts`, `generatedTranslationPack.ts`) naturally exceed 200 lines due to data mappings, several application components and screens require modularization:

1. **Screens:**
   - [`src/screens/core/ResultScreen.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/screens/core/ResultScreen.tsx): **2,102 lines** *(Primary candidate for refactoring; contains modal states, sub-cards, share logic, and layout)*
   - [`src/screens/account/AccountIntroScreen.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/screens/account/AccountIntroScreen.tsx): **667 lines**
   - [`src/screens/core/ScannerScreen.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/screens/core/ScannerScreen.tsx): **644 lines**
   - [`src/screens/account/PremiumScreen.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/screens/account/PremiumScreen.tsx): **575 lines**
   - [`src/screens/core/HistoryScreen.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/screens/core/HistoryScreen.tsx): **524 lines**
   - [`src/screens/core/HomeScreen.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/screens/core/HomeScreen.tsx): **355 lines**
   - [`src/screens/account/AccountScreen.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/screens/account/AccountScreen.tsx): **354 lines**
   - [`src/screens/account/HouseholdSettingsScreen.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/screens/account/HouseholdSettingsScreen.tsx): **339 lines**

2. **Components:**
   - [`src/components/ShareResultCard.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/components/ShareResultCard.tsx): **827 lines**
   - [`src/components/HistoryListItem.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/components/HistoryListItem.tsx): **324 lines**
   - [`src/components/NativeSponsoredCard.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/components/NativeSponsoredCard.tsx): **262 lines**
   - [`src/components/ShareCardPickerModal.tsx`](file:///home/zpoorv/Projects/ingredient-scanner/src/components/ShareCardPickerModal.tsx): **262 lines**

3. **Services & Utilities:**
   - [`src/services/gamificationService.ts`](file:///home/zpoorv/Projects/ingredient-scanner/src/services/gamificationService.ts): **726 lines**
   - [`src/utils/resultAnalysis.ts`](file:///home/zpoorv/Projects/ingredient-scanner/src/utils/resultAnalysis.ts): **656 lines**
   - [`src/services/userProfileService.ts`](file:///home/zpoorv/Projects/ingredient-scanner/src/services/userProfileService.ts): **548 lines**
   - [`src/services/historyNotificationService.ts`](file:///home/zpoorv/Projects/ingredient-scanner/src/services/historyNotificationService.ts): **458 lines**
   - [`src/services/productLookup.ts`](file:///home/zpoorv/Projects/ingredient-scanner/src/services/productLookup.ts): **442 lines**
   - [`src/services/revenueCatService.ts`](file:///home/zpoorv/Projects/ingredient-scanner/src/services/revenueCatService.ts): **414 lines**

---

## 5. Quality, Testing & Security Assessment

### 5.1 Static Analysis
- **TypeScript (`npx tsc --noEmit`):** **0 errors.** The codebase is completely type-safe with strict typing enabled.
- **ESLint (`npm run lint` / `expo lint`):** **0 errors / warnings.** All formatting, imports, and lint rules pass cleanly.

### 5.2 Automated Testing Gap
- **Current State:** There are **no automated test suites** (no Jest, Vitest, React Native Testing Library, or Detox configurations).
- **Risk:** High-value calculation algorithms (`productHealthScore.ts`, `restrictionMatching.ts`, `householdFit.ts`, `resultAnalysis.ts`) are pure logic functions that handle intricate edge cases (empty ingredient lists, missing nutrients, multi-allergen overlaps). Changes to scoring formulas could introduce undetected regressions.

### 5.3 Git Status & In-Progress Work
The working tree currently has uncommitted modifications across 8 files:
- `android/app/build.gradle` & `app.json`: Store build configuration flags.
- `package.json`: Dependency overrides / updates.
- `src/components/AuthTextField.tsx`: Input styling and stability polish.
- `src/screens/account/PremiumScreen.tsx`: Enhancements to the RevenueCat plan purchase and restore flows.
- `src/services/authService.ts`: Streamlined authenticated session completion.
- `src/services/authenticatedSessionService.ts`: Cache clearing and background entitlement refreshes upon login.
- `src/services/revenueCatService.ts`: Local profile sync and cache priming for instant premium unlock.

---

## 6. Key Strengths

1. **Performance Engineering:**
   - Proactive UI scheduling using `InteractionManager.runAfterInteractions` ensures critical navigation animations remain 60/120fps before background services initialize.
   - Initial shell cold-start tracing with `markPerformanceTrace` and `measurePerformanceTrace`.
   - Snapshot caching (`appBootstrapSnapshotService.ts`) for instant UI rendering prior to remote network hydration.
2. **Defensive Architecture:**
   - Multi-tier fallback handling for network drops (`NoInternetScreen.tsx`, offline scan caching).
   - Strict server-side validation via Firestore security rules prevents compromised clients from injecting malformed data or tampering with user roles.
3. **Comprehensive Launch Preparedness:**
   - High-grade operational runbooks (`docs/ANDROID_PLAY_LAUNCH_RUNBOOK.md`, `docs/ANDROID_PLAY_RELEASE_CHECKLIST.md`).
   - Detailed app-ads and privacy policy hosting setup for Google Play compliance (`privacy/`).

---

## 7. Recommendations & Action Plan

### Priority 1: High (Pre-Launch Stabilization)
- **Unit Tests for Core Pure Logic [COMPLETED]:** Automated tests implemented in `scripts/test_domain_logic.mjs` running via `npm test` verifying allergen boundary matching, health score Unicode parsing, oil classification, and batch chunking.
- **Commit Current RevenueCat & Auth Fixes:** Verify and stage the pending changes in `revenueCatService.ts`, `PremiumScreen.tsx`, and session services.

### Priority 2: Medium (Code Health & Maintenance)
- **Decompose `ResultScreen.tsx`:** Extract inline sub-sections (Action bar, Verdict summary card, Nutrition breakdown grid, Household alert rows) into dedicated components under `src/components/result/`.
- **Modularize `ShareResultCard.tsx`:** Separate style theme presets and preview canvas into isolated sub-components to reduce file size below 250 lines.

### Priority 3: Low (Long-Term Scalability)
- **Automated E2E Smoke Testing:** Consider lightweight Maestro or Detox flows to automate the release smoke checklist (`UI_BUG_SWEEP_CHECKLIST.md`).
