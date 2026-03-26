import type { User } from 'firebase/auth';

import type { AuthSession, AuthUser } from '../models/auth';
import { setAuthSession } from '../store/authSessionStore';
import {
  clearStoredAuthSessionUser,
  saveStoredAuthSessionUser,
} from './authStorage';

export class AuthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

function toIsoDate(value: string | null | undefined) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function inferAuthProvider(user: User): AuthUser['provider'] {
  const providerIds = user.providerData.map((provider) => provider?.providerId);
  return providerIds.includes('google.com') ? 'google' : 'email';
}

function toAuthUser(user: User): AuthUser {
  return {
    createdAt: toIsoDate(user.metadata.creationTime),
    displayName: user.displayName,
    email: user.email ?? '',
    emailVerified: user.emailVerified,
    id: user.uid,
    photoUrl: user.photoURL,
    provider: inferAuthProvider(user),
    updatedAt: toIsoDate(user.metadata.lastSignInTime),
  };
}

export async function storeAuthenticatedUser(user: User) {
  const authUser = toAuthUser(user);
  return setStoredAuthSession(authUser);
}

export async function setStoredAuthSession(authUser: AuthUser) {
  const authSession: AuthSession = {
    status: 'authenticated',
    user: authUser,
  };

  await saveStoredAuthSessionUser(authUser);
  setAuthSession(authSession);

  return authUser;
}

export async function clearAuthenticatedSession() {
  await clearStoredAuthSessionUser();
  setAuthSession({ status: 'guest', user: null });
}

function mapAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return 'We could not complete authentication right now.';
  }

  const messageByCode: Record<string, string> = {
    'auth/account-exists-with-different-credential':
      'This email is already linked to a different sign-in method.',
    'auth/email-already-in-use':
      'An account with this email already exists.',
    'auth/invalid-action-code':
      'That email link has expired or has already been used.',
    'auth/invalid-credential':
      'Email, password, or Google sign in could not be verified.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-email': 'Enter your email address first.',
    'auth/network-request-failed':
      'Network connection failed. Check your internet and try again.',
    'auth/operation-not-allowed':
      'This sign-in method is not enabled in Firebase yet.',
    'auth/popup-closed-by-user': 'Google sign in was closed before it finished.',
    'auth/too-many-requests':
      'Too many attempts were made. Please wait and try again.',
    'auth/user-not-found': 'No account was found for this email.',
    'auth/weak-password': 'Use a stronger password with at least 8 characters.',
    'auth/wrong-password': 'Email or password is incorrect.',
  };

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : '';

  return messageByCode[code] ?? error.message;
}

export function normalizeFirebaseFailure(error: unknown): never {
  throw new AuthServiceError(mapAuthError(error));
}
