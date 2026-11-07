// HTML sanitizer used before saving a post and again before rendering it.
// Exposes window.sanitizeHtml(html) -> safe html string.
import DOMPurify from 'dompurify';

const YT_PREFIX = 'https://www.youtube-nocookie.com/embed/';
const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s,.%]+\)|[a-zA-Z]{3,20})$/;
const ALIGN_RE = /^(left|center|right|justify)$/;

const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'code', 'pre', 'mark', 'span', 'a', 'blockquote', 'ul', 'ol', 'li', 'label', 'input',
  'div', 'img', 'iframe', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
];
const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style', 'loading',
  'colspan', 'rowspan', 'colwidth', 'type', 'checked', 'disabled',
  'data-type', 'data-checked', 'data-youtube-video', 'width', 'height',
  'allowfullscreen', 'frameborder', 'allow', 'referrerpolicy',
];

function cleanStyle(value) {
  const kept = [];
  String(value || '').split(';').forEach((decl) => {
    const i = decl.indexOf(':');
    if (i < 0) return;
    const prop = decl.slice(0, i).trim().toLowerCase();
    const val = decl.slice(i + 1).trim();
    if ((prop === 'color' || prop === 'background-color') && COLOR_RE.test(val)) kept.push(`${prop}: ${val}`);
    else if (prop === 'text-align' && ALIGN_RE.test(val)) kept.push(`${prop}: ${val}`);
  });
  return kept.join('; ');
}

DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe') {
    const src = node.getAttribute && node.getAttribute('src');
    if (!src || !src.startsWith(YT_PREFIX)) node.parentNode && node.parentNode.removeChild(node);
  }
});

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (!node.tagName) return;
  const tag = node.tagName.toLowerCase();
  if (node.hasAttribute('style')) {
    const s = cleanStyle(node.getAttribute('style'));
    if (s) node.setAttribute('style', s); else node.removeAttribute('style');
  }
  if (tag === 'img') {
    const src = node.getAttribute('src') || '';
    if (!/^https:\/\//i.test(src)) node.parentNode && node.parentNode.removeChild(node);
    else node.setAttribute('loading', 'lazy');
  }
  if (tag === 'a') {
    const href = node.getAttribute('href') || '';
    if (!/^(https?:|mailto:|#|\/)/i.test(href)) node.removeAttribute('href');
    if (node.getAttribute('target') === '_blank') node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
  if (tag === 'iframe') {
    node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    node.setAttribute('allowfullscreen', 'true');
    node.removeAttribute('style');
  }
  if (tag === 'input') {
    if ((node.getAttribute('type') || '') !== 'checkbox') node.parentNode && node.parentNode.removeChild(node);
    else node.setAttribute('disabled', 'disabled');
  }
});

window.sanitizeHtml = function sanitizeHtml(html) {
  return DOMPurify.sanitize(String(html || ''), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
};
