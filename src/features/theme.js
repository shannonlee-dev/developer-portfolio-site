import { elements } from '../dom.js';
import { state } from '../state.js';

export function renderTheme() {
  elements.root.dataset.theme = state.theme;
  elements.themeLabel.textContent =
    state.theme === 'dark' ? '라이트 모드' : '다크 모드';
  localStorage.setItem('portfolio-theme', state.theme);
}

export function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  renderTheme();
}
