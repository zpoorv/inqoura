import { requireLoggedOutPage, consumeFlashMessage } from './auth-guard.js';
import { loadOwnProfile, login, logout } from './firebase-client.js';
import { byId, setButtonBusy, setStatus } from './shared.js';

await requireLoggedOutPage();
consumeFlashMessage('loginStatus');

byId('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('loginStatus', 'Checking credentials...', 'neutral');
  setButtonBusy('loginButton', true, 'Signing In...');

  try {
    const credentials = await login(
      byId('emailInput').value.trim(),
      byId('passwordInput').value
    );
    if (credentials.user.emailVerified !== true) {
      await logout().catch(() => undefined);
      throw new Error('This admin account must have a verified email address.');
    }

    const profile = await loadOwnProfile(credentials.user.uid);

    if (!profile || profile.role !== 'admin') {
      await logout().catch(() => undefined);
      throw new Error('This account is not marked as admin in Firestore.');
    }

    setStatus('loginStatus', 'Signed in. Redirecting...', 'success');
    window.location.replace('./dashboard.html');
  } catch (error) {
    setStatus(
      'loginStatus',
      error instanceof Error ? error.message : 'Admin sign-in failed.',
      'danger'
    );
  } finally {
    setButtonBusy('loginButton', false, 'Sign In');
  }
});
