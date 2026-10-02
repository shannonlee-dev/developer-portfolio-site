import { siteConfig } from '../config.js';
import { elements } from '../dom.js';
import { state } from '../state.js';

export function setProjectStatus(status, errorMessage = '') {
  state.projectStatus = status;
  state.projectError = errorMessage;
  renderProjects();
}

export function getLanguages(projects) {
  const languages = projects.map(({ language }) => language).filter(Boolean);

  return ['All', ...new Set(languages)];
}

export function renderFilters() {
  const languages = getLanguages(state.projects);

  elements.filterBar.innerHTML = languages
    .map((language) => {
      const isActive = language === state.activeLanguage ? ' active' : '';
      return `<button class="filter-button${isActive}" type="button" data-language="${language}">${language === 'All' ? '전체' : language}</button>`;
    })
    .join('');

  elements.filterBar.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeLanguage = button.dataset.language;
      renderProjects();
    });
  });
}

export function getVisibleProjects() {
  if (state.activeLanguage === 'All') {
    return state.projects;
  }

  return state.projects.filter(({ language }) => language === state.activeLanguage);
}

export function renderProjectCards(projects) {
  elements.projectsGrid.innerHTML = projects
    .map(
      ({ name, description, html_url: url, stargazers_count: stars, language }) => `
      <article class="project-card">
        <h3>${name}</h3>
        <p>${description || '설명이 없는 저장소입니다.'}</p>
        <div class="project-meta">
          <span>언어: ${language || '미지정'}</span>
          <span>별: ${stars}</span>
        </div>
        <a class="button secondary small" href="${url}" target="_blank" rel="noreferrer">저장소</a>
      </article>
    `,
    )
    .join('');
}

export function renderProjects() {
  elements.projectStatus.classList.remove('error');

  if (state.projectStatus === 'loading') {
    elements.projectStatus.textContent =
      '로딩 중... GitHub 저장소를 불러오고 있습니다.';
    elements.projectsGrid.innerHTML = '';
    elements.filterBar.innerHTML = '';
    return;
  }

  if (state.projectStatus === 'error') {
    elements.projectStatus.textContent =
      state.projectError || '프로젝트를 불러올 수 없습니다. 다시 시도해 주세요.';
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

export async function loadProjects() {
  setProjectStatus('loading');

  try {
    const response = await fetch(siteConfig.githubReposEndpoint);

    if (response.status === 403) {
      throw new Error(
        'GitHub API 레이트 리밋(403)이 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
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
