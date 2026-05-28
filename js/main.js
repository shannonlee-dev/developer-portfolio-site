const siteConfig = {
  githubUsername: 'shannonlee-dev',
  githubReposEndpoint: 'https://api.github.com/users/shannonlee-dev/repos',
  repositoryUrl: 'https://github.com/shannonlee-dev/codyssey_mission/tree/main/2026-main-4-1',
  pagesUrl: 'https://shannonlee-dev.github.io/codyssey_mission/2026-main-4-1/',
  formspreeEndpoint: 'https://formspree.io/f/xvzyqdro',
  scrollTopThreshold: 300,
  navScrollThreshold: 60,
  observerThreshold: 0.2,
};

const state = {
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

const elements = {
  root: document.documentElement,
  header: document.querySelector('[data-header]'),
  hamburger: document.querySelector('.hamburger'),
  navMenu: document.querySelector('#nav-menu'),
  navLinks: document.querySelectorAll('.nav-link'),
  themeToggle: document.querySelector('[data-theme-toggle]'),
  themeLabel: document.querySelector('[data-theme-label]'),
  scrollTop: document.querySelector('[data-scroll-top]'),
  projectsGrid: document.querySelector('[data-projects-grid]'),
  projectStatus: document.querySelector('[data-project-status]'),
  retryProjects: document.querySelector('[data-retry-projects]'),
  filterBar: document.querySelector('[data-filter-bar]'),
  contactForm: document.querySelector('[data-contact-form]'),
  formMessage: document.querySelector('[data-form-message]'),
  revealTargets: document.querySelectorAll('.reveal'),
  typingText: document.querySelector('[data-typing-text]'),
};

function getInitialTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function renderTheme() {
  elements.root.dataset.theme = state.theme;
  elements.themeLabel.textContent = state.theme === 'dark' ? 'Light' : 'Dark';
  localStorage.setItem('portfolio-theme', state.theme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  renderTheme();
}

function toggleMobileMenu() {
  elements.navMenu.classList.toggle('active');
  elements.hamburger.classList.toggle('active');
  const isExpanded = elements.hamburger.classList.contains('active');
  elements.hamburger.setAttribute('aria-expanded', String(isExpanded));
}

function closeMobileMenu() {
  elements.navMenu.classList.remove('active');
  elements.hamburger.classList.remove('active');
  elements.hamburger.setAttribute('aria-expanded', 'false');
}

function handleNavClick(event) {
  event.preventDefault();
  const targetId = event.currentTarget.getAttribute('href');
  const target = document.querySelector(targetId);

  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  closeMobileMenu();
}

function handleScroll() {
  const isPastTopThreshold = window.scrollY >= siteConfig.scrollTopThreshold;
  const isPastNavThreshold = window.scrollY >= siteConfig.navScrollThreshold;

  elements.scrollTop.classList.toggle('active', isPastTopThreshold);
  elements.header.classList.toggle('scrolled', isPastNavThreshold);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setProjectStatus(status, errorMessage = '') {
  state.projectStatus = status;
  state.projectError = errorMessage;
  renderProjects();
}

function getLanguages(projects) {
  const languages = projects
    .map(({ language }) => language)
    .filter(Boolean);

  return ['All', ...new Set(languages)];
}

function renderFilters() {
  const languages = getLanguages(state.projects);

  elements.filterBar.innerHTML = languages
    .map((language) => {
      const isActive = language === state.activeLanguage ? ' active' : '';
      return `<button class="filter-button${isActive}" type="button" data-language="${language}">${language}</button>`;
    })
    .join('');

  elements.filterBar.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeLanguage = button.dataset.language;
      renderProjects();
    });
  });
}

function getVisibleProjects() {
  if (state.activeLanguage === 'All') {
    return state.projects;
  }

  return state.projects.filter(({ language }) => language === state.activeLanguage);
}

function renderProjectCards(projects) {
  elements.projectsGrid.innerHTML = projects
    .map(({ name, description, html_url: url, stargazers_count: stars, language }) => `
      <article class="project-card">
        <h3>${name}</h3>
        <p>${description || '설명이 없는 저장소입니다.'}</p>
        <div class="project-meta">
          <span>Language: ${language || 'Unknown'}</span>
          <span>Stars: ${stars}</span>
        </div>
        <a class="button secondary small" href="${url}" target="_blank" rel="noreferrer">Repository</a>
      </article>
    `)
    .join('');
}

function renderProjects() {
  elements.projectStatus.classList.remove('error');

  if (state.projectStatus === 'loading') {
    elements.projectStatus.textContent = '로딩 중... GitHub 저장소를 불러오고 있습니다.';
    elements.projectsGrid.innerHTML = '';
    elements.filterBar.innerHTML = '';
    return;
  }

  if (state.projectStatus === 'error') {
    elements.projectStatus.textContent = state.projectError || '프로젝트를 불러올 수 없습니다. 다시 시도해 주세요.';
    elements.projectStatus.classList.add('error');
    elements.projectsGrid.innerHTML = '';
    elements.filterBar.innerHTML = '';
    return;
  }

  const visibleProjects = getVisibleProjects();

  renderFilters();

  if (visibleProjects.length === 0) {
    elements.projectStatus.textContent = '표시할 프로젝트가 없습니다.';
    elements.projectsGrid.innerHTML = '';
    return;
  }

  elements.projectStatus.textContent = `${visibleProjects.length}개의 프로젝트를 표시합니다.`;
  renderProjectCards(visibleProjects);
}

async function loadProjects() {
  setProjectStatus('loading');

  try {
    const response = await fetch(siteConfig.githubReposEndpoint);

    if (response.status === 403) {
      throw new Error('GitHub API 레이트 리밋(403)이 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }

    if (!response.ok) {
      throw new Error('프로젝트를 불러올 수 없습니다. 다시 시도해 주세요.');
    }

    const repos = await response.json();
    state.projects = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 9);
    state.activeLanguage = 'All';
    setProjectStatus('success');
  } catch (error) {
    setProjectStatus('error', error.message);
  }
}

function validateField(name, value) {
  if (!value.trim()) {
    return '필수 입력 항목입니다.';
  }

  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return '올바른 이메일 형식을 입력해 주세요.';
  }

  return '';
}

function renderFormErrors() {
  Object.entries(state.form.errors).forEach(([field, message]) => {
    const errorTarget = document.querySelector(`[data-error-for="${field}"]`);
    if (errorTarget) {
      errorTarget.textContent = message;
    }
  });
}

function updateFormState(event) {
  const { name, value } = event.target;
  state.form.values[name] = value;
  state.form.errors[name] = validateField(name, value);
  state.form.submitted = false;
  elements.formMessage.textContent = '';
  renderFormErrors();
}

async function handleContactSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.contactForm);
  state.form.values = Object.fromEntries(formData.entries());
  state.form.errors = Object.fromEntries(
    Object.entries(state.form.values).map(([name, value]) => [name, validateField(name, value)])
  );

  renderFormErrors();

  const hasErrors = Object.values(state.form.errors).some(Boolean);
  if (hasErrors) {
    elements.formMessage.textContent = '입력값을 다시 확인해 주세요.';
    return;
  }



  try {
    const response = await fetch(siteConfig.formspreeEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Formspree request failed');
    }
  } catch (error) {
    elements.formMessage.textContent = '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
    return;
  }

  state.form.submitted = true;
  elements.formMessage.textContent = '전송되었습니다';
  elements.contactForm.reset();
}

function observeSections() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: siteConfig.observerThreshold });

  elements.revealTargets.forEach((target) => observer.observe(target));
}

function runTypingEffect() {
  const text = 'Shannon Lee';
  let index = 0;

  elements.typingText.textContent = '';

  const typing = window.setInterval(() => {
    elements.typingText.textContent = text.slice(0, index + 1);
    index += 1;

    if (index >= text.length) {
      window.clearInterval(typing);
    }
  }, 110);
}

function bindEvents() {
  elements.hamburger.addEventListener('click', toggleMobileMenu);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.scrollTop.addEventListener('click', scrollToTop);
  elements.retryProjects.addEventListener('click', loadProjects);
  elements.navLinks.forEach((link) => link.addEventListener('click', handleNavClick));
  elements.contactForm.addEventListener('submit', handleContactSubmit);
  elements.contactForm.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('input', updateFormState);
  });
  window.addEventListener('scroll', handleScroll);
}

function init() {
  renderTheme();
  bindEvents();
  observeSections();
  runTypingEffect();
  handleScroll();
  loadProjects();
}

init();
