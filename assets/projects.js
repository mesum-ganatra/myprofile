// Renders the Projects list (projects.html) or one project (projects.html?p=<slug>)
// from /projects.json. Static: edit projects.json to add or change projects.
(function () {
  var root = document.getElementById('projects-root');
  if (!root) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  // Only allow http(s) links (blocks javascript: URLs coming from the JSON)
  function safeUrl(u) {
    u = String(u || '').trim().replace(/^https?:\/(?!\/)/, 'https://');
    return /^https?:\/\//i.test(u) ? u : '';
  }
  function heading(text) {
    return '<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">' + esc(text) + '</h1>';
  }
  function chips(tech) {
    return (tech || []).map(function (t) {
      return '<span class="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">' + esc(t) + '</span>';
    }).join('');
  }

  function renderList(projects) {
    if (!projects.length) {
      root.innerHTML = heading('Projects') + '<p class="mt-4 text-slate-500 dark:text-slate-400">No projects yet.</p>';
      return;
    }
    root.innerHTML = '<div class="space-y-2"><p class="mono text-sm text-cyan-500 dark:text-cyan-400">// selected work</p>' + heading('Projects') +
      '<p class="text-slate-600 dark:text-slate-400">Things I have built. Click a project for details.</p></div>' +
      '<div class="proj-list mt-8">' + projects.map(function (p, i) {
        return '<a href="/projects.html?p=' + encodeURIComponent(p.slug) + '" class="proj-row">' +
          '<span class="proj-num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<div><h2 class="proj-name text-slate-900 dark:text-white">' + esc(p.name) + '</h2>' +
          '<p class="proj-sum text-slate-600 dark:text-slate-300">' + esc(p.summary) + '</p>' +
          (p.tech && p.tech.length ? '<div class="proj-tags">' + p.tech.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
          '</div>' + (p.image ? '<img class="proj-thumb" loading="lazy" alt="Screenshot of ' + esc(p.name) + '" src="' + esc(p.image) + '" />' : '<span></span>') +
          '<i class="fa-solid fa-arrow-up-right proj-arrow" aria-hidden="true"></i></a>';
      }).join('') + '</div>';
  }

  function linkButton(href, icon, label, primary) {
    var cls = primary
      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20 hover:opacity-95'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 hover:text-cyan-500';
    return '<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ' + cls + '">' +
      '<i class="' + icon + ' text-sm"></i><span class="flex-1">' + esc(label) + '</span>' +
      '<i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70"></i></a>';
  }

  function renderDetail(p) {
    var paras = Array.isArray(p.description) ? p.description : (p.description ? [p.description] : [p.summary]);
    var live = safeUrl(p.liveUrl);
    var codes = (p.codes || []).map(function (c) { return { label: c.label, url: safeUrl(c.url) }; })
      .filter(function (c) { return c.url; });

    var side = '';
    if (live) side += '<div class="space-y-2"><span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Live</span>' +
      linkButton(live, 'fa-solid fa-globe', 'Live Demo', true) + '</div>';
    if (codes.length) side += '<div class="space-y-2"><span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Code</span>' +
      codes.map(function (c) { return linkButton(c.url, 'fa-brands fa-github', c.label || 'Source Code', false); }).join('') + '</div>';

    root.innerHTML = '<a href="/projects.html" class="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline mb-6">' +
      '<i class="fa-solid fa-arrow-left text-xs"></i> All projects</a>' +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
      '<article class="lg:col-span-2 space-y-5">' + heading(p.name) +
      (p.image ? '<img class="proj-cover" alt="Screenshot of ' + esc(p.name) + '" src="' + esc(p.image) + '" />' : '') +
      (p.tech && p.tech.length ? '<div class="flex flex-wrap gap-2">' + chips(p.tech) + '</div>' : '') +
      paras.map(function (t) { return '<p class="text-slate-600 dark:text-slate-300 leading-relaxed">' + esc(t) + '</p>'; }).join('') +
      '</article>' +
      (side ? '<aside class="glass-panel p-5 rounded-xl space-y-5 h-fit lg:sticky lg:top-24">' + side + '</aside>' : '') +
      '</div>';
    document.title = p.name + ' | Projects';
  }

  fetch('/projects.json').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (data) {
    var projects = Array.isArray(data.projects) ? data.projects : [];
    var slug = new URLSearchParams(location.search).get('p');
    if (!slug) return renderList(projects);
    var found = projects.filter(function (p) { return p.slug === slug; })[0];
    if (found) renderDetail(found);
    else root.innerHTML = heading('Project not found') + '<p class="mt-4"><a class="text-cyan-600 dark:text-cyan-400 hover:underline" href="/projects.html">Back to all projects</a></p>';
  }).catch(function (e) {
    root.innerHTML = heading('Projects') + '<p class="mt-4 text-slate-500 dark:text-slate-400">Could not load projects (' + esc(e.message) + ').</p>';
  });
})();
