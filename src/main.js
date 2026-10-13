import { elements } from './dom.js';
import { renderTheme, toggleTheme, followSystemTheme } from './features/theme.js';
import {
  toggleMobileMenu,
  closeMobileMenu,
  dismissMobileMenu,
  handleNavClick,
  handleScroll,
  scrollToTop,
} from './features/navigation.js';
import { loadProjects } from './features/projects.js';
import { updateFormState, handleContactSubmit } from './features/contact.js';
import { observeSections } from './features/effects.js';

function bindEvents() {
  elements.hamburger.addEventListener('click', toggleMobileMenu);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.scrollTop.addEventListener('click', scrollToTop);
  elements.retryProjects.addEventListener('click', loadProjects);
  document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((link) => {
    link.addEventListener('click', handleNavClick);
  });
  document.addEventListener('keydown', dismissMobileMenu);
  document.addEventListener('click', dismissMobileMenu);
  elements.header.addEventListener('focusout', (event) => {
    if (!elements.header.contains(event.relatedTarget)) closeMobileMenu();
  });
  window.matchMedia('(min-width: 768px)').addEventListener?.('change', closeMobileMenu);
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener?.('change', followSystemTheme);
  elements.contactForm.addEventListener('submit', handleContactSubmit);
  elements.contactForm.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('input', updateFormState);
  });
  window.addEventListener('scroll', handleScroll, { passive: true });
}

renderTheme();
bindEvents();
observeSections();
handleScroll();
void loadProjects();
