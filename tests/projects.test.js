import assert from 'node:assert/strict';
import test from 'node:test';
import { installBrowser } from './helpers/browser.js';

const browser = installBrowser();
const { state } = await import('../src/state.js');
const { elements } = await import('../src/dom.js');
const { loadProjects, renderProjectCards } =
  await import('../src/features/projects.js');
const { siteConfig } = await import('../src/config.js');

test('repository descriptions stay literal text and unsafe links are omitted', () => {
  const description = '<img src=x onerror="alert(1)"><em>text</em>';
  renderProjectCards([
    {
      name: 'repo',
      description,
      language: 'JavaScript',
      stargazers_count: 0,
      html_url: 'javascript:alert(1)',
    },
  ]);
  assert.equal(elements.projectsGrid.querySelector('p').textContent, description);
  assert.equal(elements.projectsGrid.querySelector('img, em'), null);
  assert.equal(elements.projectsGrid.querySelector('[href]'), null);
});

test('loaded repositories sort, limit and filter through real buttons', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () =>
      Array.from({ length: 11 }, (_, i) => ({
        name: `repo-${i}`,
        description: null,
        language: i % 2 ? 'Python' : 'JavaScript',
        stargazers_count: i,
        html_url: `https://github.com/example/repo-${i}`,
      })),
  });
  await loadProjects();
  assert.equal(elements.projectsGrid.querySelectorAll('article').length, 9);
  assert.equal(elements.projectsGrid.querySelector('h3').textContent, 'repo-10');
  elements.filterBar.querySelector('[data-language="Python"]').click();
  assert.equal(state.activeLanguage, 'Python');
  assert.equal(elements.projectsGrid.querySelectorAll('article').length, 4);
  assert.match(
    elements.projectsGrid.querySelector('a').href,
    /^https:\/\/github.com\//,
  );
});

test('loading, empty and failed requests replace old cards and filters', async () => {
  let finish;
  globalThis.fetch = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const request = loadProjects();
  assert.match(elements.projectStatus.textContent, /로딩/);
  assert.equal(elements.projectsGrid.childElementCount, 0);
  finish({ ok: true, status: 200, json: async () => [] });
  await request;
  assert.match(elements.projectStatus.textContent, /없습니다/);
  globalThis.fetch = async () => ({ ok: false, status: 403 });
  await loadProjects();
  assert.match(elements.projectStatus.textContent, /403/);
  assert.equal(elements.filterBar.childElementCount, 0);
  assert.equal(elements.retryProjects.hidden, false);
  assert.equal(elements.projectsGrid.getAttribute('aria-busy'), 'false');
});

test('rapid retries share one pending request and release the lock afterward', async () => {
  let finish;
  let requests = 0;
  globalThis.fetch = () => {
    requests++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const first = loadProjects();
  await loadProjects();
  assert.equal(requests, 1);
  assert.equal(elements.projectsGrid.getAttribute('aria-busy'), 'true');
  finish({ ok: true, json: async () => [] });
  await first;
  globalThis.fetch = async () => ({ ok: true, json: async () => [] });
  await loadProjects();
  assert.equal(state.projectStatus, 'success');
  assert.equal(elements.retryProjects.hidden, true);
});

test('malformed API data becomes a recoverable error', async () => {
  for (const payload of [{ message: 'unexpected' }, [null], [{ name: 42 }]]) {
    globalThis.fetch = async () => ({ ok: true, json: async () => payload });
    await loadProjects();
    assert.equal(state.projectStatus, 'error');
    assert.equal(elements.projectsGrid.childElementCount, 0);
    assert.equal(elements.retryProjects.hidden, false);
  }
});

test('timed out requests abort and allow a fresh retry', async () => {
  const originalTimeout = siteConfig.requestTimeout;
  siteConfig.requestTimeout = 5;
  globalThis.fetch = (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')), {
        once: true,
      });
    });
  try {
    await loadProjects();
    assert.match(elements.projectStatus.textContent, /시간이 초과/);
    globalThis.fetch = async () => ({ ok: true, json: async () => [] });
    await loadProjects();
    assert.equal(state.projectStatus, 'success');
  } finally {
    siteConfig.requestTimeout = originalTimeout;
  }
});

test('repository names and language values cannot inject markup or link attributes', () => {
  renderProjectCards([
    {
      name: '\"><img src=x onerror=alert(1)>',
      description: 'A & B',
      language: '<script>alert(1)</script>',
      html_url: 'https://github.com/example/repo?x="&y=1',
    },
  ]);
  assert.equal(elements.projectsGrid.querySelector('img, script'), null);
  assert.equal(
    elements.projectsGrid.querySelector('h3').textContent,
    '\"><img src=x onerror=alert(1)>',
  );
  assert.equal(elements.projectsGrid.querySelector('p').textContent, 'A & B');
  assert.equal(elements.projectsGrid.querySelector('a').getAttribute('onerror'), null);
});

test.after(() => browser.window.close());
