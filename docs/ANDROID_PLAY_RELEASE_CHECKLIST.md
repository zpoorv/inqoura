# Inqoura Android Play Release Checklist

## P0 Release blockers

- `Guest core flow`
  - Open app from a fresh install.
  - Open `Home`, `Scan`, `Result`, `History`, and `Account`.
  - Scan a barcode, read the result, and reopen it from history.
- `Signed-in core flow`
  - Log in with email/password.
  - Confirm redirect lands on `Home`.
  - Change language and confirm active pages update without restart.
  - Log out, restart the app, and confirm the app stays logged out.
- `Premium and billing`
  - Open `Premium`.
  - Load offerings on a release build.
  - Complete restore purchases.
  - Confirm premium users do not see free-tier ad paths.
- `Notifications`
  - Test permission denied and granted flows.
  - Deliver one reminder notification.
  - Confirm tapping it opens the app and updates the in-app notification center.
- `No raw errors`
  - Confirm there are no developer-style error messages on normal paths.
  - Confirm failed network paths show retry-safe copy.

## Security and backend hardening

- `Firebase projects`
  - Production uses a Firebase project separate from development.
  - `android/app/google-services.json` is the production file for release builds.
- `Firestore and Storage rules`
  - Validate `firestore.rules` for user, guest, and admin write boundaries.
  - Validate `storage.rules` for allowed upload and read paths.
  - Confirm non-admin users cannot write admin config, override, or review data.
- `Admin access`
  - Admin access is claim-based or otherwise protected by trusted server-side control.
  - Client code does not grant admin or premium roles.
- `App Check / Play Integrity`
  - Firebase App Check is enabled for production.
  - Android uses Play Integrity for attestation.
- `Privacy compliance`
  - In-app delete-account flow works.
  - Hosted privacy, terms, and delete-account pages are live and reachable.

## Monetization and policy

- `RevenueCat`
  - Production API key is present.
  - Entitlement id matches the RevenueCat dashboard.
  - Offerings load on a release build.
  - Restore flow succeeds with clear messaging.
- `AdMob`
  - Production Android app id and ad unit ids are present.
  - `app-ads.txt` is hosted at the domain root.
  - Rewarded OCR flow is explicit and understandable.
  - Ads do not interfere with scan, result, or account flows.
- `Policy language`
  - Premium copy avoids medical certainty.
  - Premium copy avoids manipulative urgency or scarcity.

## Performance and accessibility

- `Performance checks`
  - Cold launch feels responsive on a release build.
  - Scanner opens quickly after app start.
  - Result screen paints before long analysis finishes.
  - History and Account reuse cached data without full-screen blockers.
- `Accessibility checks`
  - Icon-only buttons have accessibility labels/hints.
  - Touch targets are large enough on Android.
  - Contrast is acceptable in all shipped looks.
  - Screen reader order is sensible on `Scan`, `Result`, and `Account`.
- `Internationalization checks`
  - No English-only leftovers on active pages.
  - Long strings behave well in German, Russian, Hindi, Arabic, Japanese, and Chinese.

## Static and build validation

- `Code quality`
  - Run `npx tsc --noEmit`
  - Run `npm run lint`
- `Release artifacts`
  - Run `npm run android:apk:release`
  - Run `npm run android:aab`
  - Install the release APK on a physical Android device.
  - Confirm the AAB is ready for Play upload.

## Play Console readiness

- `Listing assets`
  - App title
  - Short description
  - Full description
  - Feature graphic
  - Phone screenshots from the current UI
- `Compliance`
  - Privacy policy URL
  - Data safety form
  - Ads disclosure
  - Camera permission disclosure
  - App access instructions if review requires a login
- `Rollout`
  - Upload to internal or closed testing first.
  - Use staged production rollout after internal validation.
