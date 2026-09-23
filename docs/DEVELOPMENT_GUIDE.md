# Inqoura Development Guide

This guide covers everything required to set up, develop, test, and build the Inqoura project locally.

---

## 1. Prerequisites

Before setting up the project, ensure your environment meets the following requirements:

* **Node.js:** `v20.x` or higher (Expo SDK 54 and React 19 require Node 20+)
* **Package Manager:** `npm` (v9 or v10)
* **Java Development Kit (JDK):** JDK 17 (required for Android Gradle builds)
* **Android Studio:** Android SDK Platform 34+, Android SDK Build-Tools, and an Android Virtual Device (AVD) or physical device with USB debugging enabled.

---

## 2. Installation & Setup

### Step 1: Clone and Install Dependencies
Due to peer dependency requirements between React 19 and certain mobile native modules, use `--legacy-peer-deps` if npm encounters resolve conflicts:
```bash
npm install --legacy-peer-deps
```

### Step 2: Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env.local
```

Configure your environment variables in `.env.local`:
```ini
# Firebase Client SDK Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:android:...
EXPO_PUBLIC_FIREBASE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID=...

# RevenueCat Monetization
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro

# Google Mobile Ads (AdMob)
EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID=ca-app-pub-3940256099942544/5224354917
EXPO_PUBLIC_ADMOB_NATIVE_HOME_UNIT_ID=ca-app-pub-3940256099942544/2247696110
EXPO_PUBLIC_ADMOB_NATIVE_HISTORY_UNIT_ID=ca-app-pub-3940256099942544/2247696110
EXPO_PUBLIC_ADMOB_NATIVE_SEARCH_UNIT_ID=ca-app-pub-3940256099942544/2247696110
```

---

## 3. Running the App

### 3.1 Android Development (Recommended)
To run on a connected Android phone or active Android emulator:
```bash
npm run android
```
This builds and launches the native development client using Expo Prebuild.

### 3.2 Web Preview
For rapid UI prototyping and screen inspection:
```bash
npm run web
```
*(or `npx expo start -c --web` to start with a clean Metro cache)*
*Note: In web mode, native modules such as AdMob are automatically stubbed via `src/mocks/googleMobileAdsMock.ts` through `metro.config.js`.*

### 3.3 Admin Panel Server
To start the standalone admin panel:
```bash
npm run admin-panel
```
Access the dashboard at `http://127.0.0.1:4173/login.html`.

---

## 4. Testing & Verification

### Running Automated Unit Tests
The project uses the Node.js native test runner to verify core domain algorithms:
```bash
npm test
```
The test suite in [`scripts/test_domain_logic.mjs`](../scripts/test_domain_logic.mjs) validates:
* Allergen boundary-aware token matching and negation handling.
* Health score calculation and Unicode ingredient parsing.
* Edible vs non-food oil classification.
* Firestore batch chunking limits (<= 500 ops).
* Compliant `User-Agent` headers on external API requests.

### Static Analysis
Typecheck the codebase without emitting artifacts:
```bash
npx tsc --noEmit
```

---

## 5. Coding Guidelines & Standards

* **Functional Components & Hooks:** Write clean, functional components. Avoid class components.
* **Component Granularity:** Keep components small, modular, and reusable. Aim to keep all files **under 200 lines**.
* **Zero Redux:** Use lightweight reactive custom hook stores located under `src/store/`.
* **Safe Substring Matching:** Never use raw `.includes()` on user or ingredient text for allergen identification. Always use token boundary checks via `matchKeywordToken` in `src/utils/restrictionMatching.ts`.
* **Safe Batch Writes:** Never commit unbounded Firestore batches. Always use chunked batches (`src/services/cloudUserDataService.ts`).
* **Clean UI:** Ensure all screen views wrap content in safe areas and maintain scrollability on compact device displays.

---

## 6. Building Production Artifacts

```bash
# Generate Release APK (for internal QA testing)
npm run android:apk:release

# Generate Release AAB (for Google Play Console submission)
npm run android:aab
```
Release bundles will be generated under `android/app/build/outputs/`.
