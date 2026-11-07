// Admin check. The Firestore rules are the real lock; this only decides what the pages show.
import { app } from '../firebase-config.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

// To add another admin: add their UID here AND in the Firestore rules (see firestore.rules).
export const ADMIN_UIDS = ['GhU1pJNsytTivKochaskPgO4Fiy1'];

export const auth = getAuth(app);

export function isAdminUser(user) {
  return !!user && ADMIN_UIDS.includes(user.uid);
}

// Resolves with the admin user, or redirects to the login page.
export function requireAdmin() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (isAdminUser(user)) {
        document.documentElement.classList.remove('auth-pending');
        resolve(user);
      } else {
        if (user) { try { await signOut(auth); } catch (e) { /* ignore */ } }
        location.replace('/admin/login');
      }
    });
  });
}

export async function logout() {
  await signOut(auth);
  location.replace('/admin/login');
}
