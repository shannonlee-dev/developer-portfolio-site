import { siteConfig } from '../config.js';
import { elements } from '../dom.js';
import { state } from '../state.js';

const fieldNames = ['name', 'email', 'message'];

export function validateField(name, value) {
  const text = value.trim();
  if (!text) return '필수 입력 항목입니다.';
  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return '올바른 이메일 형식을 입력해 주세요.';
  }
  const maximum = { name: 100, email: 254, message: 5000 }[name];
  return text.length > maximum ? `${maximum}자 이내로 입력해 주세요.` : '';
}

export function renderFormErrors() {
  fieldNames.forEach((name) => {
    const error = state.form.errors[name] || '';
    elements.contactForm.querySelector(`[data-error-for="${name}"]`).textContent =
      error;
    elements.contactForm.elements
      .namedItem(name)
      .setAttribute('aria-invalid', String(Boolean(error)));
  });
}

export function updateFormState(event) {
  const { name, value } = event.target;
  if (!fieldNames.includes(name) || state.form.submitting) return;
  state.form.values[name] = value;
  state.form.errors[name] = validateField(name, value);
  state.form.submitted = false;
  elements.formMessage.textContent = '';
  elements.formMessage.classList.remove('error');
  renderFormErrors();
}

function renderSubmission(message, hasError = false) {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle('error', hasError);
  elements.contactForm.setAttribute('aria-busy', String(state.form.submitting));
  const button = elements.contactForm.querySelector('[type="submit"]');
  button.disabled = state.form.submitting;
  button.textContent = state.form.submitting ? '전송 중…' : '메시지 보내기 ↗';
  // Keep submitted values stable until the request settles, without losing them on failure.
  fieldNames.forEach((name) => {
    elements.contactForm.elements.namedItem(name).readOnly = state.form.submitting;
  });
}

export async function handleContactSubmit(event) {
  event.preventDefault();
  if (state.form.submitting) return;

  const data = new FormData(elements.contactForm);
  state.form.values = Object.fromEntries(
    fieldNames.map((name) => [name, String(data.get(name) || '').trim()]),
  );
  state.form.errors = Object.fromEntries(
    fieldNames.map((name) => [name, validateField(name, state.form.values[name])]),
  );
  state.form.submitted = false;
  renderFormErrors();

  const invalidField = fieldNames.find((name) => state.form.errors[name]);
  if (invalidField) {
    renderSubmission('입력값을 다시 확인해 주세요.', true);
    elements.contactForm.elements.namedItem(invalidField).focus();
    return;
  }

  fieldNames.forEach((name) => data.set(name, state.form.values[name]));
  state.form.submitting = true;
  renderSubmission('메시지를 전송하고 있습니다.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), siteConfig.requestTimeout);
  let message;
  let hasError = false;

  try {
    const response = await fetch(siteConfig.formspreeEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Form submission failed');
    state.form.submitted = true;
    message = '메시지가 전송되었습니다. 이야기 나눠 주셔서 감사합니다.';
    elements.contactForm.reset();
    state.form.values = { name: '', email: '', message: '' };
    state.form.errors = {};
    renderFormErrors();
  } catch {
    hasError = true;
    message = controller.signal.aborted
      ? '전송 결과를 확인하지 못했습니다. 입력 내용은 보관되어 있습니다. 다시 보내면 중복 전달될 수 있습니다.'
      : '전송에 실패했습니다. 입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.';
  } finally {
    clearTimeout(timeout);
    state.form.submitting = false;
    renderSubmission(message, hasError);
  }
}
