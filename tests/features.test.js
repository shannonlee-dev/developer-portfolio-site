import assert from 'node:assert/strict';
import test from 'node:test';

function element() {
  const classes = new Set();
  return {
    dataset: {},
    textContent: '',
    innerHTML: '',
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value),
      contains: (value) => classes.has(value),
      toggle: (value, active) => {
        const enabled = active ?? !classes.has(value);
        if (enabled) classes.add(value);
        else classes.delete(value);
        return enabled;
      },
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    setAttribute: () => {},
    reset: () => {},
  };
}

const nodes = new Map();
const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
};
globalThis.window = {
  matchMedia: () => ({ matches: false }),
  scrollY: 0,
  scrollTo: () => {},
  addEventListener: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
};
globalThis.document = {
  documentElement: element(),
  querySelector: (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, element());
    return nodes.get(selector);
  },
  querySelectorAll: () => [],
};
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
};

const { state } = await import('../src/state.js');
const { elements } = await import('../src/dom.js');
const { loadProjects, getLanguages, getVisibleProjects } = await import(
  '../src/features/projects.js'
);
const { validateField, handleContactSubmit } = await import(
  '../src/features/contact.js'
);
const { toggleTheme } = await import('../src/features/theme.js');

test('프로젝트를 별 수로 정렬하고 최대 9개와 언어 필터를 유지한다', async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () =>
      Array.from({ length: 11 }, (_, i) => ({
        name: `project-${i}`,
        language: i % 2 ? 'Python' : 'JavaScript',
        stargazers_count: i,
        html_url: `https://example.com/project-${i}`,
      })),
  });
  await loadProjects();
  assert.equal(state.projectStatus, 'success');
  assert.equal(state.projects.length, 9);
  assert.equal(state.projects[0].stargazers_count, 10);
  assert.deepEqual(getLanguages(state.projects), ['All', 'JavaScript', 'Python']);
  state.activeLanguage = 'Python';
  assert.equal(getVisibleProjects().length, 4);
});

test('GitHub 제한 오류가 나면 이전 카드와 필터를 비운다', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 403 });
  await loadProjects();
  assert.equal(state.projectStatus, 'error');
  assert.match(elements.projectStatus.textContent, /403/);
  assert.equal(elements.projectsGrid.innerHTML, '');
  assert.equal(elements.filterBar.innerHTML, '');
});

test('문의 입력 오류는 외부 요청을 막고 정상 입력은 전송 후 초기화한다', async () => {
  assert.equal(validateField('name', ' '), '필수 입력 항목입니다.');
  assert.equal(
    validateField('email', 'invalid'),
    '올바른 이메일 형식을 입력해 주세요.',
  );
  let values = { name: '', email: 'invalid', message: '' };
  globalThis.FormData = class {
    entries() {
      return Object.entries(values);
    }
  };
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return { ok: true };
  };
  const event = { preventDefault() {} };
  await handleContactSubmit(event);
  assert.equal(requests, 0);
  values = { name: '사용자', email: 'user@example.com', message: '문의' };
  let resets = 0;
  elements.contactForm.reset = () => {
    resets += 1;
  };
  await handleContactSubmit(event);
  assert.equal(requests, 1);
  assert.equal(resets, 1);
  assert.equal(state.form.submitted, true);
  assert.equal(elements.formMessage.textContent, '전송되었습니다');
});

test('테마 전환은 DOM과 저장된 설정을 함께 갱신한다', () => {
  state.theme = 'light';
  toggleTheme();
  assert.equal(elements.root.dataset.theme, 'dark');
  assert.equal(stored.get('portfolio-theme'), 'dark');
  assert.equal(elements.themeLabel.textContent, '라이트 모드');
});

test('모듈 진입점이 모든 기능을 조립한다', async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => [] });
  await import('../src/main.js');
  assert.equal(elements.typingText.textContent, '');
  assert.equal(elements.root.dataset.theme, state.theme);
});
