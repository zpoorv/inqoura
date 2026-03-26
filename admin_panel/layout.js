import { logout } from './firebase-client.js';

export function setupAdminLayout({ activeNav, profile, user }) {
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    if (link.dataset.navLink === activeNav) {
      link.classList.add('active');
    }
  });

  const sessionName = document.getElementById('sessionName');
  const sessionEmail = document.getElementById('sessionEmail');
  const logoutButton = document.getElementById('logoutButton');

  if (sessionName) {
    sessionName.textContent = profile.name || user.displayName || 'Admin';
  }

  if (sessionEmail) {
    sessionEmail.textContent = user.email || profile.email || '-';
  }

  logoutButton?.addEventListener('click', async () => {
    await logout();
    window.location.replace('./login.html');
  });
}
