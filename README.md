# Inqoura

Expo React Native app for scanning packaged-food barcodes or ingredient labels,
then reviewing product ingredients, additives, nutrition, and a deterministic
health score in a mobile-first flow with local and Firebase-backed sign-in.

## Features

- Firebase email/password authentication
- Native Google sign-in with Firebase Authentication
- Password reset placeholder flow
- Live barcode scanning with `expo-camera`
- Manual barcode entry that uses the same lookup flow as camera scanning
- OCR ingredient-label scanning from a photo or gallery image
- Open Food Facts product lookup with local barcode response caching
- Duplicate scan suppression while a lookup is active and within a short scan interval
- Ingredient highlighting with `safe`, `caution`, and `high-risk` states
- Tap-to-explain ingredient modal with short plain-English descriptions
- Deterministic health scoring with grade, verdict, and explanation
- Diet profile modes:
  - general
  - weight loss
  - diabetes-aware
  - vegan
  - gym / muscle gain
- Shareable result card with native share sheet support
- Local scan history with search, sort, reopen, and delete actions
- Lazy-loaded non-critical screens and skeleton loading states for better responsiveness

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React Navigation native stack
- AsyncStorage for local persistence
- TypeScript with functional components and hooks

## Requirements

- Node 20+
- Android development build for native OCR and dev-client testing
- `adb` available if you want to run directly on a connected Android device
- Firebase project configured for:
  - Email/Password auth
  - Google auth
  - Android app package `com.zpoorv.inqoura`
  - Web app config in local env vars

## Install

```bash
npm install
```

## Environment Setup

Create a local env file before running auth flows:

```bash
cp .env.example .env.local
```

Populate these values from Firebase Project Settings and Google OAuth credentials:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID` optional

## Running The App

### Expo Go

For basic work that does not depend on native OCR modules:

```bash
npx expo start
```

### Android Dev Client

This project is set up to run best in an Expo development build on Android.

1. Start Metro with Node 20:

```bash
export PATH="/home/zpoorv/.npm/_npx/ebaba8b9e55fd0a9/node_modules/node/bin:$PATH"
node ./node_modules/expo/bin/cli start --dev-client --localhost --port 8086 --clear
```

2. Connect the device to the Metro port:

```bash
adb reverse tcp:8086 tcp:8086
```

3. Open the installed Android dev client:

```bash
adb shell am start -W -a android.intent.action.VIEW -d 'exp+inqoura://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8086' com.zpoorv.inqoura
```

If you need to build or reinstall the Android dev client:

```bash
npx expo run:android
```

## App Flow

1. Open the home screen.
2. Sign in with email/password or Google.
3. Choose or confirm the active diet profile.
4. Scan a barcode, type a barcode manually, or open ingredient-label OCR.
5. The scan flow handles loading, empty, and error states before navigation.
6. The result screen opens with product details, ingredient analysis, score, and suggestions.
7. Successful barcode results are saved to local history.
8. Open history to search, sort, reopen, or delete saved scans.

## Performance Notes

- Non-critical screens are lazy-loaded from the navigator to reduce startup work.
- Barcode lookups are cached locally so repeat scans reopen faster.
- Result analysis is deferred out of the initial render path for better low-end Android responsiveness.
- Camera resources are released when the scanner screen is not active.
- History uses `FlatList` virtualization and lightweight skeleton placeholders.

## Scan History Behavior

- Each saved entry includes:
  - timestamp
  - barcode
  - product name
  - numeric score
  - grade
  - short risk summary
  - selected diet profile
- Duplicate scans are merged by barcode.
- Rescanning the same product updates the saved snapshot and timestamp instead of creating a new row.

## Project Structure

```text
.
|-- App.tsx
|-- index.ts
|-- src/
|   |-- App.tsx
|   |-- components/
|   |   |-- AuthTextField.tsx
|   |   |-- BarcodeScannerPanel.tsx
|   |   |-- DietProfileModal.tsx
|   |   |-- GoogleSignInButton.tsx
|   |   |-- HistoryListItem.tsx
|   |   |-- HistoryListItemSkeleton.tsx
|   |   |-- IngredientExplanationModal.tsx
|   |   |-- ManualBarcodeEntry.tsx
|   |   |-- PrimaryButton.tsx
|   |   |-- ProductSuggestionsCard.tsx
|   |   |-- ResultCardSkeleton.tsx
|   |   `-- ShareResultCard.tsx
|   |-- constants/
|   |   |-- api.ts
|   |   |-- branding.ts
|   |   |-- colors.ts
|   |   |-- dietProfiles.ts
|   |   |-- harmfulIngredients.ts
|   |   |-- ingredientExplanations.ts
|   |   `-- productHealthScore.ts
|   |-- navigation/
|   |   |-- RootNavigator.tsx
|   |   `-- types.ts
|   |-- screens/
|   |   |-- HistoryScreen.tsx
|   |   |-- HomeScreen.tsx
|   |   |-- IngredientOcrScreen.tsx
|   |   |-- LoginScreen.tsx
|   |   |-- ResetPasswordScreen.tsx
|   |   |-- ResultScreen.tsx
|   |   |-- ScannerScreen.tsx
|   |   `-- SignUpScreen.tsx
|   |-- services/
|   |   |-- authService.ts
|   |   |-- authStorage.ts
|   |   |-- barcodeLookupCache.ts
|   |   |-- dietProfileStorage.ts
|   |   |-- firebaseApp.ts
|   |   |-- googleSignInService.ts
|   |   |-- http.ts
|   |   |-- ingredientLabelOcr.ts
|   |   |-- openFoodFacts.ts
|   |   |-- productLookup.ts
|   |   `-- scanHistoryStorage.ts
|   |-- models/
|   |   `-- auth.ts
|   |-- store/
|   |   |-- authSessionStore.ts
|   |   |-- index.ts
|   |   `-- profileSessionStore.ts
|   |-- types/
|   |   |-- async-storage.d.ts
|   |   |-- product.ts
|   |   `-- scanner.ts
|   `-- utils/
|       |-- authValidation.ts
|       |-- barcode.ts
|       |-- dietProfiles.ts
|       |-- gradeTone.ts
|       |-- healthScore.ts
|       |-- ingredientExplanations.ts
|       |-- ingredientHighlighting.ts
|       |-- ocrResolvedProduct.ts
|       |-- productDisplay.ts
|       |-- productHealthScore.ts
|       |-- productInsights.ts
|       |-- productName.ts
|       |-- productSuggestions.ts
|       |-- productType.ts
|       |-- resultAnalysis.ts
|       |-- scanHistory.ts
|       `-- shareableResult.ts
```

## Notes

- Product lookup currently uses Open Food Facts only.
- App branding, scheme, and Android package are `Inqoura`, `inqoura`, and `com.zpoorv.inqoura`.
- Firebase config is loaded from local Expo public env vars and should not be committed.
- Ingredient explanations use local mock data, but the lookup layer is structured so a server or AI source can replace it later.
- OCR runs behind a dedicated service so the implementation can be swapped later.
- Storage and API work live in `src/services/`, while shared contracts live in `src/types/`.
- The lightweight in-memory session state lives in `src/store/` and avoids Redux.
- `App.tsx` at the project root is only a thin wrapper that forwards to `src/App.tsx`.
