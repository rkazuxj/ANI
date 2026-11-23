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
const motionButton = document.querySelector('.motion-control');
const counters = new Map([...document.querySelectorAll('[data-counter]')].map(node => [node, node.textContent.trim()]));
const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const frames = new Map();
let motionObserver;
let selectedMotion;
try {
  selectedMotion = sessionStorage.getItem('ani-motion');
} catch { /* A página também funciona quando o armazenamento está bloqueado. */ }

function animateCounter(counter) {
  const label = counters.get(counter);
  const isCurrency = counter.dataset.counter === 'brl';
  // Em reais, a contagem usa centavos inteiros.
  const target = Number(isCurrency ? label.replace(/\D/g, '') : label);
  const minDigits = label.startsWith('0') ? label.length : 1;
  const start = performance.now();

  function update(now) {
    const progress = Math.max(0, Math.min((now - start) / 1800, 1));
    if (progress >= 1) {
      counter.textContent = label;
      frames.delete(counter);
      return;
    }
    const value = Math.floor(target * (1 - (1 - progress) ** 2));
    counter.textContent = isCurrency ? reais.format(value / 100) : String(value).padStart(minDigits, '0');
    frames.set(counter, requestAnimationFrame(update));
  }
  update(start);
}

function syncMotion() {
  const enabled = selectedMotion ? selectedMotion === 'on' : !motionPreference.matches;
  const root = document.documentElement;
  root.classList.toggle('motion-on', enabled);
  root.classList.toggle('motion-off', !enabled);
  if (motionButton) {
    motionButton.hidden = false;
    motionButton.setAttribute('aria-pressed', String(enabled));
  }
  motionObserver?.disconnect();
  for (const frame of frames.values()) cancelAnimationFrame(frame);
  frames.clear();
  for (const [counter, label] of counters) counter.textContent = label;
  document.querySelectorAll('.in-view').forEach(node => node.classList.remove('in-view'));
  if (!enabled || !('IntersectionObserver' in window)) return;

  motionObserver = new IntersectionObserver((entries, observer) => {
    if (observer !== motionObserver || !root.classList.contains('motion-on')) return;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (counters.has(entry.target)) animateCounter(entry.target);
      else entry.target.classList.add('in-view');
    }
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-counter], .service-card, .client-diagram, .contact-grid')
    .forEach(element => motionObserver.observe(element));
}

motionButton?.addEventListener('click', () => {
  selectedMotion = motionButton.getAttribute('aria-pressed') === 'true' ? 'off' : 'on';
  try { sessionStorage.setItem('ani-motion', selectedMotion); } catch { /* Preferência válida nesta página. */ }
  syncMotion();
});
motionPreference.addEventListener('change', () => { if (!selectedMotion) syncMotion(); });
syncMotion();
