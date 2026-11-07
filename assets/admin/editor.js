// Editor page: Tiptap toolbar, slash menu, cover + inline images, YouTube, save/publish, autosave, preview.
import { requireAdmin } from './guard.js';
import {
  slugify, parseYouTube, uploadImage, newPostId, getPost, savePost, toast, esc, Timestamp, serverTimestamp,
} from './common.js';

const $ = (id) => document.getElementById(id);
const TE = window.TiptapEditor;
const sanitize = window.sanitizeHtml;

let editor = null;
let postId = null;
let existing = null; // last saved document from Firestore
let cover = null; // { url }
let tags = [];
let dirty = false;
let saving = false;
let slugTouched = false;

/* ---------- small helpers ---------- */
function markDirty() {
  dirty = true;
  const s = $('savestate');
  if (s) s.textContent = 'Unsaved changes';
}

function ask({ title, label, value = '', placeholder = '', okText = 'OK' }) {
  const d = $('ask');
  $('ask-title').textContent = title;
  $('ask-label').textContent = label;
  $('ask-ok').textContent = okText;
  const input = $('ask-input');
  input.value = value; input.placeholder = placeholder;
  // Remember where the cursor/selection was: closing a dialog makes the browser reset
  // the caret to the start of the editor, which would insert content at the top.
  const sel = editor ? { from: editor.state.selection.from, to: editor.state.selection.to } : null;
  return new Promise((resolve) => {
    let result = null;
    const form = $('ask-form');
    const onSubmit = () => { result = input.value; };
    const onCancel = () => d.close();
    form.addEventListener('submit', onSubmit, { once: true });
    $('ask-cancel').addEventListener('click', onCancel, { once: true });
    d.addEventListener('close', () => {
      form.removeEventListener('submit', onSubmit);
      $('ask-cancel').removeEventListener('click', onCancel);
      if (sel && editor) {
        const max = editor.state.doc.content.size;
        editor.chain().focus().setTextSelection({ from: Math.min(sel.from, max), to: Math.min(sel.to, max) }).run();
      }
      resolve(result);
    }, { once: true });
    d.showModal();
    input.focus(); input.select();
  });
}

/* ---------- tags ---------- */
function renderTags() {
  const box = $('tags-box');
  box.querySelectorAll('.tag-pill').forEach((n) => n.remove());
  const input = $('tag-input');
  tags.forEach((t, i) => {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.innerHTML = `${esc(t)} <button type="button" aria-label="Remove tag ${esc(t)}" data-i="${i}">&times;</button>`;
    box.insertBefore(pill, input);
  });
}
function addTag(raw) {
  const t = String(raw || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '').slice(0, 30);
  if (t && !tags.includes(t) && tags.length < 12) { tags.push(t); renderTags(); markDirty(); }
}

/* ---------- cover photo ---------- */
function showCover() {
  $('cover-empty').style.display = cover ? 'none' : '';
  $('cover-filled').style.display = cover ? '' : 'none';
  if (cover) $('cover-img').src = cover.url.replace('/upload/', '/upload/f_auto,q_auto,w_900/');
}
async function uploadCover(file) {
  if (!file) return;
  const bar = $('cover-progress');
  bar.style.display = 'block'; bar.firstElementChild.style.width = '0';
  try {
    const url = await uploadImage(file, (p) => { bar.firstElementChild.style.width = p + '%'; });
    cover = { url };
    showCover(); markDirty();
    $('cover-alt').focus();
  } catch (e) { toast(e.message); }
  bar.style.display = 'none';
}

/* ---------- inline images ---------- */
let uploads = 0;
async function insertImages(files) {
  for (const file of files) {
    uploads++; $('up').style.display = '';
    try {
      const url = await uploadImage(file);
      const alt = await ask({ title: 'Image description', label: 'Alt text (describes the image for screen readers)', okText: 'Insert' });
      // block image followed by an empty paragraph: the caret lands after it, so the next
      // thing typed or inserted does not replace the image
      editor.chain().focus().insertContent([
        { type: 'image', attrs: { src: url, alt: (alt || '').trim() } },
        { type: 'paragraph' },
      ]).run();
    } catch (e) { toast(e.message); }
    uploads--; if (!uploads) $('up').style.display = 'none';
  }
}

/* ---------- commands ---------- */
async function setLink() {
  const prev = editor.getAttributes('link').href || '';
  const val = await ask({ title: 'Link', label: 'Address (leave empty to remove the link)', value: prev, placeholder: 'https://example.com', okText: 'Apply' });
  if (val === null) return;
  let href = val.trim();
  if (!href) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
  if (!/^(https?:\/\/|mailto:)/i.test(href)) href = 'https://' + href;
  if (editor.state.selection.empty && !editor.isActive('link')) {
    // nothing selected: insert the address itself as a clickable link
    editor.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
  } else {
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }
}
async function addYoutube() {
  const val = await ask({ title: 'YouTube video', label: 'Paste a YouTube link', placeholder: 'https://www.youtube.com/watch?v=...', okText: 'Embed' });
  if (val === null) return;
  const id = parseYouTube(val);
  if (!id) { toast('That is not a valid YouTube link.'); return; }
  editor.chain().focus().insertContent([
    { type: 'youtube', attrs: { src: `https://www.youtube.com/watch?v=${id}` } },
    { type: 'paragraph' },
  ]).run();
}
function pickImage() { $('img-file').click(); }

const COMMANDS = {
  undo: () => editor.chain().focus().undo().run(),
  redo: () => editor.chain().focus().redo().run(),
  bold: () => editor.chain().focus().toggleBold().run(),
  italic: () => editor.chain().focus().toggleItalic().run(),
  underline: () => editor.chain().focus().toggleUnderline().run(),
  strike: () => editor.chain().focus().toggleStrike().run(),
  code: () => editor.chain().focus().toggleCode().run(),
  highlight: () => editor.chain().focus().toggleHighlight().run(),
  uncolor: () => editor.chain().focus().unsetColor().run(),
  link: setLink,
  bullet: () => editor.chain().focus().toggleBulletList().run(),
  ordered: () => editor.chain().focus().toggleOrderedList().run(),
  task: () => editor.chain().focus().toggleTaskList().run(),
  quote: () => editor.chain().focus().toggleBlockquote().run(),
  codeblock: () => editor.chain().focus().toggleCodeBlock().run(),
  hr: () => editor.chain().focus().setHorizontalRule().run(),
  alignLeft: () => editor.chain().focus().setTextAlign('left').run(),
  alignCenter: () => editor.chain().focus().setTextAlign('center').run(),
  alignRight: () => editor.chain().focus().setTextAlign('right').run(),
  table: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  addRow: () => editor.chain().focus().addRowAfter().run(),
  delRow: () => editor.chain().focus().deleteRow().run(),
  addCol: () => editor.chain().focus().addColumnAfter().run(),
  delCol: () => editor.chain().focus().deleteColumn().run(),
  delTable: () => editor.chain().focus().deleteTable().run(),
  image: pickImage,
  youtube: addYoutube,
};

function refreshToolbar() {
  document.querySelectorAll('#toolbar [data-active]').forEach((b) => {
    b.classList.toggle('active', editor.isActive(b.dataset.active));
  });
  document.querySelectorAll('#toolbar [data-align]').forEach((b) => {
    b.classList.toggle('active', editor.isActive({ textAlign: b.dataset.align }));
  });
  const sel = $('block');
  let v = 'p';
  for (let l = 1; l <= 4; l++) if (editor.isActive('heading', { level: l })) v = String(l);
  sel.value = v;
  $('table-tools').classList.toggle('on', editor.isActive('table'));
}

/* ---------- slash menu ---------- */
const SLASH = [
  { title: 'Paragraph', hint: 'Plain text', keys: 'text p', run: () => editor.chain().focus().setParagraph().run() },
  { title: 'Heading 1', hint: 'Big section title', keys: 'h1', run: () => editor.chain().focus().setHeading({ level: 1 }).run() },
  { title: 'Heading 2', hint: 'Section title', keys: 'h2', run: () => editor.chain().focus().setHeading({ level: 2 }).run() },
  { title: 'Heading 3', hint: 'Subsection', keys: 'h3', run: () => editor.chain().focus().setHeading({ level: 3 }).run() },
  { title: 'Heading 4', hint: 'Small heading', keys: 'h4', run: () => editor.chain().focus().setHeading({ level: 4 }).run() },
  { title: 'Bullet list', hint: 'Simple list', keys: 'ul list', run: COMMANDS.bullet },
  { title: 'Numbered list', hint: 'Ordered list', keys: 'ol list', run: COMMANDS.ordered },
  { title: 'Task list', hint: 'Checklist', keys: 'todo check', run: COMMANDS.task },
  { title: 'Quote', hint: 'Highlight a quote', keys: 'blockquote', run: COMMANDS.quote },
  { title: 'Code block', hint: 'With syntax highlighting', keys: 'code pre', run: COMMANDS.codeblock },
  { title: 'Divider', hint: 'Horizontal line', keys: 'hr line', run: COMMANDS.hr },
  { title: 'Table', hint: '3 x 3 table', keys: 'grid', run: COMMANDS.table },
  { title: 'Image', hint: 'Upload a photo', keys: 'photo picture', run: COMMANDS.image },
  { title: 'YouTube', hint: 'Embed a video', keys: 'video', run: COMMANDS.youtube },
];
let slashItems = [];
let slashSel = 0;
let slashRange = null;
let slashDismissed = false;

function hideSlash() { $('slash').style.display = 'none'; slashItems = []; slashRange = null; }
function drawSlash() {
  $('slash').innerHTML = slashItems.map((it, i) =>
    `<button type="button" class="${i === slashSel ? 'sel' : ''}" data-i="${i}"><span><b>${esc(it.title)}</b><br><small>${esc(it.hint)}</small></span></button>`).join('');
}
function checkSlash() {
  if (slashDismissed) return;
  const { $from, empty } = editor.state.selection;
  if (!empty || !$from.parent.isTextblock || $from.parent.type.name === 'codeBlock') return hideSlash();
  const before = $from.parent.textBetween(0, $from.parentOffset, null, '￼');
  const m = /(?:^|\s)\/([\w-]*)$/.exec(before);
  if (!m) return hideSlash();
  const q = m[1].toLowerCase();
  const items = SLASH.filter((i) => !q || i.title.toLowerCase().includes(q) || i.keys.includes(q));
  if (!items.length) return hideSlash();
  slashRange = { from: $from.pos - m[1].length - 1, to: $from.pos };
  slashItems = items; slashSel = Math.min(slashSel, items.length - 1);
  drawSlash();
  const c = editor.view.coordsAtPos($from.pos);
  const box = $('slash');
  box.style.display = 'block';
  box.style.left = Math.min(c.left, window.innerWidth - 250) + 'px';
  const below = c.bottom + 6;
  box.style.top = (below + 280 > window.innerHeight ? Math.max(8, c.top - box.offsetHeight - 6) : below) + 'px';
}
function chooseSlash(i) {
  const item = slashItems[i];
  if (!item || !slashRange) return;
  const range = slashRange;
  hideSlash();
  editor.chain().focus().deleteRange(range).run();
  item.run();
}

/* ---------- save / publish ---------- */
function stats() {
  const words = editor.storage.characterCount.words();
  return { words, minutes: Math.max(1, Math.ceil(words / 200)) };
}

function collect(status) {
  const title = $('title').value.trim();
  const slug = slugify($('slug').value || title);
  const { words, minutes } = stats();
  const text = editor.getText().replace(/\s+/g, ' ').trim();
  const data = {
    title,
    slug,
    excerpt: $('excerpt').value.trim() || text.slice(0, 160),
    contentJson: JSON.stringify(editor.getJSON()),
    contentHtml: sanitize(TE.highlightCodeBlocks(editor.getHTML())),
    coverImage: cover ? { url: cover.url, alt: $('cover-alt').value.trim() } : null,
    tags: tags.slice(),
    status,
    readingTime: minutes,
    seo: { metaTitle: $('seo-title').value.trim(), metaDescription: $('seo-desc').value.trim() },
  };
  const when = $('pubdate').value;
  if (when) data.publishedAt = Timestamp.fromDate(new Date(when));
  else if (status === 'published' && !(existing && existing.publishedAt)) data.publishedAt = serverTimestamp();
  return { data, words };
}

function validate(data, words, status) {
  if (!data.title) return 'Add a title first.';
  if (!data.slug) return 'Add a URL slug.';
  if (status === 'published') {
    if (!words) return 'Write some content before publishing.';
    if (data.coverImage && !data.coverImage.alt) return 'Add alt text for the cover photo before publishing.';
  }
  return '';
}

function toInputDate(ts) {
  const ms = ts && ts.toMillis ? ts.toMillis() : 0;
  if (!ms) return '';
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

function refreshUi() {
  const pub = existing && existing.status === 'published';
  $('badge').textContent = pub ? 'Published' : 'Draft';
  $('badge').className = 'badge ' + (pub ? 'published' : 'draft');
  $('btn-draft').style.display = pub ? 'none' : '';
  $('btn-publish').style.display = pub ? 'none' : '';
  $('btn-update').style.display = pub ? '' : 'none';
  $('btn-unpublish').style.display = pub ? '' : 'none';
  const v = $('btn-view');
  v.style.display = pub ? '' : 'none';
  if (pub) v.href = '/blog/' + encodeURIComponent(existing.slug);
  $('slug-hint').textContent = 'Address: /blog/' + (slugify($('slug').value || $('title').value) || '...');
}

async function save(status, { silent = false } = {}) {
  if (saving) return false;
  const { data, words } = collect(status);
  const problem = validate(data, words, status);
  if (problem) { if (!silent) toast(problem); return false; }
  saving = true;
  document.querySelectorAll('.topbar .btn').forEach((b) => { b.disabled = true; });
  try {
    if (!postId) postId = newPostId();
    await savePost(postId, data, existing && existing.slug);
    existing = await getPost(postId);
    $('slug').value = existing.slug;
    $('pubdate').value = toInputDate(existing.publishedAt);
    history.replaceState(null, '', '/admin/editor?id=' + encodeURIComponent(postId));
    dirty = false;
    $('savestate').textContent = (silent ? 'Autosaved ' : 'Saved ') + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    refreshUi();
    if (!silent) toast(status === 'published' ? (existing.status === 'published' ? 'Saved and live' : 'Saved') : 'Draft saved');
    return true;
  } catch (e) {
    console.error(e);
    if (!silent) toast('Could not save: ' + e.message, 5000);
    else $('savestate').textContent = 'Autosave failed';
    return false;
  } finally {
    saving = false;
    document.querySelectorAll('.topbar .btn').forEach((b) => { b.disabled = false; });
  }
}

const isPublished = () => existing && existing.status === 'published';
const saveCurrent = () => save(isPublished() ? 'published' : 'draft');

/* ---------- preview ---------- */
function openPreview() {
  const { data } = collect(isPublished() ? 'published' : 'draft');
  const date = (data.publishedAt && data.publishedAt.toDate ? data.publishedAt.toDate() : (existing && existing.publishedAt ? existing.publishedAt.toDate() : new Date()))
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const cov = data.coverImage ? `<img class="pcover" src="${esc(data.coverImage.url.replace('/upload/', '/upload/f_auto,q_auto,w_1200/'))}" alt="${esc(data.coverImage.alt)}" />` : '';
  $('preview-page').innerHTML = `
    <div class="post-meta">${esc(date)} &middot; ${data.readingTime} min read</div>
    <h1 class="ptitle">${esc(data.title || 'Untitled')}</h1>
    <div class="post-tags">${data.tags.map((t) => `<span class="post-tag">${esc(t)}</span>`).join('')}</div>
    ${cov}
    <div class="prose-post" id="pv-body">${data.contentHtml}</div>`;
  $('pv-body').querySelectorAll('table').forEach((t) => {
    const w = document.createElement('div'); w.className = 'table-wrap';
    t.parentNode.insertBefore(w, t); w.appendChild(t);
  });
  $('preview').classList.add('open');
}

/* ---------- init ---------- */
async function init() {
  await requireAdmin();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  let content = '';
  if (id) {
    existing = await getPost(id);
    if (!existing) { toast('Post not found.'); setTimeout(() => location.replace('/admin'), 1200); return; }
    postId = id;
    $('title').value = existing.title || '';
    $('slug').value = existing.slug || '';
    slugTouched = true;
    $('excerpt').value = existing.excerpt || '';
    $('pubdate').value = toInputDate(existing.publishedAt);
    $('seo-title').value = (existing.seo && existing.seo.metaTitle) || '';
    $('seo-desc').value = (existing.seo && existing.seo.metaDescription) || '';
    tags = Array.isArray(existing.tags) ? existing.tags.slice() : [];
    if (existing.coverImage && existing.coverImage.url) { cover = { url: existing.coverImage.url }; $('cover-alt').value = existing.coverImage.alt || ''; }
    try { content = JSON.parse(existing.contentJson); } catch (e) { content = existing.contentHtml || ''; }
    $('savestate').textContent = 'Loaded';
    document.title = 'Edit: ' + (existing.title || 'post');
  }
  renderTags(); showCover();

  editor = TE.createEditor({
    element: $('editor'),
    content,
    onUpdate: () => {
      markDirty();
      const s = stats();
      $('words').textContent = s.words + (s.words === 1 ? ' word' : ' words');
      $('reading').textContent = s.minutes + ' min read';
      slashDismissed = false;
      refreshToolbar(); checkSlash();
    },
    onSelection: () => { refreshToolbar(); checkSlash(); },
  });
  const s0 = stats();
  $('words').textContent = s0.words + (s0.words === 1 ? ' word' : ' words');
  $('reading').textContent = s0.minutes + ' min read';
  refreshToolbar(); refreshUi();
  dirty = false;

  // toolbar
  $('toolbar').addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
  $('toolbar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmd]');
    if (b && COMMANDS[b.dataset.cmd]) COMMANDS[b.dataset.cmd]();
  });
  $('block').addEventListener('change', (e) => {
    const v = e.target.value;
    if (v === 'p') editor.chain().focus().setParagraph().run();
    else editor.chain().focus().setHeading({ level: Number(v) }).run();
  });
  $('color').addEventListener('input', (e) => editor.chain().focus().setColor(e.target.value).run());

  // slash menu
  editor.view.dom.addEventListener('keydown', (e) => {
    if ($('slash').style.display !== 'block') return;
    if (e.key === 'ArrowDown') { slashSel = (slashSel + 1) % slashItems.length; drawSlash(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'ArrowUp') { slashSel = (slashSel - 1 + slashItems.length) % slashItems.length; drawSlash(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Enter' || e.key === 'Tab') { chooseSlash(slashSel); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Escape') { slashDismissed = true; hideSlash(); e.preventDefault(); e.stopPropagation(); }
  }, true);
  $('slash').addEventListener('mousedown', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) { e.preventDefault(); chooseSlash(Number(b.dataset.i)); }
  });

  // images: button, paste, drop
  $('img-file').addEventListener('change', (e) => { const f = [...e.target.files]; e.target.value = ''; if (f.length) insertImages(f); });
  editor.view.dom.addEventListener('paste', (e) => {
    const files = [...(e.clipboardData ? e.clipboardData.files : [])].filter((f) => f.type.startsWith('image/'));
    if (files.length) { e.preventDefault(); insertImages(files); }
  });
  editor.view.dom.addEventListener('drop', (e) => {
    const files = [...(e.dataTransfer ? e.dataTransfer.files : [])].filter((f) => f.type.startsWith('image/'));
    if (files.length) { e.preventDefault(); insertImages(files); }
  });

  // cover
  const cb = $('cover-empty');
  cb.addEventListener('click', () => $('cover-file').click());
  cb.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('cover-file').click(); } });
  $('cover-file').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; uploadCover(f); });
  ['dragenter', 'dragover'].forEach((ev) => cb.addEventListener(ev, (e) => { e.preventDefault(); cb.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => cb.addEventListener(ev, (e) => { e.preventDefault(); cb.classList.remove('drag'); }));
  cb.addEventListener('drop', (e) => uploadCover(e.dataTransfer.files[0]));
  $('cover-remove').addEventListener('click', () => { cover = null; $('cover-alt').value = ''; showCover(); markDirty(); });

  // fields
  $('title').addEventListener('input', () => {
    if (!slugTouched) $('slug').value = slugify($('title').value);
    markDirty(); refreshUi();
  });
  $('slug').addEventListener('input', () => { slugTouched = true; markDirty(); refreshUi(); });
  ['excerpt', 'pubdate', 'seo-title', 'seo-desc', 'cover-alt'].forEach((k) => $(k).addEventListener('input', markDirty));
  $('slug').addEventListener('blur', () => { $('slug').value = slugify($('slug').value); refreshUi(); });
  $('tag-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(e.target.value); e.target.value = ''; }
    else if (e.key === 'Backspace' && !e.target.value && tags.length) { tags.pop(); renderTags(); markDirty(); }
  });
  $('tag-input').addEventListener('blur', (e) => { if (e.target.value) { addTag(e.target.value); e.target.value = ''; } });
  $('tags-box').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (b) { tags.splice(Number(b.dataset.i), 1); renderTags(); markDirty(); }
  });

  // buttons
  $('btn-draft').addEventListener('click', () => save('draft'));
  $('btn-publish').addEventListener('click', () => save('published'));
  $('btn-update').addEventListener('click', () => save('published'));
  $('btn-unpublish').addEventListener('click', async () => { if (await save('draft')) toast('Unpublished. The post is now a draft.'); });
  $('btn-preview').addEventListener('click', openPreview);
  $('preview-close').addEventListener('click', () => $('preview').classList.remove('open'));
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveCurrent(); }
    if (e.key === 'Escape' && $('preview').classList.contains('open')) $('preview').classList.remove('open');
  });

  // autosave drafts only; published posts never change silently
  setInterval(() => {
    if (dirty && !saving && !isPublished() && $('title').value.trim()) save('draft', { silent: true });
  }, 20000);
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
}

init().catch((e) => { console.error(e); toast('Editor failed to start: ' + e.message, 6000); });
