# Inqoura Security Policy & Production Hardening Guide

This document establishes the security policy, production hardening requirements, and deployment verification procedures for Inqoura.

---

## 1. Vulnerability Reporting

We take security seriously. If you discover a vulnerability in Inqoura, please report it responsibly rather than opening a public issue.

* **Reporting Email:** `support@inqoura.app`
* **Information to Include:**
  - Description of the vulnerability and potential impact
  - Step-by-step reproduction instructions or proof-of-concept
  - Affected platform, screen, endpoint, or configuration
  - Any relevant logs, screenshots, or code references

We will review reports promptly, determine severity, and coordinate a fix before public disclosure.

---

## 2. Production Security Architecture

### 2.1 Public Client vs. Backend Trust
In React Native and Expo applications, client-side JavaScript code and configuration bundles (such as `google-services.json` and `EXPO_PUBLIC_*` environment variables) are publicly readable by design. Anyone can decompile or inspect the mobile bundle.

Therefore, **security must never rely on client-side secrets**. Trust is enforced through:
1. **Firestore & Storage Security Rules:** Strict boundaries defining read/write access per UID and role.
2. **Firebase Auth Custom Claims:** Server-verified roles (`admin`, `premium`) that cannot be modified by client requests.
3. **Firebase App Check & Play Integrity:** Cryptographic attestation verifying that incoming traffic originates from genuine, untampered app instances on Android.
4. **Environment Isolation:** Dedicated Firebase projects for development and production.

### 2.2 Role & Premium Entitlement Model
- **Client Privilege Isolation:** Normal authenticated users cannot alter their own `role`, `plan`, or administrative flags.
- **Admin Access:** Requires either a verified Firebase custom claim (`admin: true`) or an explicit admin document verified against the user's verified email.
- **Premium Access:** Verified against active RevenueCat server-side entitlements and Firebase custom claims. The app never grants premium access solely from locally cached client state.

---

## 3. Firebase & Deployment Security Checklist

### 3.1 Deploying Security Rules
Deploy production Firestore and Storage rules:
```bash
firebase login
firebase use <your-production-project-id>
firebase deploy --only firestore:rules,storage
```

### 3.2 Pre-Flight Rule Verification
Confirm the following production behaviors:
- [ ] Signed-out users cannot read private user profile documents or scan histories.
- [ ] Authenticated users cannot modify their own `role` or `plan` fields.
- [ ] Authenticated users cannot write to `adminConfig` or override `products`.
- [ ] Scan history writes are strictly scoped to `users/{uid}/scanHistory/{scanId}` and bounded to 500 items.
- [ ] Correction reports (`correctionReports`) can only be created with valid schema and cannot overwrite existing reports.

### 3.3 Admin Custom Claim Provisioning
Admin privileges must be granted server-side using the project's provisioning script:
```bash
GOOGLE_OAUTH_ACCESS_TOKEN="$(gcloud auth print-access-token)" \
FIREBASE_PROJECT_ID=<your-production-project-id> \
TARGET_UID=<firebase-auth-uid> \
node scripts/grant_admin_claim.mjs
```
After executing:
1. Sign out and sign back in on the target client device.
2. Verify that administrative panels and endpoints are accessible.
3. Verify that non-admin accounts receive permission denied errors on admin resources.

---

## 4. Google Play Integrity & Firebase App Check Roadmap

To prevent API abuse, data scraping, and unauthorized backend access from modified clones:

### Phase 1: Current Implementation
- Client-side token validation and secure Firebase Firestore rules.
- RevenueCat entitlement checks with fallback verification.
- Public client configs decoupled from administrative authorization.

### Phase 2: Server-Side Webhook Synchronization
- Route RevenueCat subscription webhook events to a secure Cloud Function / backend.
- Automatically set or revoke Firebase custom claims (`premium: true`) based on verified server-to-server webhook payloads.

### Phase 3: Firebase App Check Enforcement
- Enable Firebase App Check in the Firebase Console for Firestore, Storage, and Cloud Functions.
- Register Android app with Google Play Integrity attestation.
- Observe metrics in monitoring mode before turning on strict enforcement.

---

## 5. GitHub Repository Hygiene

- [ ] **No Secret Commits:** Verify that `.env`, `.env.local`, `google-services.json`, `keystore.properties`, and service account JSONs remain in `.gitignore`.
- [ ] **Branch Protection:** Enable branch protection on `main` requiring pull request reviews and passing CI checks.
- [ ] **Secret Scanning:** Keep GitHub Secret Scanning and Dependabot alerts active.
