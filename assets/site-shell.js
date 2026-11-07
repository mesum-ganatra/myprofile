// Shared header/footer behaviour for the public blog pages: theme toggle,
// mobile menu, nav links and footer built from resume.json (same data as the main site).
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

  var desktop = document.getElementById('desktop-nav-links');
  var mobile = document.getElementById('mobile-nav-links');
  function renderNav(items) {
    if (!desktop || !mobile) return;
    desktop.innerHTML = ''; mobile.innerHTML = '';
    items.forEach(function (it) {
      var cls = it.active ? ' text-cyan-500 dark:text-cyan-400' : '';
      var a = document.createElement('a');
      a.href = it.href; a.textContent = it.label;
      a.className = 'px-3 py-1.5 rounded-md hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all' + cls;
      desktop.appendChild(a);
      var m = document.createElement('a');
      m.href = it.href; m.textContent = it.label;
      m.className = 'px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors' + cls;
      mobile.appendChild(m);
    });
  }
  // Minimal nav until resume.json loads (or if it fails)
  renderNav([{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog', active: true }]);

  fetch('/resume.json').then(function (r) { return r.json(); }).then(function (data) {
    var nonEmpty = function (v) { return Array.isArray(v) ? v.length > 0 : !!v; };
    var items = [{ label: 'Home', href: '/' }];
    if (data.about && Object.keys(data.about).length) items.push({ label: 'About', href: '/#about-section' });
    if (nonEmpty(data.education)) items.push({ label: 'Education', href: '/#education-section' });
    if (nonEmpty(data.skills)) items.push({ label: 'Skills', href: '/#skills-section' });
    if (nonEmpty(data.certificates)) items.push({ label: 'Certificates', href: '/#certificates-section' });
    if (nonEmpty(data.languages)) items.push({ label: 'Languages', href: '/#languages-section' });
    if (data.basics && (data.basics.email || nonEmpty(data.basics.profiles))) items.push({ label: 'Contact', href: '/#contact-section' });
    items.push({ label: 'Blog', href: '/blog', active: true });
    renderNav(items);

    var name = data.basics && data.basics.name;
    var brand = document.getElementById('nav-brand-text');
    if (brand && name) brand.textContent = name;

    var footer = document.getElementById('footer-container');
    if (footer) {
      var profiles = (data.basics && data.basics.profiles) || [];
      var social = profiles.map(function (p) {
        return '<a href="' + esc(fixUrl(p.url)) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(p.network || 'Social') +
          '" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors"><i class="' +
          esc(p.icon || 'fa-solid fa-link') + ' text-sm"></i></a>';
      }).join('');
      footer.innerHTML = '<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">' +
        '<div class="text-sm text-slate-500 dark:text-slate-400">&copy; ' + new Date().getFullYear() + ' ' + esc(name || 'Portfolio') + '. All rights reserved.</div>' +
        '<div class="flex items-center gap-3">' + social + '</div></div>';
      footer.classList.remove('hidden');
    }
  }).catch(function () { /* keep minimal nav */ });
})();
