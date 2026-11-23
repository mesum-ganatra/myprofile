// Small visual effects shared by every page: scroll progress bar, soft cursor glow,
// and a "scrolled" state for the floating header. Nothing here is required for the site to work.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var header = document.querySelector('header.glass-nav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0) + '%';
      if (header) header.classList.toggle('scrolled', h.scrollTop > 12);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!reduce && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    var glow = document.createElement('div');
    glow.id = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    window.addEventListener('pointermove', function (e) {
      glow.style.opacity = '1';
      glow.style.transform = 'translate(' + (e.clientX - 210) + 'px,' + (e.clientY - 210) + 'px)';
    }, { passive: true });
    document.addEventListener('pointerleave', function () { glow.style.opacity = '0'; });
  }

  // Phone navigation: a second row of links inside the floating header pill, plus a Contact button
  (function () {
    var path = location.pathname;
    var tabs = [['Home', '/'], ['Projects', '/projects.html'], ['Resume', '/resume.html'], ['Coding', '/coding.html'], ['Blog', '/blog']];
    function isCurrent(href) {
      if (href === '/') return path === '/' || path === '/index.html';
      return path.indexOf(href.replace('.html', '')) === 0;
    }
    if (header) {
      var row = document.createElement('nav');
      row.className = 'nav-row';
      row.setAttribute('aria-label', 'Main navigation');
      row.innerHTML = tabs.map(function (t) {
        return '<a href="' + t[1] + '"' + (isCurrent(t[1]) ? ' class="current" aria-current="page"' : '') + '>' + t[0] + '</a>';
      }).join('');
      header.appendChild(row);
    }
    var toggle = document.getElementById('theme-toggle');
    if (toggle && toggle.parentNode) {
      var c = document.createElement('a');
      c.href = '/#contact-section';
      c.className = 'header-contact';
      c.textContent = 'Contact';
      toggle.parentNode.insertBefore(c, toggle);
    }
  })();
})();
