# Inqoura

Inqoura is an Expo React Native app for faster packaged-food decisions.

The current app is built around a scanner-first flow:

- `Home` for the next best action
- `Scan` for barcode lookup
- `Result` for verdict, score, trust, and ingredient guidance
- `History` for reopen/search/delete
- `Account` for sign-in, premium, language, appearance, notifications, and support

## Current Product Shape

### Core mobile experience

- Barcode scanning with camera
- Product lookup with shared product data and overrides
- Result screen with:
  - score and decision verdict
  - trust and confidence signals
  - ingredient highlights
  - household fit
  - product timeline and suggestions
- Saved scan history with reopen and cleanup tools
- Guest-first usage with optional account sign-in

### Account and personalization

- Email/password login
- Google sign-in
- Password reset
- Language switching
- Theme mode and premium app looks
- Share-card style preferences
- Notification settings
- Household settings

### Premium

Premium currently centers on:

- deeper result guidance
- unlimited result-card exports
- extra share-card styles
- premium app looks
- premium history insight tools
- billing and restore flows through RevenueCat

### Notifications

- Local history-based notifications
- In-app notification center with unread indicator

### Admin and operations

- Local `admin_panel/` for product/admin operations
- Firebase-backed profile, history, config, and override data

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- Firebase Auth + Firestore
- RevenueCat
- Google Mobile Ads
- Expo Notifications

## Requirements

- Node 20+
- Android SDK / Gradle for local release builds
- Firebase project configured for the app
- RevenueCat project configured for subscriptions
- `adb` if you want to install or test on a connected Android device

## Install

```bash
npm install
```

## Environment Setup

Create a local env file:

```bash
cp .env.example .env.local
```

Set the values used by the current app:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID` optional
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` optional
- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`
- `EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID`
- `EXPO_PUBLIC_ADMOB_NATIVE_HOME_UNIT_ID`
- `EXPO_PUBLIC_ADMOB_NATIVE_HISTORY_UNIT_ID`
- `EXPO_PUBLIC_ADMOB_NATIVE_SEARCH_UNIT_ID`

## Running The App

### Start Expo

```bash
npm start
```

### Android native run

```bash
npm run android
```

### Web

```bash
npm run web
```

Web is only useful for rough UI checks. The real app target is Android.

## Admin Panel

Run the local admin panel:

```bash
npm run admin-panel
```

Then open:

```text
http://127.0.0.1:4173/login.html
```

## Release Builds

Release APK:

```bash
npm run android:apk:release
```

Release AAB:

```bash
npm run android:aab
```

Artifacts are written to:

- `android/app/build/outputs/apk/release/app-release.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

## Launch Docs

Use these as the current source of truth for Android release work:

- [`docs/ANDROID_PLAY_RELEASE_CHECKLIST.md`](/home/zpoorv/Projects/ingredient-scanner/docs/ANDROID_PLAY_RELEASE_CHECKLIST.md)
- [`docs/ANDROID_PLAY_LAUNCH_RUNBOOK.md`](/home/zpoorv/Projects/ingredient-scanner/docs/ANDROID_PLAY_LAUNCH_RUNBOOK.md)
- [`docs/PLAY_STORE_SETUP.md`](/home/zpoorv/Projects/ingredient-scanner/docs/PLAY_STORE_SETUP.md)

Security and production hardening docs:

- [`SECURITY.md`](/home/zpoorv/Projects/ingredient-scanner/SECURITY.md)
- [`SECURITY_HARDENING.md`](/home/zpoorv/Projects/ingredient-scanner/SECURITY_HARDENING.md)
- [`PLAY_INTEGRITY_PLAN.md`](/home/zpoorv/Projects/ingredient-scanner/PLAY_INTEGRITY_PLAN.md)
- [`FIREBASE_GITHUB_SECURITY_CHECKLIST.md`](/home/zpoorv/Projects/ingredient-scanner/FIREBASE_GITHUB_SECURITY_CHECKLIST.md)

## Privacy Pages

Public web pages live in:

- `privacy/index.html`
- `privacy/delete-account.html`
- `privacy/terms.html`

Expected hosted URLs:

- `https://inqoura.app/privacy`
- `https://inqoura.app/delete-account`
- `https://inqoura.app/terms`

## Project Structure

```text
.
|-- admin_panel/
|-- docs/
|-- privacy/
|-- src/
|   |-- components/
|   |-- constants/
|   |-- models/
|   |-- navigation/
|   |-- screens/
|   |   |-- account/
|   |   |-- core/
|   |   `-- support/
|   |-- services/
|   |-- store/
|   |-- types/
|   `-- utils/
|-- App.tsx
|-- app.json
`-- package.json
```

## Notes

- The app is Expo-first and React Native only.
- Firebase config can be public in the client; trust must come from rules, claims, App Check, and production separation.
- Android release work should use the launch checklist and runbook above.
