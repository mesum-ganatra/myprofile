// Public post page: finds the post by slug, renders sanitized HTML, sets SEO tags.
import { fetchPostBySlug, formatDate, escapeHtml, cloudinaryUrl, SITE } from './blog-data.js';

const $ = (id) => document.getElementById(id);

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const m = /\[(\w+(?::\w+)?)="([^"]+)"\]/.exec(selector);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function notFound() {
  document.title = 'Post not found | Muhammad Mesum';
  setMeta('meta[name="robots"]', 'content', 'noindex');
  $('state').innerHTML = '<h1 class="text-2xl font-bold mb-2">Post not found</h1><p>This post does not exist or is not published.</p><p class="mt-4"><a class="text-cyan-500 underline" href="/blog">Back to the blog</a></p>';
  $('state').classList.remove('hidden');
}

function seo(post, url) {
  const title = (post.seo && post.seo.metaTitle) || post.title;
  const desc = (post.seo && post.seo.metaDescription) || post.excerpt || '';
  const image = post.coverImage && post.coverImage.url ? cloudinaryUrl(post.coverImage.url, 1200) : '';
  document.title = `${title} | Muhammad Mesum`;
  setMeta('meta[name="description"]', 'content', desc);
  document.head.querySelector('link[rel="canonical"]').setAttribute('href', url);
  setMeta('meta[property="og:type"]', 'content', 'article');
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', desc);
  setMeta('meta[property="og:url"]', 'content', url);
  if (image) setMeta('meta[property="og:image"]', 'content', image);
  setMeta('meta[name="twitter:card"]', 'content', image ? 'summary_large_image' : 'summary');
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: desc,
    datePublished: new Date(post.publishedMs).toISOString(),
    dateModified: new Date(post.updatedMs || post.publishedMs).toISOString(),
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: 'Muhammad Mesum' },
  };
  if (image) ld.image = image;
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
}

function render(post) {
  const url = `${SITE}/blog/${encodeURIComponent(post.slug)}`;
  seo(post, url);
  const html = window.sanitizeHtml(post.contentHtml || '');
  const cover = post.coverImage && post.coverImage.url
    ? `<img class="post-cover" src="${escapeHtml(cloudinaryUrl(post.coverImage.url, 1200))}" alt="${escapeHtml(post.coverImage.alt || '')}" />` : '';
  const tags = (post.tags || []).map((t) => `<span class="post-tag">${escapeHtml(t)}</span>`).join('');
  const enc = encodeURIComponent(url);
  const text = encodeURIComponent(post.title);
  $('article').innerHTML = `
    <header class="post-head">
      <div class="post-meta">${escapeHtml(formatDate(post.publishedMs))}${post.readingTime ? ` &middot; ${escapeHtml(post.readingTime)} min read` : ''}</div>
      <h1 class="gradient-text-primary">${escapeHtml(post.title)}</h1>
      ${tags ? `<div class="post-tags">${tags}</div>` : ''}
    </header>
    ${cover}
    <div class="prose-post" id="body">${html}</div>
    <div class="share-row">
      <span class="text-sm font-semibold mr-1">Share</span>
      <a class="share-btn" target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?url=${enc}&text=${text}"><i class="fa-brands fa-x-twitter"></i> X</a>
      <a class="share-btn" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${enc}"><i class="fa-brands fa-linkedin-in"></i> LinkedIn</a>
      <a class="share-btn" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${text}%20${enc}"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>
      <button class="share-btn" type="button" id="copy-link"><i class="fa-regular fa-copy"></i> <span>Copy link</span></button>
    </div>`;
  // wrap tables so wide ones scroll instead of breaking the layout
  $('body').querySelectorAll('table').forEach((t) => {
    const w = document.createElement('div'); w.className = 'table-wrap';
    t.parentNode.insertBefore(w, t); w.appendChild(t);
  });
  $('copy-link').addEventListener('click', async (e) => {
    const label = e.currentTarget.querySelector('span');
    try { await navigator.clipboard.writeText(url); label.textContent = 'Copied!'; }
    catch (err) { label.textContent = 'Copy failed'; }
    setTimeout(() => { label.textContent = 'Copy link'; }, 2000);
  });
  $('state').classList.add('hidden');
  $('article').classList.remove('hidden');
}

(async function init() {
  const slug = decodeURIComponent(location.pathname.replace(/^\/blog\/?/, '').split('/')[0] || '');
  if (!slug) return notFound();
  try {
    const post = await fetchPostBySlug(slug);
    if (!post) return notFound();
    render(post);
  } catch (err) {
    console.error(err);
    $('state').textContent = 'Could not load this post right now. Please try again later.';
  }
})();
