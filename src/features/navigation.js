import { siteConfig } from '../config.js';
import { elements } from '../dom.js';
import { state } from '../state.js';

const scrollBehavior = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';

export function renderMobileMenu() {
  elements.navMenu.classList.toggle('active', state.menuOpen);
  elements.hamburger.classList.toggle('active', state.menuOpen);
  elements.hamburger.setAttribute('aria-expanded', String(state.menuOpen));
  elements.hamburger.setAttribute(
    'aria-label',
    state.menuOpen ? '메뉴 닫기' : '메뉴 열기',
  );
}

export function toggleMobileMenu() {
  state.menuOpen = !state.menuOpen;
  renderMobileMenu();
  if (state.menuOpen) elements.navLinks[0]?.focus();
}

export function closeMobileMenu() {
  state.menuOpen = false;
  renderMobileMenu();
}

export function dismissMobileMenu(event) {
  if (!state.menuOpen) return;
  if (event.type === 'keydown') {
    if (event.key !== 'Escape') return;
    closeMobileMenu();
    elements.hamburger.focus();
  } else if (!elements.header.contains(event.target)) {
    closeMobileMenu();
  }
}

export function handleNavClick(event) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const id = event.currentTarget.getAttribute('href').slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  closeMobileMenu();
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
}

export function handleScroll() {
  const showTop = window.scrollY >= siteConfig.scrollTopThreshold;
  elements.scrollTop.hidden = !showTop;
  elements.scrollTop.classList.toggle('active', showTop);
  elements.header.classList.toggle(
    'scrolled',
    window.scrollY >= siteConfig.navScrollThreshold,
  );
}

export function scrollToTop() {
  document.querySelector('.logo').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
}
