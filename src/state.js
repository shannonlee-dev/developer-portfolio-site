import { getInitialTheme } from './theme-preference.js';

export const state = {
  theme: localStorage.getItem('portfolio-theme') || getInitialTheme(),
  projects: [],
  projectStatus: 'loading',
  projectError: '',
  activeLanguage: 'All',
  form: {
    values: {
      name: '',
      email: '',
      message: '',
    },
    errors: {},
    submitted: false,
  },
};
