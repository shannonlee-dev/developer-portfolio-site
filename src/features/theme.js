import { elements } from '../dom.js';
import { state } from '../state.js';
import { themeStorageKey } from '../theme-preference.js';

export function renderTheme() {
  const isDark = state.theme === 'dark';
  elements.root.dataset.theme = state.theme;
  elements.themeLabel.textContent = isDark ? '라이트 모드' : '다크 모드';
  elements.themeToggle.setAttribute('aria-pressed', String(isDark));
  elements.themeToggle.setAttribute('aria-label', '다크 모드 사용');
}

export function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  state.themeExplicit = true;
  renderTheme();
  try {
    localStorage.setItem(themeStorageKey, state.theme);
  } catch {
    // Storage is optional: the current page must still switch themes.
  }
}

export function followSystemTheme(event) {
  if (state.themeExplicit) return;
  state.theme = event.matches ? 'dark' : 'light';
  renderTheme();
}
