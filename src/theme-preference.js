export const themeStorageKey = 'portfolio-theme';

export function getSavedTheme() {
  try {
    const theme = localStorage.getItem(themeStorageKey);
    return ['light', 'dark'].includes(theme) ? theme : null;
  } catch {
    return null;
  }
}

export function getInitialTheme() {
  return (
    getSavedTheme() ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
}
