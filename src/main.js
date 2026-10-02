import { elements } from './dom.js';
import { renderTheme, toggleTheme } from './features/theme.js';
import {
  toggleMobileMenu,
  handleNavClick,
  handleScroll,
  scrollToTop,
} from './features/navigation.js';
import { loadProjects } from './features/projects.js';
import { updateFormState, handleContactSubmit } from './features/contact.js';
import { observeSections, runTypingEffect } from './features/effects.js';

function bindEvents() {
  elements.hamburger.addEventListener('click', toggleMobileMenu);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.scrollTop.addEventListener('click', scrollToTop);
  elements.retryProjects.addEventListener('click', loadProjects);
  elements.navLinks.forEach((link) => link.addEventListener('click', handleNavClick));
  elements.contactForm.addEventListener('submit', handleContactSubmit);
  elements.contactForm.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('input', updateFormState);
  });
  window.addEventListener('scroll', handleScroll);
}

function init() {
  renderTheme();
  bindEvents();
  observeSections();
  runTypingEffect();
  handleScroll();
  loadProjects();
}

init();
