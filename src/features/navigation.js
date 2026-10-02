import { siteConfig } from '../config.js';
import { elements } from '../dom.js';
import { state } from '../state.js';

export function toggleMobileMenu() {
  elements.navMenu.classList.toggle('active');
  elements.hamburger.classList.toggle('active');
  const isExpanded = elements.hamburger.classList.contains('active');
  elements.hamburger.setAttribute('aria-expanded', String(isExpanded));
}

export function closeMobileMenu() {
  elements.navMenu.classList.remove('active');
  elements.hamburger.classList.remove('active');
  elements.hamburger.setAttribute('aria-expanded', 'false');
}

export function handleNavClick(event) {
  event.preventDefault();
  const targetId = event.currentTarget.getAttribute('href');
  const target = document.querySelector(targetId);

  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  closeMobileMenu();
}

export function handleScroll() {
  const isPastTopThreshold = window.scrollY >= siteConfig.scrollTopThreshold;
  const isPastNavThreshold = window.scrollY >= siteConfig.navScrollThreshold;

  elements.scrollTop.classList.toggle('active', isPastTopThreshold);
  elements.header.classList.toggle('scrolled', isPastNavThreshold);
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
