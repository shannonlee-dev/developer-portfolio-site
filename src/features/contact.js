import { siteConfig } from '../config.js';
import { elements } from '../dom.js';
import { state } from '../state.js';

export function validateField(name, value) {
  if (!value.trim()) {
    return '필수 입력 항목입니다.';
  }

  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return '올바른 이메일 형식을 입력해 주세요.';
  }

  return '';
}

export function renderFormErrors() {
  Object.entries(state.form.errors).forEach(([field, message]) => {
    const errorTarget = document.querySelector(`[data-error-for="${field}"]`);
    if (errorTarget) {
      errorTarget.textContent = message;
    }
  });
}

export function updateFormState(event) {
  const { name, value } = event.target;
  state.form.values[name] = value;
  state.form.errors[name] = validateField(name, value);
  state.form.submitted = false;
  elements.formMessage.textContent = '';
  renderFormErrors();
}

export async function handleContactSubmit(event) {
  event.preventDefault();
  if (state.form.submitting) return;

  const formData = new FormData(elements.contactForm);
  state.form.values = Object.fromEntries(formData.entries());
  state.form.errors = Object.fromEntries(
    Object.entries(state.form.values).map(([name, value]) => [
      name,
      validateField(name, value),
    ]),
  );

  renderFormErrors();

  const hasErrors = Object.values(state.form.errors).some(Boolean);
  if (hasErrors) {
    elements.formMessage.textContent = '입력값을 다시 확인해 주세요.';
    return;
  }

  const submitButton = elements.contactForm.querySelector('[type="submit"]');
  state.form.submitting = true;
  state.form.submitted = false;
  submitButton.disabled = true;
  elements.formMessage.textContent = '전송 중입니다.';

  try {
    const response = await fetch(siteConfig.formspreeEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Formspree request failed');
    }

    state.form.submitted = true;
    elements.formMessage.textContent = '전송되었습니다';
    elements.contactForm.reset();
    state.form.values = { name: '', email: '', message: '' };
  } catch (error) {
    elements.formMessage.textContent =
      '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  } finally {
    state.form.submitting = false;
    submitButton.disabled = false;
  }
}
