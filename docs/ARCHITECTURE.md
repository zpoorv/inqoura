# Inqoura Technical Architecture Guide

This document details the software architecture, design principles, data flow, and directory structure of the Inqoura project.

---

## 1. High-Level Architecture Overview

Inqoura is a mobile application built on **React Native (0.81.5)** with **Expo (SDK 54)** and **React 19**, targeting Android as its primary release platform, with web preview capability.

```
+-----------------------------------------------------------------------------------+
|                                  INQOURA APP                                      |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             Presentation Layer                              |  |
|  |   - Screens (Layout & Route orchestration)                                  |  |
|  |   - Components (Small, reusable atomic UI units)                            |  |
|  +-----------------------------------------------------------------------------+  |
|                                       │                                           |
|                                       ▼                                           |
|  +-----------------------------------------------------------------------------+  |
|  |                            State Management Layer                           |  |
|  |   - Decentralized Hook Stores: authSessionStore, historyStore, cartStore,   |  |
|  |     householdStore, themeStore (Avoids heavyweight Redux overhead)         |  |
|  +-----------------------------------------------------------------------------+  |
|                                       │                                           |
|                   ┌───────────────────┴───────────────────┐                       |
|                   ▼                                       ▼                       |
|  +---------------------------------+   +---------------------------------------+  |
|  |          Domain Logic           |   |            Service Layer              |  |
|  |  - Allergen Matcher (Tokenizer) |   |  - openFoodFactsService (OFF API)     |  |
|  |  - Health Score Engine          |   |  - firebaseAuth / cloudUserDataService|  |
|  |  - Food Classifier              |   |  - revenueCatService (Entitlements)   |  |
|  |  - I18n Engine (12 languages)   |   |  - adService (Google Mobile Ads)      |  |
|  +---------------------------------+   +---------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory Structure & Responsibilities

The codebase follows a modular, layer-oriented structure under `src/`:

```text
src/
├── components/          # Pure, reusable UI components (cards, badges, modals, buttons)
├── constants/           # Design tokens, theme colors, branding constants, API endpoints
├── mocks/               # Web platform fallbacks (e.g., googleMobileAdsMock for Metro)
├── models/              # TypeScript interfaces for domain entities (Product, Scan, User)
├── navigation/          # React Navigation stacks, bottom tabs, route definitions
├── screens/             # Top-level screen components handling layout and lifecycle
│   ├── account/         # Account management, profile, language, theme, and billing
│   ├── core/            # Main flow: HomeScreen, ScanScreen, ResultScreen, HistoryScreen
│   └── support/         # Help, feedback, Terms, and Privacy screens
├── services/            # External API clients and SDK integrations
├── store/               # Lightweight custom hook stores for global app state
├── types/               # General TypeScript type definitions and navigation prop types
└── utils/               # Pure algorithmic functions (scoring, allergen regex matching, formatting)
```

---

## 3. Core Architectural Principles

### 3.1 Separation of Concerns
* **Screens handle layout:** Screens wire hooks, trigger data loading, and arrange components. They delegate formatting and algorithms to `utils/`.
* **Components handle UI:** Components remain small (< 200 lines), stateless where possible, and receive data via props.
* **Services handle APIs:** External network requests and SDK interactions are isolated inside `services/`.
* **Utils handle logic:** Pure calculations (dietary restriction matching, health scoring, unit conversion) live in `utils/` with zero side effects.

### 3.2 Lightweight State Management
In alignment with the project rules, heavyweight state libraries like Redux are avoided. State is managed via:
* **React Hooks & Context:** Local UI state uses `useState`, `useReducer`, and `useMemo`.
* **Scoped Hook Stores (`src/store/`):** Discrete, event-driven reactive stores manage cross-screen state:
  - `authSessionStore.ts`: Tracks Firebase Auth state, current user profile, and cached claims.
  - `historyStore.ts`: Manages cached local and synced scan history.
  - `householdStore.ts`: Manages dietary profiles for multiple family members.
  - `cartStore.ts`: Manages products staged for collective scanning or comparison.
  - `themeStore.ts`: Persists light/dark mode and brand theme selection.

---

## 4. Key Domain Subsystems

### 4.1 Allergen & Dietary Restriction Matcher (`src/utils/restrictionMatching.ts`)
* Uses **word-boundary tokenization** (`matchKeywordToken`) instead of raw substring searches to prevent false positives (e.g., `"eggplant"` does not trigger an `"egg"` alert).
* Features **negation detection** (`NEGATION_PATTERNS`) ensuring claims like `"gluten-free"` or `"egg-free"` are recognized as safe rather than triggers.
* Supports **multilingual tag recognition** matching Open Food Facts taxonomy tags across 12 languages.

### 4.2 Health Score Engine (`src/utils/healthScore.ts`)
* Calculates a weighted health score (0–100) based on nutritional density, salt/sugar ratios, and processing degree.
* Recognizes ingredient tokens across international scripts using Unicode property escapes (`\p{L}`).

### 4.3 Cloud Sync & Batch Operations (`src/services/cloudUserDataService.ts`)
* Synchronizes scan history and user preferences to Cloud Firestore.
* Implements **batch chunking** to respect Firestore's 500-operation transaction limits, safely splitting large write queues into separate commits.

---

## 5. Cross-Platform & Build Strategy

* **Primary Platform:** Android native bundle (`.aab` and `.apk`) built with Expo Prebuild and Gradle.
* **Web Preview Support:**
  - Configured with `"web": { "output": "single" }` in `app.json` for React Navigation Single Page App compatibility.
  - Native-only libraries (e.g., `react-native-google-mobile-ads`) are intercepted in `metro.config.js` and resolved to `src/mocks/googleMobileAdsMock.ts` during web builds to avoid bundling crashes.

---

## 6. Admin Panel Architecture (`admin_panel/`)

A standalone Node.js Express server located in `admin_panel/`:
* Runs independently on port `4173` (`npm run admin-panel`).
* Provides a lightweight dashboard for catalog audits, manual product overrides, and review processing.
* Authenticates directly with Firebase Admin SDK or secured API endpoints.
