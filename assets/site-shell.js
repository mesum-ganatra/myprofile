// Shared header/footer behaviour for the secondary pages (blog, projects, resume, coding):
// theme toggle, mobile menu, nav links and footer built from resume.json (same data as the main site).
(function () {
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function fixUrl(u) { return u ? String(u).replace(/^https?:\/(?!\/)/, 'https://') : '#'; }

  // Theme (same storage key as the main site)
  var toggle = document.getElementById('theme-toggle');
  var icon = document.getElementById('theme-toggle-icon');
  function setIcon(isDark) {
    if (!icon) return;
    icon.className = isDark ? 'fa-solid fa-sun text-amber-400 text-sm' : 'fa-solid fa-moon text-slate-600 text-sm';
    if (toggle) toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  setIcon(document.documentElement.classList.contains('dark'));
  if (toggle) toggle.addEventListener('click', function () {
    var dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('portfolio_theme', dark ? 'dark' : 'light'); } catch (e) {}
    setIcon(dark);
  });

  // Mobile menu
  var btn = document.getElementById('mobile-menu-btn');
  var menu = document.getElementById('mobile-menu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('hidden', open);
      var i = btn.querySelector('i');
      if (i) i.className = open ? 'fa-solid fa-bars text-base' : 'fa-solid fa-xmark text-base';
    });
  }

  // Short fixed nav (same on every page) plus a Contact button
  var path = location.pathname;
  var current = /^\/projects/.test(path) ? 'Projects'
    : /^\/resume/.test(path) ? 'Resume'
    : /^\/coding/.test(path) ? 'Coding' : 'Blog';
  var NAV = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects.html' },
    { label: 'Resume', href: '/resume.html' },
    { label: 'Coding', href: '/coding.html' },
    { label: 'Blog', href: '/blog' }
  ];
  var desktop = document.getElementById('desktop-nav-links');
  var mobile = document.getElementById('mobile-nav-links');
  if (desktop && mobile) {
    NAV.forEach(function (it) {
      var cls = it.label === current ? ' text-cyan-500 dark:text-cyan-400' : '';
      var a = document.createElement('a');
      a.href = it.href; a.textContent = it.label;
      a.className = 'px-3 py-1.5 rounded-md hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all' + cls;
      desktop.appendChild(a);
      var m = document.createElement('a');
      m.href = it.href; m.textContent = it.label;
      m.className = 'px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors' + cls;
      mobile.appendChild(m);
    });
    var c1 = document.createElement('a');
    c1.href = '/#contact-section'; c1.textContent = 'Contact';
    c1.className = 'ml-2 px-4 py-1.5 rounded-lg text-white font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 shadow-md shadow-cyan-500/20 hover:opacity-95 transition-all';
    desktop.appendChild(c1);
    var c2 = document.createElement('a');
    c2.href = '/#contact-section'; c2.textContent = 'Contact';
    c2.className = 'mt-1 px-3 py-2 rounded-lg text-center text-white font-semibold bg-gradient-to-r from-cyan-500 to-teal-500';
    mobile.appendChild(c2);
  }

  fetch('/resume.json').then(function (r) { return r.json(); }).then(function (data) {
    var b = data.basics || {};
    var name = b.name;
    var brand = document.getElementById('nav-brand-text');
    if (brand && name) brand.textContent = name;

    var footer = document.getElementById('footer-container');
    if (!footer) return;
    var profiles = b.profiles || [];
    var social = profiles.map(function (p) {
      return '<a href="' + esc(fixUrl(p.url)) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(p.network || 'Social') + '" title="' + esc(p.network || '') +
        '" class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-300/50 dark:border-slate-700/60 hover:text-cyan-500 dark:hover:text-cyan-400 hover:border-cyan-500/60 hover:-translate-y-0.5 transition-all"><i class="' +
        esc(p.icon || 'fa-solid fa-link') + ' text-sm"></i></a>';
    }).join('');
    footer.innerHTML = '<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">' +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-8">' +
        '<div class="space-y-2"><p class="text-lg font-bold text-slate-900 dark:text-white">' + esc(name || 'Portfolio') + '</p>' +
          (b.label ? '<p class="text-sm text-slate-500 dark:text-slate-400">' + esc(b.label) + (b.location && b.location.region ? ' &middot; ' + esc(b.location.region) : '') + '</p>' : '') +
          (b.email ? '<a href="mailto:' + esc(b.email) + '" class="text-sm text-cyan-600 dark:text-cyan-400 hover:underline break-all">' + esc(b.email) + '</a>' : '') + '</div>' +
        '<div class="space-y-3"><p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Connect</p>' +
          '<div class="flex flex-wrap gap-2.5">' + social + '</div></div>' +
      '</div>' +
      '<div class="pt-6 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">&copy; ' + new Date().getFullYear() + ' ' + esc(name || 'Portfolio') + '. All rights reserved.</div></div>';
    footer.classList.remove('hidden');
  }).catch(function () { /* keep nav only */ });
})();
