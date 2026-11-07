/**
 * app.js - Personal Portfolio dynamic logic
 * Loads resume.json and renders content strictly without hardcoding.
 */

// Helper to escape HTML characters for security
function escapeHTML(str) {
  if (typeof str !== 'string') return str ?? '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to sanitize external URLs (e.g. handle typo like "https:/linkedin")
function sanitizeUrl(url) {
  if (!url) return '#';
  return url.replace(/^https?:\/(?!\/)/, 'https://');
}

// Manage Light / Dark Theme Mode
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');

  function updateIcon(isDark) {
    if (!themeToggleIcon) return;
    if (isDark) {
      themeToggleIcon.className = 'fa-solid fa-sun text-amber-400 text-sm';
      themeToggleBtn?.setAttribute('aria-label', 'Switch to light mode');
      themeToggleBtn?.setAttribute('title', 'Switch to light mode');
    } else {
      themeToggleIcon.className = 'fa-solid fa-moon text-slate-600 text-sm';
      themeToggleBtn?.setAttribute('aria-label', 'Switch to dark mode');
      themeToggleBtn?.setAttribute('title', 'Switch to dark mode');
    }
  }

  const isDark = document.documentElement.classList.contains('dark');
  updateIcon(isDark);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const willBeDark = !document.documentElement.classList.contains('dark');
      if (willBeDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('portfolio_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('portfolio_theme', 'light');
      }
      updateIcon(willBeDark);
    });
  }
}

// Mobile Menu Handler
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!mobileMenuBtn || !mobileMenu) return;

  mobileMenuBtn.addEventListener('click', () => {
    const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
    mobileMenu.classList.toggle('hidden');
    
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
      if (isExpanded) {
        icon.className = 'fa-solid fa-bars text-base';
      } else {
        icon.className = 'fa-solid fa-xmark text-base';
      }
    }
  });

  // Close menu when a link is clicked
  mobileMenu.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      mobileMenu.classList.add('hidden');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-bars text-base';
    }
  });
}

// Print Handler
function initPrintButtons() {
  const printBtns = document.querySelectorAll('#nav-print-btn, .print-btn-trigger');
  printBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      window.print();
    });
  });
}

// Render dynamic navigation links
function renderNavigation(activeNavItems) {
  const desktopNavContainer = document.getElementById('desktop-nav-links');
  const mobileNavContainer = document.getElementById('mobile-nav-links');

  if (!desktopNavContainer || !mobileNavContainer) return;

  desktopNavContainer.innerHTML = '';
  mobileNavContainer.innerHTML = '';

  activeNavItems.forEach(item => {
    // Desktop link
    const desktopLink = document.createElement('a');
    desktopLink.href = item.href;
    desktopLink.className = 'px-3 py-1.5 rounded-md hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all';
    desktopLink.textContent = item.label;
    desktopNavContainer.appendChild(desktopLink);

    // Mobile link
    const mobileLink = document.createElement('a');
    mobileLink.href = item.href;
    mobileLink.className = 'px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors';
    mobileLink.textContent = item.label;
    mobileNavContainer.appendChild(mobileLink);
  });
}

// Main Portfolio Rendering Function
function renderPortfolio(data) {
  const activeNavItems = [];

  // Update Page Title and Nav Brand if basics exist
  if (data.basics && data.basics.name) {
    document.title = `${data.basics.name} | Portfolio`;
    const brandText = document.getElementById('nav-brand-text');
    if (brandText) brandText.textContent = data.basics.name;
  }

  // 1. Hero Section
  const heroSection = document.getElementById('hero-section');
  if (data.basics && (data.basics.name || data.basics.headline || data.basics.label)) {
    const { name, label, headline, location, availability, profiles, email } = data.basics;

    let locationHtml = '';
    if (location) {
      const locationParts = [location.region, location.country].filter(Boolean);
      if (locationParts.length > 0) {
        locationHtml = `
          <div class="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800/60 px-3 py-1 rounded-full border border-slate-300/40 dark:border-slate-700/50">
            <i class="fa-solid fa-location-dot text-cyan-500 text-xs"></i>
            <span>${escapeHTML(locationParts.join(', '))}</span>
          </div>
        `;
      }
    }

    let availabilityHtml = '';
    if (availability) {
      availabilityHtml = `
        <div class="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <span class="w-2 h-2 rounded-full bg-emerald-500 status-dot-pulse"></span>
          <span>${escapeHTML(availability)}</span>
        </div>
      `;
    }

    let profilesHtml = '';
    if (Array.isArray(profiles) && profiles.length > 0) {
      profilesHtml = profiles.map(p => `
        <a href="${sanitizeUrl(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(p.network || 'Profile')}" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium glass-panel interactive-card hover:border-cyan-500/60 transition-all">
          <i class="${escapeHTML(p.icon || 'fa-solid fa-arrow-up-right-from-square')} text-cyan-500 text-base"></i>
          <span>${escapeHTML(p.network || p.username || 'Link')}</span>
        </a>
      `).join('');
    }

    let contactBtnHtml = '';
    if (email) {
      contactBtnHtml = `
        <a href="#contact-section" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:opacity-95 transition-all">
          <i class="fa-regular fa-envelope"></i>
          <span>Contact Me</span>
        </a>
      `;
    }

    heroSection.innerHTML = `
      <div class="flex flex-col gap-6 max-w-3xl">
        <div class="flex flex-wrap items-center gap-3">
          ${availabilityHtml}
          ${locationHtml}
        </div>

        <div class="space-y-3">
          ${label ? `<p class="text-sm font-semibold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">${escapeHTML(label)}</p>` : ''}
          ${name ? `<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">${escapeHTML(name)}</h1>` : ''}
        </div>

        ${headline ? `<p class="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">${escapeHTML(headline)}</p>` : ''}

        <div class="hero-action-buttons flex flex-wrap items-center gap-3 pt-2">
          ${contactBtnHtml}
          ${profilesHtml}
        </div>
      </div>
    `;
    heroSection.classList.remove('hidden');
  }

  // 2. About Section
  const aboutSection = document.getElementById('about-section');
  const hasAboutData = data.about && (
    (Array.isArray(data.about.intro) && data.about.intro.length > 0) ||
    (Array.isArray(data.about.strengths) && data.about.strengths.length > 0)
  );
  const leadershipNote = data.basics?.leadershipNote || data.about?.leadershipNote;

  if (hasAboutData || leadershipNote) {
    let introHtml = '';
    if (data.about?.intro && Array.isArray(data.about.intro) && data.about.intro.length > 0) {
      introHtml = data.about.intro.map(p => `
        <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-base">${escapeHTML(p)}</p>
      `).join('');
    }

    let strengthsHtml = '';
    if (data.about?.strengths && Array.isArray(data.about.strengths) && data.about.strengths.length > 0) {
      strengthsHtml = `
        <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-2">
            <i class="fa-solid fa-bolt text-cyan-500 text-xs"></i>
            <span>Strengths & Focus</span>
          </h3>
          <ul class="space-y-2">
            ${data.about.strengths.map(s => `
              <li class="flex items-start gap-2.5 text-slate-600 dark:text-slate-300 text-sm">
                <i class="fa-solid fa-circle-check text-teal-500 mt-1 text-xs shrink-0"></i>
                <span>${escapeHTML(s)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    let leadershipHtml = '';
    if (leadershipNote) {
      leadershipHtml = `
        <div class="mt-6 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-slate-800/10 to-teal-500/10 border border-cyan-500/20 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed flex items-start gap-3.5">
          <i class="fa-solid fa-award text-cyan-500 text-lg mt-0.5 shrink-0"></i>
          <div>
            <span class="font-semibold text-slate-900 dark:text-white block mb-0.5">Leadership & Work Ethic</span>
            <p class="italic text-slate-600 dark:text-slate-300">${escapeHTML(leadershipNote)}</p>
          </div>
        </div>
      `;
    }

    aboutSection.innerHTML = `
      <div class="space-y-6">
        <div class="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span class="w-2.5 h-6 rounded-full bg-cyan-500 inline-block"></span>
            <span>About Me</span>
          </h2>
        </div>
        <div class="glass-panel p-6 sm:p-8 rounded-2xl interactive-card">
          <div class="space-y-4">
            ${introHtml}
          </div>
          ${strengthsHtml}
          ${leadershipHtml}
        </div>
      </div>
    `;
    aboutSection.classList.remove('hidden');
    activeNavItems.push({ label: 'About', href: '#about-section' });
  }

  // 3. Education Section
  const educationSection = document.getElementById('education-section');
  if (Array.isArray(data.education) && data.education.length > 0) {
    const educationItemsHtml = data.education.map(edu => {
      let datesStr = '';
      if (edu.startDate || edu.endDate) {
        datesStr = `${edu.startDate || ''} – ${edu.endDate || 'Present'}`;
      }

      let detailsHtml = '';
      if (Array.isArray(edu.details) && edu.details.length > 0) {
        const label = edu.detailsLabel ? `${escapeHTML(edu.detailsLabel)}:` : 'Details:';
        detailsHtml = `
          <div class="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">${label}</span>
            <div class="flex flex-wrap gap-2">
              ${edu.details.map(d => `
                <span class="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                  ${escapeHTML(d)}
                </span>
              `).join('')}
            </div>
          </div>
        `;
      }

      return `
        <div class="relative pl-8 sm:pl-10 timeline-item group">
          <div class="glass-panel p-5 sm:p-6 rounded-xl interactive-card">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-2">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                ${escapeHTML(edu.studyType ? `${edu.studyType} in ${edu.area || ''}` : (edu.area || 'Studies'))}
              </h3>
              ${datesStr ? `
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 w-fit">
                  ${escapeHTML(datesStr)}
                </span>
              ` : ''}
            </div>
            
            <p class="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <i class="fa-solid fa-building-columns text-xs text-slate-400"></i>
              <span>${escapeHTML(edu.institution)}</span>
            </p>

            ${detailsHtml}
          </div>
        </div>
      `;
    }).join('');

    educationSection.innerHTML = `
      <div class="space-y-6">
        <div class="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span class="w-2.5 h-6 rounded-full bg-cyan-500 inline-block"></span>
            <span>Education</span>
          </h2>
        </div>
        <div class="relative ml-4 sm:ml-6 pl-2 timeline-container border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
          ${educationItemsHtml}
        </div>
      </div>
    `;
    educationSection.classList.remove('hidden');
    activeNavItems.push({ label: 'Education', href: '#education-section' });
  }

  // 4. Skills Section
  const skillsSection = document.getElementById('skills-section');
  if (Array.isArray(data.skills) && data.skills.length > 0) {
    const skillCategoriesHtml = data.skills.map(skillGroup => `
      <div class="glass-panel p-5 sm:p-6 rounded-xl interactive-card space-y-4">
        ${skillGroup.category ? `
          <h3 class="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <i class="fa-solid fa-code text-cyan-500 text-sm"></i>
            <span>${escapeHTML(skillGroup.category)}</span>
          </h3>
        ` : ''}
        <div class="flex flex-wrap gap-2.5">
          ${(skillGroup.items || []).map(skillName => `
            <span class="skill-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              <span>${escapeHTML(skillName)}</span>
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');

    skillsSection.innerHTML = `
      <div class="space-y-6">
        <div class="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span class="w-2.5 h-6 rounded-full bg-cyan-500 inline-block"></span>
            <span>Skills</span>
          </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${skillCategoriesHtml}
        </div>
      </div>
    `;
    skillsSection.classList.remove('hidden');
    activeNavItems.push({ label: 'Skills', href: '#skills-section' });
  }

  // 5. Certificates Section
  const certificatesSection = document.getElementById('certificates-section');
  if (Array.isArray(data.certificates) && data.certificates.length > 0) {
    const certCardsHtml = data.certificates.map(cert => {
      let mediaOrLinkHtml = '';

      if (cert.image) {
        const imgTag = `
          <img src="${escapeHTML(cert.image)}" alt="Certificate: ${escapeHTML(cert.name)}" loading="lazy" class="w-full h-48 sm:h-56 object-cover object-center rounded-lg border border-slate-200/80 dark:border-slate-700/80 group-hover:scale-[1.02] transition-transform duration-300" />
        `;
        if (cert.url) {
          mediaOrLinkHtml = `
            <a href="${sanitizeUrl(cert.url)}" target="_blank" rel="noopener noreferrer" class="block relative overflow-hidden rounded-lg group" title="Open certificate PDF">
              ${imgTag}
              <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-sm backdrop-blur-xs">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                <span>View PDF</span>
              </div>
            </a>
          `;
        } else {
          mediaOrLinkHtml = `<div>${imgTag}</div>`;
        }
      } else if (cert.url) {
        mediaOrLinkHtml = `
          <a href="${sanitizeUrl(cert.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
            <span>View Certificate (PDF)</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
          </a>
        `;
      }

      return `
        <div class="certificate-card glass-panel p-5 rounded-xl interactive-card flex flex-col justify-between gap-4">
          <div class="space-y-3">
            ${mediaOrLinkHtml}
            <div>
              <h3 class="font-bold text-lg text-slate-900 dark:text-white leading-snug">${escapeHTML(cert.name)}</h3>
              ${cert.issuer ? `<p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5"><i class="fa-solid fa-stamp text-xs text-cyan-500"></i> ${escapeHTML(cert.issuer)}</p>` : ''}
            </div>
          </div>
          ${cert.url && cert.image ? `
            <div class="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end">
              <a href="${sanitizeUrl(cert.url)}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1.5">
                <span>Open Document</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </a>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    certificatesSection.innerHTML = `
      <div class="space-y-6">
        <div class="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span class="w-2.5 h-6 rounded-full bg-cyan-500 inline-block"></span>
            <span>Certificates</span>
          </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${certCardsHtml}
        </div>
      </div>
    `;
    certificatesSection.classList.remove('hidden');
    activeNavItems.push({ label: 'Certificates', href: '#certificates-section' });
  }

  // 6. Languages Section
  const languagesSection = document.getElementById('languages-section');
  if (Array.isArray(data.languages) && data.languages.length > 0) {
    const langCardsHtml = data.languages.map(lang => `
      <div class="glass-panel p-4 rounded-xl interactive-card flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <i class="fa-solid fa-language text-base"></i>
          </div>
          <span class="font-bold text-slate-900 dark:text-white text-base">${escapeHTML(lang.language)}</span>
        </div>
        ${lang.fluency ? `
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/50">
            ${escapeHTML(lang.fluency)}
          </span>
        ` : ''}
      </div>
    `).join('');

    languagesSection.innerHTML = `
      <div class="space-y-6">
        <div class="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span class="w-2.5 h-6 rounded-full bg-cyan-500 inline-block"></span>
            <span>Languages</span>
          </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          ${langCardsHtml}
        </div>
      </div>
    `;
    languagesSection.classList.remove('hidden');
    activeNavItems.push({ label: 'Languages', href: '#languages-section' });
  }

  // 7. Contact Section & Footer
  const contactSection = document.getElementById('contact-section');
  const footerContainer = document.getElementById('footer-container');
  const email = data.basics?.email;
  const profiles = data.basics?.profiles;

  if (email || (Array.isArray(profiles) && profiles.length > 0)) {
    let emailHtml = '';
    if (email) {
      emailHtml = `
        <a href="mailto:${escapeHTML(email)}" class="group flex items-center gap-4 p-5 rounded-xl glass-panel interactive-card hover:border-cyan-500/50">
          <div class="w-12 h-12 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-500 flex items-center justify-center transition-colors">
            <i class="fa-regular fa-envelope text-xl"></i>
          </div>
          <div class="overflow-hidden">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5">Email</span>
            <span class="text-sm sm:text-base font-medium text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors break-all">${escapeHTML(email)}</span>
          </div>
        </a>
      `;
    }

    let profilesCardHtml = '';
    if (Array.isArray(profiles) && profiles.length > 0) {
      profilesCardHtml = `
        <div class="p-5 rounded-xl glass-panel interactive-card space-y-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Social & Code</span>
          <div class="flex flex-wrap gap-2.5">
            ${profiles.map(p => `
              <a href="${sanitizeUrl(p.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 hover:text-cyan-500 transition-all">
                <i class="${escapeHTML(p.icon || 'fa-solid fa-arrow-up-right-from-square')} text-sm"></i>
                <span>${escapeHTML(p.network || p.username || 'Link')}</span>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    contactSection.innerHTML = `
      <div class="space-y-6">
        <div class="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span class="w-2.5 h-6 rounded-full bg-cyan-500 inline-block"></span>
            <span>Get in Touch</span>
          </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${emailHtml}
          ${profilesCardHtml}
        </div>
      </div>
    `;
    contactSection.classList.remove('hidden');
    activeNavItems.push({ label: 'Contact', href: '#contact-section' });
  }

  // Footer Rendering
  if (footerContainer) {
    const currentYear = new Date().getFullYear();
    const nameStr = data.basics?.name ? escapeHTML(data.basics.name) : 'Portfolio';

    let footerProfilesHtml = '';
    if (Array.isArray(profiles) && profiles.length > 0) {
      footerProfilesHtml = `
        <div class="flex items-center gap-3">
          ${profiles.map(p => `
            <a href="${sanitizeUrl(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(p.network || 'Social')}" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors">
              <i class="${escapeHTML(p.icon || 'fa-solid fa-link')} text-sm"></i>
            </a>
          `).join('')}
        </div>
      `;
    }

    footerContainer.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>&copy; ${currentYear} ${nameStr}. All rights reserved.</span>
        </div>

        <div class="flex items-center gap-4">
          ${footerProfilesHtml}
          <button type="button" class="print-btn-trigger inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/50 dark:border-slate-700 transition-colors" title="Print this resume">
            <i class="fa-solid fa-print"></i>
            <span>Print to PDF</span>
          </button>
        </div>
      </div>
    `;
    footerContainer.classList.remove('hidden');
  }

  // Blog link (added after the portfolio sections)
  activeNavItems.push({ label: 'Blog', href: '/blog' });

  // Render navigation links dynamically based on populated sections
  renderNavigation(activeNavItems);

  // Initialize print triggers
  initPrintButtons();
}

// Show error UI with instructions
function showError(message) {
  const loading = document.getElementById('loading-state');
  if (loading) loading.classList.add('hidden');

  const errorState = document.getElementById('error-state');
  const errorMsg = document.getElementById('error-message');
  if (errorState && errorMsg) {
    errorMsg.innerHTML = `
      ${escapeHTML(message)}<br/><br/>
      <strong>Tip for running locally:</strong> Browsers restrict <code>fetch()</code> requests when opening HTML files directly using <code>file:///</code>. Please run a local development server in this directory, for example:
      <pre class="mt-2 p-2.5 rounded bg-slate-900 text-cyan-300 text-xs overflow-x-auto">python -m http.server 8000</pre>
      or
      <pre class="mt-2 p-2.5 rounded bg-slate-900 text-cyan-300 text-xs overflow-x-auto">npx serve</pre>
    `;
    errorState.classList.remove('hidden');
  }
}

// Application Entry Point
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();

  fetch('resume.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} (${response.statusText})`);
      }
      return response.json();
    })
    .then(data => {
      const loading = document.getElementById('loading-state');
      if (loading) loading.classList.add('hidden');
      renderPortfolio(data);
    })
    .catch(err => {
      console.error('Error fetching resume.json:', err);
      showError(`Unable to load resume data: ${err.message}`);
    });
});
