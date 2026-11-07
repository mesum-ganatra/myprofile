// Shared admin helpers: slugs, YouTube parsing, Cloudinary upload, Firestore post operations.
import { app } from '../firebase-config.js';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../cloudinary-config.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, runTransaction, writeBatch, updateDoc,
  serverTimestamp, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

export const db = getFirestore(app);
export { Timestamp, serverTimestamp };

export function slugify(text) {
  return String(text || '')
    .toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

// Accepts watch, youtu.be, shorts, embed and live links. Returns the 11-char video id or null.
export function parseYouTube(input) {
  let u;
  try { u = new URL(String(input || '').trim()); } catch (e) { return null; }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = /^\/(shorts|embed|live)\/([\w-]{11})/.exec(u.pathname);
      if (m) id = m[2];
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// Unsigned upload straight from the browser. Resolves with the secure image URL.
export function uploadImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_IMAGE.includes(file.type)) return reject(new Error('Use a JPG, PNG, WebP, GIF or AVIF image.'));
    if (file.size > MAX_IMAGE_BYTES) return reject(new Error('Image is larger than 8 MB.'));
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      let res = {};
      try { res = JSON.parse(xhr.responseText); } catch (e) { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) resolve(res.secure_url);
      else reject(new Error((res.error && res.error.message) || 'Image upload failed.'));
    };
    xhr.onerror = () => reject(new Error('Network error while uploading the image.'));
    xhr.send(fd);
  });
}

export function newPostId() { return doc(collection(db, 'posts')).id; }

export async function getPost(id) {
  const snap = await getDoc(doc(db, 'posts', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listAllPosts() {
  const snap = await getDocs(collection(db, 'posts'));
  const ms = (t) => (t && t.toMillis ? t.toMillis() : 0);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (ms(b.updatedAt) || ms(b.createdAt)) - (ms(a.updatedAt) || ms(a.createdAt)));
}

// Writes the post and its slug document in ONE transaction so two posts can never share a URL.
export async function savePost(id, data, oldSlug) {
  const postRef = doc(db, 'posts', id);
  const slugRef = doc(db, 'slugs', data.slug);
  await runTransaction(db, async (tx) => {
    const slugSnap = await tx.get(slugRef);
    if (slugSnap.exists() && slugSnap.data().postId !== id) {
      throw new Error('That URL slug is already used by another post. Choose a different one.');
    }
    const postSnap = await tx.get(postRef);
    let oldSlugRef = null;
    if (oldSlug && oldSlug !== data.slug) {
      oldSlugRef = doc(db, 'slugs', oldSlug);
      const o = await tx.get(oldSlugRef);
      if (!o.exists() || o.data().postId !== id) oldSlugRef = null;
    }
    const payload = { ...data, updatedAt: serverTimestamp() };
    if (!postSnap.exists()) payload.createdAt = serverTimestamp();
    tx.set(postRef, payload, { merge: true });
    tx.set(slugRef, { postId: id });
    if (oldSlugRef) tx.delete(oldSlugRef);
  });
}

export async function setPostStatus(post, status) {
  const upd = { status, updatedAt: serverTimestamp() };
  if (status === 'published' && !post.publishedAt) upd.publishedAt = serverTimestamp();
  await updateDoc(doc(db, 'posts', post.id), upd);
}

// Deleting a post also frees its slug. (Cloudinary images are not deleted.)
export async function deletePost(post) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'posts', post.id));
  if (post.slug) batch.delete(doc(db, 'slugs', post.slug));
  await batch.commit();
}

export function toast(msg, ms = 3200) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.style.display = 'none'; }, ms);
}

export function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function cloudThumb(url, w = 200) {
  return url && /^https:\/\/res\.cloudinary\.com\//.test(url) ? url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`) : (url || '');
}

export function applySavedTheme() {
  let t = null; try { t = localStorage.getItem('portfolio_theme'); } catch (e) { /* ignore */ }
  document.documentElement.classList.toggle('dark', t !== 'light');
}
