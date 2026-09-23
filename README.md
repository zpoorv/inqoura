# Inqoura

Inqoura is a mobile packaged-food decision assistant and ingredient scanner built with React Native and Expo. It empowers shoppers to quickly evaluate food products for nutritional quality, dietary safety, allergen compatibility, and multi-member household preferences.

---

## Key Features

- **Barcode & Label Scanning:** Instant camera barcode lookup via Open Food Facts with on-device OCR label fallback.
- **Decision Engine & Health Scoring:** Algorithmic verdict, nutritional scoring (0–100), and processing classification.
- **Allergen & Restriction Matching:** Word-boundary tokenization and negation filtering across 12 languages to reliably identify allergens without false alarms.
- **Household Profiles:** Multi-member dietary profile compatibility to check food safety for the entire family.
- **History & Offline Support:** Persistent scan history with offline caching and remote Firebase sync.
- **Monetization & Billing:** Free-tier ad integration via Google Mobile Ads (AdMob) and premium subscription entitlements via RevenueCat.
- **Admin Operations:** Standalone local administration panel (`admin_panel/`) for product overrides and catalog audits.

---

## Tech Stack

* **Mobile Framework:** [Expo](https://expo.dev) SDK 54 / [React Native](https://reactnative.dev) 0.81.5
* **UI & Component Layer:** React 19.1.0 (Functional components with hooks, React Compiler enabled)
* **Language:** TypeScript
* **State Management:** Modular, lightweight custom hook stores (`src/store/`)
* **Backend & Auth:** Firebase Auth (Email/Google), Cloud Firestore, Cloud Storage
* **Monetization:** RevenueCat (Google Play Billing), Google Mobile Ads
* **Catalog:** Open Food Facts REST API

---

## Requirements

* **Node.js:** `v20.x` or higher
* **Java Development Kit:** JDK 17
* **Android Studio:** Android SDK Platform 34+, Android Virtual Device (AVD) or physical device
* **npm:** v9 or v10

---

## Quick Start

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Environment Setup
Create a local environment file from the template:
```bash
cp .env.example .env.local
```
Fill in the configuration keys in `.env.local` (Firebase, RevenueCat, AdMob).

### 3. Run the App

#### Android (Primary Target)
```bash
npm run android
```

#### Web Preview
```bash
npm run web
# Or with a fresh Metro cache:
npx expo start -c --web
```
*Note: The web target includes automatic mocks for native modules (e.g. AdMob) via `metro.config.js`.*

#### Admin Panel
```bash
npm run admin-panel
```
Access at `http://127.0.0.1:4173/login.html`.

---

## Testing & Quality Assurance

Run the automated domain logic test suite:
```bash
npm test
```
Run TypeScript static type checks:
```bash
npx tsc --noEmit
```

---

## Release Builds

Build signed Android production artifacts locally:

```bash
# Release APK (for internal QA testing)
npm run android:apk:release

# Release AAB (for Google Play Console submission)
npm run android:aab
```

Outputs are generated in:
- `android/app/build/outputs/apk/release/app-release.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

---

## Documentation Index

All project documentation, guides, and audit roadmaps are organized under [`docs/`](docs/):

### Engineering & Architecture
- **[Technical Architecture Guide](docs/ARCHITECTURE.md):** System diagrams, state management, directory responsibilities, and domain logic.
- **[Development Guide](docs/DEVELOPMENT_GUIDE.md):** Complete developer handbook covering environment setup, testing, and coding standards.
- **[AI Agent Guidelines](docs/AGENTS.md):** Pair programming rules, component guidelines, and coding conventions.

### Operations & Release
- **[Android Play Launch Runbook](docs/ANDROID_PLAY_LAUNCH_RUNBOOK.md):** End-to-end guide for Play Store preparation, signing, and staged rollout.
- **[Android Play Release Checklist](docs/ANDROID_PLAY_RELEASE_CHECKLIST.md):** Pre-flight release verification checklist.
- **[UI Bug Sweep Checklist](docs/UI_BUG_SWEEP_CHECKLIST.md):** Mobile viewport and layout QA checklist.

### Security & Legal
- **[Security Policy & Production Hardening](docs/SECURITY.md):** Vulnerability reporting, Firestore rules, custom claims, and Play Integrity.
- **[Privacy Policy](docs/PRIVACY_POLICY.md):** Complete user privacy and data processing policy.
- **[Terms of Service](docs/TERMS_OF_SERVICE.md):** Terms of use and liability disclosures.

### Audits & Roadmaps
- **[Project Analysis Report](docs/report.md):** Executive technical report and audit summary.
- **[Weaknesses & Vulnerabilities Audit](docs/problems.md):** Catalog of identified project weaknesses with resolution statuses.
- **[Remediation Plan](docs/solutions.md):** Actionable engineering roadmap and execution progress.

---

## Privacy Pages

Public web compliance pages live in `privacy/`:
- `privacy/index.html` (Privacy Policy)
- `privacy/delete-account.html` (Data & Account Deletion)
- `privacy/terms.html` (Terms of Service)
