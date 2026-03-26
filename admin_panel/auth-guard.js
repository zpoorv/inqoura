import { loadOwnProfile, logout, subscribeToSession } from './firebase-client.js';
import { setStatus } from './shared.js';

const FLASH_KEY = 'inqoura.admin.flash';

function setFlashMessage(message, tone = 'neutral') {
  sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, tone }));
}

export function consumeFlashMessage(statusId) {
  const rawValue = sessionStorage.getItem(FLASH_KEY);

  if (!rawValue) {
    return;
  }

  sessionStorage.removeItem(FLASH_KEY);

  try {
    const value = JSON.parse(rawValue);
    setStatus(statusId, value.message, value.tone);
  } catch {
    setStatus(statusId, rawValue, 'warning');
  }
}

async function resolveAdminProfile(user) {
  if (user.emailVerified !== true) {
    throw new Error('This admin account must have a verified email address.');
  }

  const profile = await loadOwnProfile(user.uid);

  if (!profile || profile.role !== 'admin') {
    throw new Error('This account is not marked as admin in Firestore.');
  }

  return profile;
}

export function requireLoggedOutPage() {
  const root = document.querySelector('[data-login-root]');

  return new Promise((resolve) => {
    let hasResolvedInitialState = false;
    const unsubscribe = subscribeToSession(async (user) => {
      if (!user) {
        root?.removeAttribute('hidden');
        if (!hasResolvedInitialState) {
          hasResolvedInitialState = true;
          resolve(null);
        }
        return;
      }

      try {
        await resolveAdminProfile(user);
        unsubscribe();
        window.location.replace('./dashboard.html');
      } catch (error) {
        await logout().catch(() => undefined);
        setFlashMessage(error instanceof Error ? error.message : 'Admin access was denied.', 'danger');
        root?.removeAttribute('hidden');
        if (!hasResolvedInitialState) {
          hasResolvedInitialState = true;
          resolve(null);
        }
      }
    });
  });
}

export function requireAdminPage() {
  const root = document.querySelector('[data-admin-root]');

  return new Promise((resolve) => {
    const unsubscribe = subscribeToSession(async (user) => {
      if (!user) {
        setFlashMessage('Sign in to access the admin panel.', 'warning');
        unsubscribe();
        window.location.replace('./login.html');
        return;
      }

      try {
        const profile = await resolveAdminProfile(user);
        root?.removeAttribute('hidden');
        document.body.dataset.adminReady = 'true';
        unsubscribe();
        resolve({ profile, user });
      } catch (error) {
        await logout().catch(() => undefined);
        setFlashMessage(error instanceof Error ? error.message : 'Admin access was denied.', 'danger');
        unsubscribe();
        window.location.replace('./login.html');
      }
    });
  });
}
