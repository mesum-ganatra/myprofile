// Firestore reads used by the public blog pages.
// Uses the Firestore *Lite* SDK: read-only, a fraction of the size of the full SDK, and no
// live connection to set up, so the blog loads faster. (Admin pages use the full SDK.)
import { app } from './firebase-config.js';
import {
  getFirestore, collection, query, where, getDocs, limit,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-lite.js';

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

export { SITE, formatDate, escapeHtml, cloudinaryUrl } from './blog-utils.js';
