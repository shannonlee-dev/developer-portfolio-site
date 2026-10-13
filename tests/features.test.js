import assert from 'node:assert/strict';
import test from 'node:test';
import { installBrowser } from './helpers/browser.js';

const browser = installBrowser();
const { elements } = await import('../src/dom.js');
const observed = [];
globalThis.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe(target) {
    observed.push(target);
    this.callback([{ target, isIntersecting: true }]);
  }
  unobserve() {}
};
window.setInterval = () => 1;
window.clearInterval = () => {};
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => [] });
await import('../src/main.js');

test('entrypoint restores theme and connects the real theme button', () => {
  assert.equal(document.documentElement.dataset.theme, 'dark');
  elements.themeToggle.click();
  assert.equal(document.documentElement.dataset.theme, 'light');
  assert.equal(localStorage.getItem('portfolio-theme'), 'light');
});

test('menu and navigation clicks update expanded state and scroll to real anchors', () => {
  let target;
  document.getElementById('about').scrollIntoView = () => {
    target = 'about';
  };
  elements.hamburger.click();
  assert.equal(elements.hamburger.getAttribute('aria-expanded'), 'true');
  assert.equal(document.activeElement, elements.navLinks[0]);
  assert.equal(elements.navMenu.classList.contains('active'), true);
  document.querySelector('.nav-link[href="#about"]').click();
  assert.equal(target, 'about');
  assert.equal(elements.hamburger.getAttribute('aria-expanded'), 'false');
  assert.equal(elements.navMenu.classList.contains('active'), false);
});

test('Escape closes the mobile menu and returns keyboard focus', () => {
  elements.hamburger.click();
  elements.navLinks[0].focus();
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(elements.hamburger.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, elements.hamburger);
});

test('theme still changes when local storage is blocked', async () => {
  const storage = globalThis.localStorage;
  const { getInitialTheme } = await import('../src/theme-preference.js');
  globalThis.localStorage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  try {
    assert.equal(getInitialTheme(), 'light');
    const before = document.documentElement.dataset.theme;
    elements.themeToggle.click();
    assert.notEqual(document.documentElement.dataset.theme, before);
    assert.equal(
      elements.themeToggle.getAttribute('aria-pressed'),
      String(before === 'light'),
    );
  } finally {
    globalThis.localStorage = storage;
  }
});

test('invalid saved themes fall back to system preference', async () => {
  const { getInitialTheme } = await import('../src/theme-preference.js');
  const saved = localStorage.getItem('portfolio-theme');
  localStorage.setItem('portfolio-theme', 'broken');
  assert.equal(getInitialTheme(), 'light');
  localStorage.setItem('portfolio-theme', saved);
});

test('scroll and intersection events reveal sections and connect the top button', () => {
  assert.equal(observed.length, document.querySelectorAll('.reveal').length);
  assert.ok(observed.every((target) => target.classList.contains('visible')));
  window.scrollY = 400;
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(elements.scrollTop.classList.contains('active'), true);
  assert.equal(elements.header.classList.contains('scrolled'), true);
  let options;
  window.scrollTo = (value) => {
    options = value;
  };
  elements.scrollTop.click();
  assert.deepEqual(options, { top: 0, behavior: 'smooth' });
});

test.after(() => browser.window.close());
