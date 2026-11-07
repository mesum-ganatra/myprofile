// Small helpers with no Firebase dependency, so a cached page can paint before the Firebase
// library has finished downloading.

// Public site address, used for canonical URLs and share links.
export const SITE = 'https://myprofile-ten-rho.vercel.app';


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
