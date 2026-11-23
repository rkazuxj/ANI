const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#nav');
const narrowScreen = window.matchMedia('(max-width: 720px)');

function syncMenu(expanded = false) {
  menu.hidden = !narrowScreen.matches;
  menu.setAttribute('aria-expanded', String(expanded));
  navigation.hidden = narrowScreen.matches && !expanded;
}
menu.addEventListener('click', () => syncMenu(menu.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) syncMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    syncMenu();
    menu.focus();
  }
});
narrowScreen.addEventListener('change', () => syncMenu());
syncMenu();

const caseNavigation = document.querySelector('.case-layout aside nav');
const sectionLinks = [...(caseNavigation || navigation).querySelectorAll('a[href^="#"]')];
const sections = sectionLinks.map(link => document.getElementById(link.hash.slice(1)));

function highlightSection() {
  const headerHeight = document.querySelector('.main-header').offsetHeight;
  let active = 0;
  for (let index = 0; index < sections.length; index++) {
    if (sections[index].getBoundingClientRect().top <= headerHeight + 65) active = index;
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) {
    active = sections.length - 1;
  }
  sectionLinks.forEach((link, index) => {
    if (index === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
let scheduled = false;
function scheduleHighlight() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    highlightSection();
    scheduled = false;
  });
}
window.addEventListener('scroll', scheduleHighlight, { passive: true });
window.addEventListener('resize', scheduleHighlight);
window.addEventListener('pageshow', scheduleHighlight);
scheduleHighlight();

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

function animateCounter(counter) {
  const label = counter.textContent.trim();
  const target = Number(label);
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / 950, 1);
    if (progress >= 1 || motionPreference.matches) {
      counter.textContent = label;
      return;
    }
    const value = Math.floor(target * (1 - (1 - progress) ** 2));
    counter.textContent = String(value).padStart(label.length, '0');
    requestAnimationFrame(update);
  }
  update(start);
}

if ('IntersectionObserver' in window && !motionPreference.matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (motionPreference.matches) continue;
      if (entry.target.matches('[data-counter]')) animateCounter(entry.target);
      else entry.target.classList.add('signal-active');
    }
  }, { threshold: 0.25 });

  document.querySelectorAll('[data-counter], .client-diagram').forEach(element => observer.observe(element));
}
