// Firestore reads used by the public blog pages.
import { app } from './firebase-config.js';
import {
  getFirestore, collection, query, where, getDocs, limit,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// Public site address, used for canonical URLs and share links.
export const SITE = 'https://myprofile-ten-rho.vercel.app';

const db = getFirestore(app);

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  const t = new Date(ts).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function normalize(snap) {
  const d = snap.data();
  return { id: snap.id, ...d, publishedMs: toMillis(d.publishedAt), updatedMs: toMillis(d.updatedAt) };
}

// Equality filter only -> no composite index needed; sorting happens in the browser.
export async function fetchPublishedPosts() {
  const snap = await getDocs(query(collection(db, 'posts'), where('status', '==', 'published')));
  return snap.docs.map(normalize).sort((a, b) => b.publishedMs - a.publishedMs);
}

export async function fetchPostBySlug(slug) {
  const snap = await getDocs(
    query(collection(db, 'posts'), where('slug', '==', slug), where('status', '==', 'published'), limit(1))
  );
  return snap.empty ? null : normalize(snap.docs[0]);
}

export function formatDate(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Adds Cloudinary delivery options (auto format/quality + width limit) to an image URL.
export function cloudinaryUrl(url, width) {
  if (!url || !/^https:\/\/res\.cloudinary\.com\//.test(url)) return url || '';
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
