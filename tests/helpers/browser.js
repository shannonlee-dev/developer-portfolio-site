import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

export function installBrowser() {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: 'https://portfolio.example/' });
  const { window } = dom;
  window.matchMedia = () => ({ matches: false });
  window.localStorage.setItem('portfolio-theme', 'dark');
  Object.assign(globalThis, {
    window,
    document: window.document,
    localStorage: window.localStorage,
    FormData: window.FormData,
  });
  return dom;
}
