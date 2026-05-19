import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import type {
  EmailPasswordLoginInput,
  EmailPasswordSignUpInput,
} from '../models/auth';
import {
  normalizeAuthEmail,
  validateEmailAddress,
  validateLoginInput,
  validateSignUpInput,
} from '../utils/authValidation';
import { trackAnalyticsEvent } from './analyticsService';
import { recordNonFatalError } from './appMonitoringService';
import {
  AuthServiceError,
  clearAuthenticatedSession,
  normalizeFirebaseFailure,
} from './authHelpers';
import { completeAuthenticatedSession } from './authenticatedSessionService';
import { getEmailLinkActionSettings } from './emailLinkAuthService';
import { getFirebaseAuth } from './firebaseAuth';
import { signOutNativeGoogle } from './googleSignInService';
import {
  markPerformanceTrace,
  measurePerformanceTrace,
} from './performanceTrace';

export async function hydrateAuthSession() {
  markPerformanceTrace('auth-hydration-start');
  const auth = getFirebaseAuth();
  const firebaseUser = await new Promise<ReturnType<typeof getFirebaseAuth>['currentUser']>(
    (resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        reject
      );
    }
  );

  if (!firebaseUser) {
    await clearAuthenticatedSession();
    return null;
  }

  try {
    await reload(firebaseUser);
  } catch {
    // If reload fails due to connectivity, keep the last Firebase-authenticated user.
  }

  return completeAuthenticatedSession(firebaseUser);
}

export async function signUpWithEmail(input: EmailPasswordSignUpInput) {
  const validationError = validateSignUpInput(input);

  if (validationError) {
    throw new AuthServiceError(validationError);
  }

  try {
    markPerformanceTrace('signup-start');
    trackAnalyticsEvent('signup_started', {
      provider: 'email',
    });
    const auth = getFirebaseAuth();
    const credentials = await createUserWithEmailAndPassword(
      auth,
      normalizeAuthEmail(input.email),
      input.password
    );

    await Promise.all([
      updateProfile(credentials.user, {
        displayName: input.name.trim(),
      }),
      sendEmailVerification(
        credentials.user,
        getEmailLinkActionSettings()
      ),
    ]);
    await signOut(auth);
    await clearAuthenticatedSession();
    measurePerformanceTrace('signup-start', 'signup-success', {
      provider: 'email',
    });
    trackAnalyticsEvent('signup_succeeded', {
      provider: 'email',
    });

    return `We created your account and sent a verification email to ${normalizeAuthEmail(input.email)}. Open that email before logging in.`;
  } catch (error) {
    trackAnalyticsEvent('signup_failed', {
      code:
        error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
          ? error.code
          : 'unknown',
      provider: 'email',
    });
    recordNonFatalError('auth.signup', error, {
      provider: 'email',
    });
    normalizeFirebaseFailure(error);
  }
}

export async function loginWithEmail(input: EmailPasswordLoginInput) {
  const validationError = validateLoginInput(input);

  if (validationError) {
    throw new AuthServiceError(validationError);
  }

  try {
    markPerformanceTrace('email-login-start');
    trackAnalyticsEvent('login_started', {
      provider: 'email',
    });
    const auth = getFirebaseAuth();
    const credentials = await signInWithEmailAndPassword(
      auth,
      normalizeAuthEmail(input.email),
      input.password
    );

    if (!credentials.user.emailVerified) {
      await reload(credentials.user);
    }

    if (!credentials.user.emailVerified) {
      await sendEmailVerification(
        credentials.user,
        getEmailLinkActionSettings()
      );
      await signOut(auth);
      await clearAuthenticatedSession();
      throw new AuthServiceError(
        'Verify your email before logging in. We sent a fresh verification link to your inbox.',
        'verification-required'
      );
    }

    const authUser = await completeAuthenticatedSession(credentials.user);
    measurePerformanceTrace('email-login-start', 'email-login-ready', {
      provider: 'email',
    });
    trackAnalyticsEvent('login_succeeded', {
      provider: 'email',
    });

    return authUser;
  } catch (error) {
    trackAnalyticsEvent('login_failed', {
      code:
        error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
          ? error.code
          : 'unknown',
      provider: 'email',
    });
    recordNonFatalError('auth.login', error, {
      provider: 'email',
    });
    normalizeFirebaseFailure(error);
  }
}

export async function signInWithGoogleIdToken(idToken: string) {
  if (!idToken) {
    throw new AuthServiceError('Google sign in did not return a valid ID token.');
  }

  try {
    markPerformanceTrace('google-login-start');
    trackAnalyticsEvent('login_started', {
      provider: 'google',
    });
    const auth = getFirebaseAuth();
    const credential = GoogleAuthProvider.credential(idToken);
    const credentials = await signInWithCredential(auth, credential);

    const authUser = await completeAuthenticatedSession(credentials.user);
    measurePerformanceTrace('google-login-start', 'google-login-ready', {
      provider: 'google',
    });
    trackAnalyticsEvent('login_succeeded', {
      provider: 'google',
    });

    return authUser;
  } catch (error) {
    trackAnalyticsEvent('login_failed', {
      code:
        error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
          ? error.code
          : 'unknown',
      provider: 'google',
    });
    recordNonFatalError('auth.google_login', error, {
      provider: 'google',
    });
    normalizeFirebaseFailure(error);
  }
}

export async function logoutAuth() {
  await signOutNativeGoogle();

  try {
    const auth = getFirebaseAuth();
    await signOut(auth);
  } catch {
    // Local session cleanup should still happen even if Firebase sign out cannot run.
  }

  await clearAuthenticatedSession();
}

export async function requestPasswordReset(email: string) {
  const validationError = validateEmailAddress(email);

  if (validationError) {
    throw new AuthServiceError(validationError);
  }

  try {
    const normalizedEmail = normalizeAuthEmail(email);
    await sendPasswordResetEmail(getFirebaseAuth(), normalizedEmail);

    return `If ${normalizedEmail} belongs to an account, Firebase will send a password reset email shortly.`;
  } catch (error) {
    normalizeFirebaseFailure(error);
  }
}

export async function resendVerificationEmailForLogin(
  input: EmailPasswordLoginInput
) {
  const validationError = validateLoginInput(input);

  if (validationError) {
    throw new AuthServiceError(validationError);
  }

  try {
    const auth = getFirebaseAuth();
    const credentials = await signInWithEmailAndPassword(
      auth,
      normalizeAuthEmail(input.email),
      input.password
    );

    try {
      if (!credentials.user.emailVerified) {
        await reload(credentials.user);
      }

      if (credentials.user.emailVerified) {
        await signOut(auth);
        await clearAuthenticatedSession();
        return 'Your email is already verified. Use Log In to continue.';
      }

      await sendEmailVerification(
        credentials.user,
        getEmailLinkActionSettings()
      );
      await signOut(auth);
      await clearAuthenticatedSession();

      return `We sent another verification email to ${normalizeAuthEmail(input.email)}. Open it, then log in again.`;
    } catch (error) {
      await signOut(auth).catch(() => null);
      await clearAuthenticatedSession();
      normalizeFirebaseFailure(error);
    }
  } catch (error) {
    normalizeFirebaseFailure(error);
  }
}
