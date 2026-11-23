// Coding page: LeetCode stats come live from /api/leetcode (Vercel function);
// HackerRank details come from /coding.json (HackerRank has no public API).
(function () {
  var lc = document.getElementById('leetcode');
  var hr = document.getElementById('hackerrank');
  if (!lc || !hr) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u : '#'; }
  function h2(icon, text, url) {
    return '<div class="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">' +
      '<h2 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><i class="' + icon + ' text-cyan-500"></i>' + esc(text) + '</h2>' +
      (url ? '<a href="' + esc(safeUrl(url)) + '" target="_blank" rel="noopener noreferrer" class="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1.5">View profile <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>' : '') +
      '</div>';
  }
  function stat(label, value, color) {
    return '<div class="glass-panel rounded-xl p-4 text-center"><div class="text-3xl font-extrabold ' + color + '">' + value + '</div>' +
      '<div class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">' + label + '</div></div>';
  }
  function ago(ts) {
    var d = Math.floor((Date.now() / 1000 - ts) / 86400);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago';
  }

  // Heatmap: last 26 weeks, one cell per day
  function heatmap(cal) {
    var perDay = {};
    Object.keys(cal || {}).forEach(function (k) {
      var key = new Date(Number(k) * 1000).toISOString().slice(0, 10);
      perDay[key] = (perDay[key] || 0) + Number(cal[k]);
    });
    var end = new Date(); end.setUTCHours(0, 0, 0, 0);
    var start = new Date(end); start.setUTCDate(start.getUTCDate() - (26 * 7 - 1) - start.getUTCDay());
    var cols = '', total = 0;
    for (var d = new Date(start); d <= end;) {
      var col = '';
      for (var i = 0; i < 7 && d <= end; i++, d.setUTCDate(d.getUTCDate() + 1)) {
        var key = d.toISOString().slice(0, 10), n = perDay[key] || 0; total += n;
        var shade = n === 0 ? 'bg-slate-200 dark:bg-slate-800' : n < 3 ? 'bg-cyan-500/40' : n < 6 ? 'bg-cyan-500/70' : 'bg-cyan-500';
        col += '<span title="' + n + ' submissions on ' + key + '" class="block w-3 h-3 rounded-sm ' + shade + '"></span>';
      }
      cols += '<div class="flex flex-col gap-1">' + col + '</div>';
    }
    return '<div class="glass-panel rounded-xl p-5"><div class="text-sm text-slate-600 dark:text-slate-300 mb-3"><strong>' + total +
      '</strong> submissions in the last 6 months</div><div class="flex gap-1 overflow-x-auto pb-1">' + cols + '</div></div>';
  }

  fetch('/api/leetcode').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (d) {
    var recent = (d.recent || []).map(function (s) {
      return '<li><a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors">' +
        '<span class="flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-100"><i class="fa-solid fa-circle-check text-emerald-500 text-xs"></i>' + esc(s.title) + '</span>' +
        '<span class="text-xs text-slate-500 dark:text-slate-400 shrink-0">' + ago(s.timestamp) + '</span></a></li>';
    }).join('');
    lc.innerHTML = h2('fa-solid fa-code', 'LeetCode', d.url) +
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">' +
      stat('Solved', d.solved.all, 'text-slate-900 dark:text-white') +
      stat('Easy', d.solved.easy, 'text-emerald-500') +
      stat('Medium', d.solved.medium, 'text-amber-500') +
      stat('Hard', d.solved.hard, 'text-rose-500') + '</div>' +
      '<div class="mt-5">' + heatmap(d.calendar) + '</div>' +
      '<div class="mt-5 glass-panel rounded-xl overflow-hidden"><div class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">Recently solved</div>' +
      (recent ? '<ul class="divide-y divide-slate-200 dark:divide-slate-800">' + recent + '</ul>' : '<p class="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">No problems solved yet. They will show up here automatically.</p>') + '</div>';
  }).catch(function () {
    lc.innerHTML = h2('fa-solid fa-code', 'LeetCode', 'https://leetcode.com/u/EBKXsMPuAm/') +
      '<p class="text-sm text-slate-500 dark:text-slate-400">Live stats are unavailable right now. Please check the profile directly.</p>';
  });

  fetch('/coding.json').then(function (r) { return r.json(); }).then(function (c) {
    var h = c.hackerrank; if (!h) return;
    var badges = (h.badges || []).map(function (b) {
      return '<span class="text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"><i class="fa-solid fa-star text-amber-400 text-xs mr-1.5"></i>' +
        esc(b.name) + (b.stars ? ' &middot; ' + esc(b.stars) + ' star' + (b.stars > 1 ? 's' : '') : '') + '</span>';
    }).join('');
    hr.innerHTML = h2('fa-brands fa-hackerrank', 'HackerRank', h.url) +
      '<div class="glass-panel rounded-xl p-5 space-y-4"><p class="text-sm text-slate-600 dark:text-slate-300">Profile: <strong>' + esc(h.username) + '</strong></p>' +
      (badges ? '<div class="flex flex-wrap gap-2.5">' + badges + '</div>' : '<p class="text-sm text-slate-500 dark:text-slate-400">Badges and certificates will appear here.</p>') +
      '<a href="' + esc(safeUrl(h.url)) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-95 transition-all">Open HackerRank profile <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i></a></div>';
  }).catch(function () {});
})();
