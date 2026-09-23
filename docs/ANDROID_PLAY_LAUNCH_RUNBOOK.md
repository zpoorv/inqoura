# Inqoura Android Play Launch Runbook

This runbook is the definitive end-to-end operational guide for preparing, building, signing, verifying, and releasing Inqoura on Google Play.

---

## 1. Release Architecture & Sources of Truth

* **App Configuration:** [`app.json`](../app.json)
* **Android Package Name:** `com.zpoorv.inqoura`
* **Release Checklist:** [`ANDROID_PLAY_RELEASE_CHECKLIST.md`](ANDROID_PLAY_RELEASE_CHECKLIST.md)
* **Security & Hardening:** [`SECURITY.md`](SECURITY.md)
* **Backend Rules:** [`firestore.rules`](../firestore.rules), [`storage.rules`](../storage.rules)

---

## 2. Environment & Service Configuration

### 2.1 Firebase Production
- Keep development and production on separate Firebase projects.
- Ensure `android/app/google-services.json` matches your production Firebase project.
- Deploy the production Firestore and Storage rules:
  ```bash
  firebase deploy --only firestore:rules,storage
  ```
- Enable Firebase App Check with the Play Integrity provider once the initial production release is established.

### 2.2 Google Play Console & Signing Setup
1. **Keystore Configuration:**
   - Copy the example config:
     ```bash
     cp android/keystore.properties.example android/keystore.properties
     ```
   - Set `storeFile`, `storePassword`, `keyAlias`, and `keyPassword`. Ensure `keystore.properties` remains in `.gitignore`.
2. **Play Console Setup:**
   - Create the app listing for **Inqoura**.
   - Fill in App Content declarations:
     - **Camera:** Required for live barcode scanning.
     - **Data Safety:** Scoped user account data (email, scan history) managed securely via Firebase.
     - **Ads:** Declares AdMob banner and rewarded units.
   - Set up Google Play Billing merchant account for in-app subscription payouts.

### 2.3 RevenueCat
- Set `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` to the production Android API key in `.env.local`.
- Ensure `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` corresponds to your active RevenueCat entitlement.
- Verify that base subscription plans and pricing match across Google Play Console and RevenueCat.

### 2.4 Google Mobile Ads (AdMob)
- Configure production Android AdMob App ID in `app.json`.
- Populate production unit IDs in `.env.local`:
  - `EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID`
  - `EXPO_PUBLIC_ADMOB_NATIVE_HOME_UNIT_ID`
  - `EXPO_PUBLIC_ADMOB_NATIVE_HISTORY_UNIT_ID`
  - `EXPO_PUBLIC_ADMOB_NATIVE_SEARCH_UNIT_ID`
- Ensure `app-ads.txt` is published at your root domain (`https://inqoura.app/app-ads.txt`).

---

## 3. Pre-Release Build & Validation Workflow

### Step 1: Version Bumping
Synchronize versions across configuration files:
- Bump `version` and `android.versionCode` in [`app.json`](../app.json).
- Bump `version` in [`package.json`](../package.json).

### Step 2: Code Quality & Automated Checks
Run test suite and typechecks:
```bash
npm test
npx tsc --noEmit
```

### Step 3: Local Release Builds
Build Android release artifacts:
```bash
# Release APK for local device testing:
npm run android:apk:release

# Release AAB for Google Play submission:
npm run android:aab
```
Generated artifacts are located at:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. On-Device Verification Pass

Before submitting to Google Play, install `app-release.apk` on a physical Android test device and verify the smoke pass:
1. **Guest Flow:** Install fresh -> Home -> Scan barcode -> Result -> History -> Account.
2. **Authentication:** Sign in with email/password and Google; change language; test sign out and app restart.
3. **Subscriptions:** Open Premium -> Verify offerings load -> Verify purchase and restore flows.
4. **AdMob:** Ensure ads appear only for free-tier users without UI jitter or overlap.
5. **Internationalization:** Cycle through supported languages (including RTL Arabic/Hebrew) to ensure labels wrap cleanly.

---

## 5. Deployment & Staged Rollout Strategy

1. **Internal Testing Track:** Upload `app-release.aab` to Play Console Internal Testing for core team sign-off.
2. **Closed Testing Track:** Release to beta tester group.
3. **Staged Production Rollout:**
   - Day 1: 10% rollout
   - Day 3: 25% rollout
   - Day 5: 50% rollout
   - Day 7: 100% full release
4. **Hotfix & Rollback:** If crash rate exceeds threshold, halt rollout immediately in Play Console, patch on `main`, bump `versionCode`, and redeploy.
