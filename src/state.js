import { getInitialTheme, getSavedTheme } from './theme-preference.js';

export const state = {
  theme: getInitialTheme(),
  themeExplicit: Boolean(getSavedTheme()),
  menuOpen: false,
  projects: [],
  projectStatus: 'loading',
  projectError: '',
  activeLanguage: 'All',
  form: {
    values: { name: '', email: '', message: '' },
    errors: {},
    submitted: false,
    submitting: false,
  },
};
