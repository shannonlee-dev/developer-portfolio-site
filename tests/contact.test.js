import assert from 'node:assert/strict';
import test from 'node:test';
import { installBrowser } from './helpers/browser.js';

const browser = installBrowser();
const { elements } = await import('../src/dom.js');
const { state } = await import('../src/state.js');
const { handleContactSubmit, updateFormState } =
  await import('../src/features/contact.js');
const event = { preventDefault() {} };
const button = elements.contactForm.querySelector('[type="submit"]');
const { siteConfig } = await import('../src/config.js');
function fill(values = { name: '사용자', email: 'user@example.com', message: '문의' }) {
  for (const [name, value] of Object.entries(values)) {
    const field = elements.contactForm.elements.namedItem(name);
    field.value = value;
    updateFormState({ target: field });
  }
}

test('validation errors prevent requests and clear when the field is corrected', async () => {
  fill({ name: '', email: 'invalid', message: '' });
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return { ok: true };
  };
  await handleContactSubmit(event);
  assert.equal(requests, 0);
  assert.equal(document.activeElement.id, 'name');
  assert.equal(
    elements.contactForm.elements.namedItem('email').getAttribute('aria-invalid'),
    'true',
  );
  assert.match(
    document.querySelector('[data-error-for="email"]').textContent,
    /이메일/,
  );
  fill();
  assert.equal(document.querySelector('[data-error-for="email"]').textContent, '');
  assert.equal(
    elements.contactForm.elements.namedItem('email').getAttribute('aria-invalid'),
    'false',
  );
});

test('a pending send locks the submit button and ignores a second submission', async () => {
  fill();
  let requests = 0;
  const pending = [];
  globalThis.fetch = () => {
    requests++;
    return new Promise((resolve) => pending.push(resolve));
  };
  const first = handleContactSubmit(event);
  const second = handleContactSubmit(event);
  const requestCount = requests;
  const disabledDuringRequest = button.disabled;
  assert.equal(elements.contactForm.elements.namedItem('message').readOnly, true);
  pending.forEach((resolve) => resolve({ ok: true }));
  await Promise.all([first, second]);
  assert.equal(requestCount, 1);
  assert.equal(disabledDuringRequest, true);
  assert.equal(button.disabled, false);
  assert.equal(elements.contactForm.elements.namedItem('name').value, '');
  assert.equal(state.form.submitted, true);
  assert.equal(elements.contactForm.elements.namedItem('message').readOnly, false);
});

test('email whitespace is normalized before validation and sending', async () => {
  fill({ name: '  사용자  ', email: ' user@example.com ', message: '  문의  ' });
  globalThis.fetch = async (_url, { body }) => {
    assert.equal(body.get('email'), 'user@example.com');
    assert.equal(body.get('name'), '사용자');
    return { ok: true };
  };
  await handleContactSubmit(event);
  assert.equal(state.form.submitted, true);
});

test('timeout retains values and explains the unknown delivery outcome', async () => {
  fill();
  const originalTimeout = siteConfig.requestTimeout;
  siteConfig.requestTimeout = 5;
  globalThis.fetch = (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')), {
        once: true,
      });
    });
  try {
    await handleContactSubmit(event);
    assert.match(elements.formMessage.textContent, /결과를 확인하지 못/);
    assert.equal(elements.contactForm.elements.namedItem('message').value, '문의');
    assert.equal(button.disabled, false);
    assert.equal(elements.contactForm.getAttribute('aria-busy'), 'false');
  } finally {
    siteConfig.requestTimeout = originalTimeout;
  }
});

test('HTTP failure retains input, releases the lock and allows a successful retry', async () => {
  fill();
  globalThis.fetch = async () => ({ ok: false });
  await handleContactSubmit(event);
  assert.match(elements.formMessage.textContent, /실패/);
  assert.equal(elements.contactForm.elements.namedItem('message').value, '문의');
  assert.equal(button.disabled, false);
  let method;
  globalThis.fetch = async (_url, options) => {
    method = options.method;
    assert.equal(options.body.get('email'), 'user@example.com');
    return { ok: true };
  };
  await handleContactSubmit(event);
  assert.equal(method, 'POST');
  assert.equal(elements.contactForm.elements.namedItem('email').value, '');
  assert.match(elements.formMessage.textContent, /전송되었습니다/);
});

test('network rejection releases the lock without resetting the form', async () => {
  fill();
  globalThis.fetch = async () => {
    throw new Error('offline');
  };
  await handleContactSubmit(event);
  assert.match(elements.formMessage.textContent, /실패/);
  assert.equal(button.disabled, false);
  assert.equal(
    elements.contactForm.elements.namedItem('email').value,
    'user@example.com',
  );
});

test.after(() => browser.window.close());
