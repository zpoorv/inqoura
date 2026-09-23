# Inqoura Project Weaknesses & Vulnerability Audit

**Generated on:** September 23, 2026  
**Project:** Inqoura (`inqoura` v1.1.1)  
**Target Platform:** Android (Primary Store Release), iOS, Web Preview  

This document catalogs the architectural, algorithmic, security, reliability, and code quality weaknesses discovered across the Inqoura codebase.

---

## Remediation Status Tracker

| Issue ID | Description | Severity | Status | Resolution Note |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | Naive Allergen Substring Matching | High | **RESOLVED** | Word boundary regex (`matchKeywordToken`) & negation filtering |
| **1.2** | Non-English Allergen Dictionaries | High | **RESOLVED** | European translations & Open Food Facts tags added |
| **1.3** | Recognizable Ingredient Scoring | High | **RESOLVED** | Unicode property escapes (`\p{L}`) implemented |
| **1.4** | Food vs Non-Food Oil Misclassification | High | **RESOLVED** | Culinary oils separated from cosmetic/mechanical oils |
| **2.1** | Guest User Subscription Lockout | Med | Open | In review for upcoming sprint |
| **2.2** | AdMob Consent Management | Med | Open | Consent revoking screen planned |
| **2.3** | AdMob Test Unit Fallbacks | Low | Open | Environment assertions recommended |
| **3.1** | Firestore 500 Batch Limit on Deletions | High | **RESOLVED** | Chunked batches (<= 500 ops) in `cloudUserDataService.ts` |
| **3.2** | Firestore Read Amplification in Rules | Med | In Progress | Custom claim migration script provided |
| **3.3** | Catalog Search Direct Firestore Reads | Med | Open | Algolia client connection planned |
| **3.5** | Open Food Facts User-Agent Header | Low | **RESOLVED** | Compliant User-Agent attached in `src/utils/http.ts` |
| **4.1** | File Length Guideline Violations | Med | In Progress | Incremental screen decomposition underway |
| **Web** | Web Preview Metro Bundling Failure | High | **RESOLVED** | Mock for AdMob and single-page app output in `app.json` |

---

## 1. Critical Health, Safety & Algorithmic Flaws (High Risk)

### 1.1 Naive Allergen Substring Matching & False Positives
* **Location:** [`src/utils/restrictionMatching.ts`](src/utils/restrictionMatching.ts) (`findKeywordMatch`)
* **Problem:** Allergen and dietary restriction keyword matching uses raw substring inclusion:
  ```ts
  if (value.includes(normalizedKeyword)) {
    return normalizedKeyword;
  }
  ```
  without token boundary checks (`\b`) or negation handling.
* **Impact:**
  * Products containing `"eggplant"` match `"egg"`, incorrectly flagging eggplant pasta sauce or meals as containing egg allergens and non-vegan.
  * Explicitly allergen-safe items containing labels like `"gluten-free"` or `"egg-free"` trigger the allergen alert because `"gluten-free"` contains `"gluten"`.
  * Common safe ingredients such as `"butternut squash"` risk matching `"nut"` / `"tree-nut"`.

### 1.2 Non-English Language Blindspot in Restriction & Additive Detection
* **Locations:**
  * [`src/constants/restrictions.ts`](src/constants/restrictions.ts) (`RESTRICTION_DEFINITIONS`)
  * [`src/constants/harmfulIngredients.ts`](src/constants/harmfulIngredients.ts)
* **Problem:** While the application provides full UI internationalization for 12 languages (Spanish, French, German, Arabic, Hindi, Chinese, Russian, Japanese, etc.), the allergen keywords and harmful additive dictionaries are **strictly English**.
* **Impact:** When a user in France, Germany, Spain, Italy, or Japan scans locally packaged food where ingredients are listed in French (*"lait"*, *"arachides"*), German (*"Milch"*, *"Erdnüsse"*), or Spanish (*"cacahuetes"*), the scanner will assess the product as **"Safe"**, missing life-threatening allergens.

### 1.3 Biased "Recognizable Ingredient" Health Scoring
* **Location:** [`src/utils/productHealthScore.ts`](src/utils/productHealthScore.ts) (`getRecognizableIngredientCount`)
* **Problem:** An ingredient is treated as recognizable if it contains 1 to 3 words and passes the regex:
  ```ts
  return words.length > 0 && words.length <= 3 && /^[a-z\s-]+$/.test(ingredient);
  ```
* **Impact:**
  * Any non-Latin or accented ingredient (French *"lécithine"*, German umlauts *"Öl"*, Spanish *"azúcar"*, Arabic, Hindi, Japanese, Russian, Chinese) fails the regex and is classified as an unrecognizable chemical additive. This heavily penalizes the health score of foreign products (down to 0% recognizable).
  * Conversely, unlisted synthetic chemical additives or preservatives that happen to have 1–3 English words with no numbers are treated as healthy "recognizable" ingredients.

### 1.4 Heuristic Food vs. Non-Food Misclassification
* **Location:** [`src/utils/productType.ts`](src/utils/productType.ts) (`FOOD_KEYWORDS`)
* **Problem:** Classification relies on a hardcoded list of English substrings. The keyword `'oil'` is present in `FOOD_KEYWORDS`.
* **Impact:** Non-food household items such as baby oil, massage oil, or motor oil can be misclassified as edible food if no non-food trigger words match.

---

## 2. Monetization & Billing Weaknesses

### 2.1 Guest User Subscription Entitlement Lockout
* **Locations:**
  * [`src/screens/account/PremiumScreen.tsx`](src/screens/account/PremiumScreen.tsx) (`handlePurchasePackage`)
  * [`src/services/premiumEntitlementService.ts`](src/services/premiumEntitlementService.ts) (`loadCurrentPremiumEntitlement`)
* **Problem:** Guests (unauthenticated users) can trigger subscription purchases through RevenueCat on the paywall. However, `loadCurrentPremiumEntitlement` enforces:
  ```ts
  if (authSession.status !== 'authenticated' || !authSession.user) {
    clearPremiumSession();
    ...
    return createDefaultPremiumEntitlement(); // isPremium: false
  }
  ```
* **Impact:** A guest user who pays for a subscription will have their credit card charged on Google Play or the App Store, but the app will reset their status to the **Free plan**, failing to unlock the premium features they purchased.

### 2.2 Missing In-App AdMob Privacy Consent Management
* **Location:** [`src/services/adMobService.ts`](src/services/adMobService.ts)
* **Problem:** While `AdsConsent.gatherConsent` is invoked on initial launch, there is no settings option allowing users in the EU/EEA/UK to inspect, update, or revoke their consent choices later.
* **Impact:** Violates the Google Play EU User Consent Policy and GDPR requirements, posing a risk of ad revenue suspension or app store review rejection.

### 2.3 Production Fallback to Test Ad Units
* **Location:** [`src/services/adMobService.ts`](src/services/adMobService.ts) (`DEFAULT_NATIVE_AD_UNIT_ID`, `DEFAULT_REWARDED_AD_UNIT_ID`)
* **Problem:** Ad units default to Google test IDs if environment variables (`EXPO_PUBLIC_ADMOB_*`) are missing or empty at build time.
* **Impact:** An oversight in environment configuration results in test ads being served in production builds without throwing errors, causing complete loss of ad revenue.

---

## 3. Backend, Cloud & Security Weaknesses

### 3.1 Account Deletion Failure on Active Users (500 Batch Limit)
* **Location:** [`src/services/cloudUserDataService.ts`](src/services/cloudUserDataService.ts) (`deleteRemoteUserData`)
* **Problem:** Deleting remote user data places all scan history document deletions and the user record into a single Firestore `writeBatch`:
  ```ts
  export async function deleteRemoteUserData(uid: string) {
    const historyDocs = await getDocs(getHistoryCollectionRef(uid));
    const batch = writeBatch(getDb());
    historyDocs.docs.forEach((item) => batch.delete(item.ref));
    batch.delete(getUserDocRef(uid));
    await batch.commit();
  }
  ```
* **Impact:** Firestore limits write batches to 500 operations. If an active user has scanned more than 499 products, `batch.commit()` crashes with `FirebaseError: Invalid write batch: maximum 500 writes allowed per batch`. Account deletion fails, violating Apple App Store and Google Play compliance mandates.

### 3.2 Firestore Read Amplification via Admin Rules
* **Location:** [`firestore.rules`](firestore.rules) (`hasAdminRoleDocument`, `isAdmin`)
* **Problem:** The `hasAdminRoleDocument()` helper performs a `get()` lookup against `/databases/$(database)/documents/users/$(request.auth.uid)`.
* **Impact:** If admin users do not have custom auth claims set (`request.auth.token.admin == true`), every admin operation evaluates `hasAdminRoleDocument()`, triggering an extra billable document read on every read/write evaluation.

### 3.3 Inefficient Catalog Search Implementation
* **Locations:**
  * [`src/services/productCatalogService.ts`](src/services/productCatalogService.ts) (`searchStoredProductRecords`, `buildProductSearchKeywords`)
  * [`scripts/build_search_indices.mjs`](scripts/build_search_indices.mjs)
* **Problem:** The mobile app queries Firestore directly using `where('searchKeywords', 'array-contains', query)` with an array of up to 80 prefix strings per product document.
* **Impact:**
  * No typo-tolerance or fuzzy matching (e.g. searching "choclate" returns 0 results).
  * Every search keystroke incurs direct Firestore document reads.
  * Although Algolia dependencies and indexing scripts exist in the repository, the client never connects to Algolia for search.

### 3.4 Admin Panel Server Hardening
* **Location:** [`admin_panel/server.mjs`](admin_panel/server.mjs)
* **Problem:** Standalone Node HTTP server serving the administrative portal lacks security middleware: no rate limiting, no CSRF mitigation, and no Helmet security headers. If exposed beyond `127.0.0.1` (e.g., via port forward or tunnel), it is vulnerable to brute-force authentication attacks.

---

## 4. Architecture & Code Quality Weaknesses

### 4.1 Severe File Length Violations (`AGENTS.md` Rule: < 200 Lines)
Several core screens, components, and services exceed the 200-line project guideline:
1. **Screens:**
   * [`src/screens/core/ResultScreen.tsx`](src/screens/core/ResultScreen.tsx): **2,102 lines** (10x limit, containing 25+ `useState` hooks, embedded sub-cards, share logic, modal states, and styles).
   * [`src/screens/account/AccountIntroScreen.tsx`](src/screens/account/AccountIntroScreen.tsx): **667 lines**.
   * [`src/screens/core/ScannerScreen.tsx`](src/screens/core/ScannerScreen.tsx): **644 lines**.
   * [`src/screens/account/PremiumScreen.tsx`](src/screens/account/PremiumScreen.tsx): **575 lines**.
   * [`src/screens/core/HistoryScreen.tsx`](src/screens/core/HistoryScreen.tsx): **525 lines**.
   * [`src/screens/core/HomeScreen.tsx`](src/screens/core/HomeScreen.tsx): **355 lines**.
   * [`src/screens/account/AccountScreen.tsx`](src/screens/account/AccountScreen.tsx): **354 lines**.
   * [`src/screens/account/HouseholdSettingsScreen.tsx`](src/screens/account/HouseholdSettingsScreen.tsx): **339 lines**.
2. **Components & Services:**
   * [`src/components/ShareResultCard.tsx`](src/components/ShareResultCard.tsx): **827 lines**.
   * [`src/services/gamificationService.ts`](src/services/gamificationService.ts): **726 lines**.
   * [`src/utils/resultAnalysis.ts`](src/utils/resultAnalysis.ts): **656 lines**.
   * [`src/services/userProfileService.ts`](src/services/userProfileService.ts): **548 lines**.
   * [`src/services/historyNotificationService.ts`](src/services/historyNotificationService.ts): **458 lines**.
   * [`src/services/productLookup.ts`](src/services/productLookup.ts): **443 lines**.

### 4.2 Pseudo-Tab Navigation via Stack Overlay
* **Location:** [`src/navigation/RootNavigator.tsx`](src/navigation/RootNavigator.tsx)
* **Problem:** Although `@react-navigation/bottom-tabs` is installed in `package.json`, the app navigates using a single Native Stack with an absolute-positioned `BottomMenuBar` overlay.
* **Impact:**
  * Tab switching pushes or resets stack screens instead of preserving tab component state, causing screens to remount, losing scroll offsets and filter selections.
  * Every screen must maintain manual bottom padding calculations (e.g. `Math.max(insets.bottom + 122, 148)`) to avoid UI being obscured by the bottom bar.

### 4.3 Deep Private Package Import Hack
* **Locations:** Over 20 service files (e.g., [`src/services/commonProductStorage.ts`](src/services/commonProductStorage.ts#L1), [`src/services/dietProfileStorage.ts`](src/services/dietProfileStorage.ts#L1))
* **Problem:** AsyncStorage is imported via internal package paths:
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage/lib/commonjs/index';
  ```
  supported by a custom ambient declaration file in [`src/types/async-storage.d.ts`](src/types/async-storage.d.ts).
* **Impact:** Bypasses package exports maps, risking broken builds under modern Metro bundlers, ESM packaging, and Web targets.

### 4.4 Repeated Style Sheet Recreation in Render Loops
* **Location:** [`src/screens/core/ResultScreen.tsx`](src/screens/core/ResultScreen.tsx#L1542-L1559) (`MetricChip`)
* **Problem:** Individual child components call `createStyles(colors, typography)` directly in their render bodies.
* **Impact:** Every rendered chip reconstructs a massive 500-line `StyleSheet` object containing over 100 style rules, leading to unnecessary garbage collection pressure and frame drops.

---

## 5. Reliability, Performance & Observability

### 5.1 Zero Remote Telemetry & Crash Reporting
* **Locations:**
  * [`src/services/appMonitoringService.ts`](src/services/appMonitoringService.ts)
  * [`src/services/analyticsService.ts`](src/services/analyticsService.ts)
* **Problem:** `setMonitoringAdapter` and `analyticsAdapter` are never wired to an external service. Errors and events are stored strictly in local `AsyncStorage` (`inqoura/monitoring/v1`, `inqoura/launch-analytics/v1`).
* **Impact:** In production, the development team has zero visibility into fatal crashes, native bridge exceptions, failed barcode lookups, or payment drop-offs.

### 5.2 Missing OpenFoodFacts User-Agent Header
* **Location:** [`src/services/http.ts`](src/services/http.ts) (`fetchJsonWithTimeout`)
* **Problem:** HTTP requests to OpenFoodFacts do not pass an application-identifying `User-Agent`.
* **Impact:** OpenFoodFacts terms of service mandate a custom `User-Agent` (`AppName/Version - Contact`). Generic HTTP client requests (`okhttp` on Android) are frequently throttled or outright blocked with 429/403 status codes during peak usage.

### 5.3 Local Scan History Storage Bloat
* **Location:** [`src/services/scanHistoryStorage.ts`](src/services/scanHistoryStorage.ts) (`ScanHistoryEntry`)
* **Problem:** Every scan entry persists the full `ResolvedProduct` JSON document (complete ingredient text, sources list, categories, labels, and nutrition mappings) into a single AsyncStorage key.
* **Impact:** As scan history grows to 200–500 items, serializing and deserializing several megabytes of JSON on the JavaScript thread creates UI stutters and risks encountering Android SQLite cursor window size limits.

### 5.4 Unhandled Null Reference in History Search
* **Location:** [`src/screens/core/HistoryScreen.tsx`](src/screens/core/HistoryScreen.tsx#L48)
* **Problem:** `matchesQuery` accesses `getDietProfileDefinition(entry.profileId).label` directly without checking if the profile definition exists.
* **Impact:** If legacy or corrupted history contains an unknown `profileId`, opening or typing into History search throws an unhandled `TypeError` and crashes the screen.

---

## 6. Testing Deficit

### 6.1 Zero Automated Test Coverage
* **Current State:** 0 unit tests, 0 integration tests, and 0 end-to-end test suites exist in the repository.
* **Risk:** High-value calculation algorithms with intricate edge cases ([`productHealthScore.ts`](src/utils/productHealthScore.ts), [`restrictionMatching.ts`](src/utils/restrictionMatching.ts), [`householdFit.ts`](src/utils/householdFit.ts), [`resultAnalysis.ts`](src/utils/resultAnalysis.ts)) are completely unverified by CI. Refactoring or adjusting nutrition weights risks undetected regressions in production.

---

## 7. Recommended Action Plan

### Phase 1: High Priority (Safety, Billing & Crash Prevention)
1. **Fix Allergen Matching:** Refactor [`restrictionMatching.ts`](src/utils/restrictionMatching.ts) to match on token boundaries with regex `(?:^|[\s,;])keyword(?:$|[\s,;])` and exclude common safe phrases (`"gluten-free"`, `"dairy-free"`, `"egg-free"`).
2. **Fix Guest User Billing:** Update [`premiumEntitlementService.ts`](src/services/premiumEntitlementService.ts) to check RevenueCat customer info for active subscriptions even if `authSession` is unauthenticated.
3. **Chunk Batch Operations:** Chunk `deleteRemoteUserData` and `replaceRemoteScanHistory` in [`cloudUserDataService.ts`](src/services/cloudUserDataService.ts) into batches of ≤400 operations to prevent Firestore batch overflow crashes.
4. **Identify OpenFoodFacts Requests:** Add a descriptive `User-Agent` header in [`http.ts`](src/services/http.ts) compliant with OpenFoodFacts requirements.

### Phase 2: Medium Priority (Compliance, Observability & Localization)
1. **Add Remote Crash Reporting:** Connect Firebase Crashlytics or Sentry via `setMonitoringAdapter` in [`appMonitoringService.ts`](src/services/appMonitoringService.ts).
2. **Internationalize Ingredient Matching:** Support multi-lingual keyword dictionaries for top languages (French, Spanish, German, Italian, etc.) in restriction matching and harmful additives.
3. **Fix Accented Text in Health Score:** Update `getRecognizableIngredientCount` in [`productHealthScore.ts`](src/utils/productHealthScore.ts) to support Unicode letters (`/\p{L}/u`) instead of English-only `/^[a-z\s-]+$/`.
4. **Add GDPR/AdMob Privacy Consent UI:** Expose a button in Support / Settings allowing EU users to review and reset ad consent choices.

### Phase 3: Long-Term (Code Health & Architecture)
1. **Decompose Monolithic Files:** Split [`ResultScreen.tsx`](src/screens/core/ResultScreen.tsx) into focused subcomponents under `src/components/result/`.
2. **Add Automated Unit Tests:** Configure Jest and write test coverage for scoring, allergen matching, and household fit calculations.
3. **Compact History Storage:** Store lightweight summary records in scan history rather than full product JSON objects.
4. **Normalize AsyncStorage Imports:** Remove the `@react-native-async-storage/async-storage/lib/commonjs/index` deep import hack across the codebase.
