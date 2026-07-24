// Dark/light theme, persisted in localStorage and applied via a data-theme
// attribute on <html>, which the CSS variables in styles.css key off of.

const THEME_KEY = 'lender-tracker-theme-v1';

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

export function toggleTheme() {
  const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
