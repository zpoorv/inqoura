# Inqoura Play Store Setup

## Already in place

- Android package name: `com.zpoorv.inqoura`
- Firebase Authentication wired into the app
- Google services file connected to the Android app
- Expo dev-client Android project generated
- `eas.json` added with preview and production Android build profiles
- Android `versionCode` set to `1`

## What this app does not need yet

- A separate database is not required for the current feature set.
- Scan history is local-only through AsyncStorage.
- Product lookup uses Open Food Facts.
- Authentication uses Firebase Authentication.

Add a cloud database only if you want features like:

- syncing scan history across devices
- storing user profiles in the cloud
- saving favorites, collections, or shared results

## Recommended next services

1. Firebase Authentication
   Already needed for email, Google, verification, and password reset flows.

2. Firebase Firestore
   Use this for cloud sync, admin product overrides, user roles, and lightweight premium entitlements.

3. Google Play Console
   Needed for release signing, app content forms, testing tracks, and publishing.

## Setup you still need to do in Firebase Console

1. Create Cloud Firestore in production mode and pick a region.
2. Deploy the local Firestore files in this repo:
   - `firestore.rules`
3. Keep Firebase Authentication enabled for:
   - Email/password
   - Email link
   - Google
4. Add your authorized domains for email links and production web pages.

## Cloud data model to start with

- `users/{uid}`
  - `email`
  - `name`
  - `age`
  - `countryCode`
  - `role`
  - `plan`
  - timestamps
- `users/{uid}/scanHistory/{scanId}`
  - saved product snapshot and scoring summary
- `productOverrides/{barcode}`
  - admin-owned override for `imageUrl`, name, ingredient text, nutrition corrections, and admin notes
- `feedback/{feedbackId}`
  - optional support/feedback pipeline

## Roles and admin setup

Do not grant `admin` or `premium` from the client app.

Use Firebase Auth custom claims for trusted access control, then mirror that role in the Firestore user document for UI display.

Recommended setup:

1. Firebase Auth for identity
2. Firebase Admin SDK or Cloud Functions to set claims
3. Firestore security rules to enforce admin-only writes
4. A separate protected admin web panel, or an admin-only app section later

Suggested claims:

- `admin: true`
- `premium: true`
- `countryCode: "IN"` or similar if you need server-side price or entitlement logic

## Premium setup for Android

For digital premium features inside an Android app, use Google Play Billing. Do not wire direct PayPal, debit-card, or credit-card checkout inside the app for unlocking digital app features.

Suggested path:

1. Create a subscription in Play Console
2. Add one or more base plans and offers
3. Configure regional availability and prices per country
4. Verify purchases on a backend or secure server function
5. Set the user's premium claim only after purchase verification succeeds

For your example pricing, set that in Play Console at the product/base-plan level:

- US: `$1.00`
- India: `Rs 50`

You should not trust country or payment state from the device alone.

## Free-ish backend stack for admin overrides and premium

This is the lowest-friction setup that still scales:

1. Firebase Auth
2. Cloud Firestore
3. Firebase Hosting for a small admin panel and public privacy/account-deletion pages
4. Cloud Functions or another trusted backend for:
   - setting custom claims
   - verifying Google Play purchases
   - syncing admin updates safely

Use external image URLs for product overrides at first. That keeps text data in Firestore and avoids paying for Firebase Storage before you actually need uploads.

Spark can cover early development, but premium billing verification and heavier production usage often push teams toward Blaze later.

## Release checklist

1. Create a Play Console app for `Inqoura`
2. Prepare a privacy policy URL
3. Complete the Play Console app content forms
4. Prepare store listing assets
5. Add an account deletion flow and a public web page for deletion requests
6. Build an Android App Bundle
7. Upload the first internal test release
8. Add a tester account for review because the app requires login
9. Set up Google Play Billing merchant payouts if you will sell premium

## Assets you should prepare

- App icon
- Feature graphic
- Phone screenshots
- Short description
- Full description
- Support email
- Privacy policy URL
- Account deletion web page URL

## If you want cloud sync later

Create Firestore collections like:

- `users/{userId}`
- `users/{userId}/scanHistory/{scanId}`
- `users/{userId}/preferences/profile`

That can be added later without changing the current Play Store path.
