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
  assert.equal(elements.navMenu.classList.contains('active'), true);
  document.querySelector('.nav-link[href="#about"]').click();
  assert.equal(target, 'about');
  assert.equal(elements.hamburger.getAttribute('aria-expanded'), 'false');
  assert.equal(elements.navMenu.classList.contains('active'), false);
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
