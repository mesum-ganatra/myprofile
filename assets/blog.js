// Public blog list: cards, search, tag filter, "Load more" after 9 posts.
import { fetchPublishedPosts, formatDate, escapeHtml, cloudinaryUrl } from './blog-data.js';

const PAGE = 9;
const $ = (id) => document.getElementById(id);
let posts = [];
let shown = PAGE;
let activeTag = '';
let term = '';

function matches(p) {
  if (activeTag && !(p.tags || []).includes(activeTag)) return false;
  if (!term) return true;
  const hay = `${p.title} ${p.excerpt} ${(p.tags || []).join(' ')}`.toLowerCase();
  return hay.includes(term);
}

function row(p) {
  const cover = p.coverImage && p.coverImage.url
    ? `<img class="post-thumb" src="${escapeHtml(cloudinaryUrl(p.coverImage.url, 320))}" alt="${escapeHtml(p.coverImage.alt || '')}" loading="lazy" />`
    : `<div class="post-thumb post-thumb-empty"><i class="fa-regular fa-image"></i></div>`;
  const tags = (p.tags || []).map((t) => `<span class="post-tag">${escapeHtml(t)}</span>`).join('');
  return `<a class="post-row glass-panel interactive-card" href="/blog/${encodeURIComponent(p.slug)}">
    ${cover}
    <div style="min-width:0">
      <div class="post-meta">${escapeHtml(formatDate(p.publishedMs))}${p.readingTime ? ` &middot; ${escapeHtml(p.readingTime)} min read` : ''}</div>
      <h2>${escapeHtml(p.title)}</h2>
      <p class="post-excerpt">${escapeHtml(p.excerpt || '')}</p>
      ${tags ? `<div class="post-tags">${tags}</div>` : ''}
    </div></a>`;
}

function render() {
  const list = posts.filter(matches);
  $('list').innerHTML = list.slice(0, shown).map(row).join('');
  $('load-more').classList.toggle('hidden', list.length <= shown);
  const state = $('state');
  if (!posts.length) { state.textContent = 'No posts yet. Check back soon.'; state.classList.remove('hidden'); }
  else if (!list.length) { state.textContent = 'No posts match your search.'; state.classList.remove('hidden'); }
  else state.classList.add('hidden');
}

function renderTags() {
  const all = [...new Set(posts.flatMap((p) => p.tags || []))].sort();
  const box = $('tag-filter');
  if (!all.length) { box.innerHTML = ''; return; }
  box.innerHTML = ['', ...all].map((t) =>
    `<button type="button" class="tag-chip${t === activeTag ? ' active' : ''}" data-tag="${escapeHtml(t)}">${t ? escapeHtml(t) : 'All'}</button>`).join('');
}

$('tag-filter').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tag]');
  if (!b) return;
  activeTag = b.dataset.tag; shown = PAGE; renderTags(); render();
});
$('search').addEventListener('input', (e) => { term = e.target.value.trim().toLowerCase(); shown = PAGE; render(); });
$('load-more').addEventListener('click', () => { shown += PAGE; render(); });

(async function init() {
  try {
    posts = await fetchPublishedPosts();
    renderTags();
    render();
  } catch (err) {
    console.error(err);
    $('state').textContent = 'Could not load posts right now. Please try again later.';
  }
})();
