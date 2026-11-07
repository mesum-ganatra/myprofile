// Dashboard: list posts, counts, search/filter, publish/unpublish, delete.
import { requireAdmin, logout } from './guard.js';
import { listAllPosts, setPostStatus, deletePost, esc, cloudThumb, toast } from './common.js';

const $ = (id) => document.getElementById(id);
let posts = [];

function fmt(ts) {
  const ms = ts && ts.toMillis ? ts.toMillis() : 0;
  return ms ? new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'no date';
}

function render() {
  $('s-total').textContent = posts.length;
  $('s-pub').textContent = posts.filter((p) => p.status === 'published').length;
  $('s-draft').textContent = posts.filter((p) => p.status !== 'published').length;
  const term = $('q').value.trim().toLowerCase();
  const f = $('f').value;
  const list = posts.filter((p) => {
    if (f !== 'all' && (p.status === 'published' ? 'published' : 'draft') !== f) return false;
    return !term || `${p.title} ${(p.tags || []).join(' ')} ${p.slug}`.toLowerCase().includes(term);
  });
  $('msg').textContent = posts.length ? (list.length ? '' : 'No posts match.') : 'No posts yet. Click "New post" to write your first one.';
  $('list').innerHTML = list.map((p) => {
    const pub = p.status === 'published';
    const thumb = p.coverImage && p.coverImage.url
      ? `<img src="${esc(cloudThumb(p.coverImage.url))}" alt="" />` : '<div class="noimg"><i class="fa-regular fa-image"></i></div>';
    const tags = (p.tags || []).map((t) => `<span class="tag-pill">${esc(t)}</span>`).join('');
    return `<div class="prow" data-id="${esc(p.id)}">
      ${thumb}
      <div class="info">
        <div class="title">${esc(p.title || '(untitled)')}</div>
        <div class="meta"><span class="badge ${pub ? 'published' : 'draft'}">${pub ? 'Published' : 'Draft'}</span>
          <span>${esc(pub ? fmt(p.publishedAt) : fmt(p.updatedAt))}</span> ${tags}</div>
      </div>
      <div class="acts">
        <a class="btn sm" href="/admin/editor?id=${encodeURIComponent(p.id)}">Edit</a>
        ${pub ? `<a class="btn sm" href="/blog/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">View</a>` : ''}
        <button class="btn sm" data-act="toggle">${pub ? 'Unpublish' : 'Publish'}</button>
        <button class="btn sm danger" data-act="delete">Delete</button>
      </div></div>`;
  }).join('');
}

async function load() {
  $('msg').textContent = 'Loading...';
  try { posts = await listAllPosts(); render(); }
  catch (e) { console.error(e); $('msg').textContent = 'Could not load posts: ' + e.message; }
}

function askDelete(post) {
  const d = $('confirm');
  $('c-title').textContent = 'Delete post?';
  $('c-text').textContent = `"${post.title || '(untitled)'}" will be deleted permanently and its URL freed. Its images stay in Cloudinary.`;
  d.showModal();
  return new Promise((resolve) => {
    const done = (v) => { d.close(); $('c-yes').onclick = $('c-no').onclick = null; resolve(v); };
    $('c-yes').onclick = () => done(true);
    $('c-no').onclick = () => done(false);
  });
}

$('list').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const post = posts.find((p) => p.id === btn.closest('.prow').dataset.id);
  if (!post) return;
  btn.disabled = true;
  try {
    if (btn.dataset.act === 'toggle') {
      const to = post.status === 'published' ? 'draft' : 'published';
      await setPostStatus(post, to);
      toast(to === 'published' ? 'Published' : 'Unpublished');
    } else if (await askDelete(post)) {
      await deletePost(post);
      toast('Post deleted');
    }
    await load();
  } catch (err) { console.error(err); toast('Failed: ' + err.message); btn.disabled = false; }
});
$('q').addEventListener('input', render);
$('f').addEventListener('change', render);
$('logout').addEventListener('click', logout);

requireAdmin().then(load);
