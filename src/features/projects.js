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

  elements.filterBar.replaceChildren();
  languages.forEach((language) => {
    const button = document.createElement('button');
    button.className = 'filter-button';
    button.classList.toggle('active', language === state.activeLanguage);
    button.type = 'button';
    button.dataset.language = language;
    button.textContent = language === 'All' ? '전체' : language;
    button.addEventListener('click', () => {
      state.activeLanguage = language;
      renderProjects();
    });
    elements.filterBar.append(button);
  });
}

export function getVisibleProjects() {
  if (state.activeLanguage === 'All') {
    return state.projects;
  }

  return state.projects.filter(({ language }) => language === state.activeLanguage);
}

export function renderProjectCards(projects) {
  elements.projectsGrid.replaceChildren();
  projects.forEach(
    ({ name, description, html_url: url, stargazers_count: stars, language }) => {
      const card = document.createElement('article');
      card.className = 'project-card';
      const title = document.createElement('h3');
      title.textContent = name;
      const summary = document.createElement('p');
      summary.textContent = description || '설명이 없는 저장소입니다.';
      const metadata = document.createElement('div');
      metadata.className = 'project-meta';
      const languageLabel = document.createElement('span');
      languageLabel.textContent = `언어: ${language || '미지정'}`;
      const starsLabel = document.createElement('span');
      starsLabel.textContent = `별: ${stars}`;
      metadata.append(languageLabel, starsLabel);
      card.append(title, summary, metadata);

      try {
        const repositoryUrl = new URL(url);
        if (['https:', 'http:'].includes(repositoryUrl.protocol)) {
          const link = document.createElement('a');
          link.className = 'button secondary small';
          link.href = repositoryUrl.href;
          link.target = '_blank';
          link.rel = 'noreferrer';
          link.textContent = '저장소';
          card.append(link);
        }
      } catch {
        // A malformed repository URL must not become a navigation target.
      }
      elements.projectsGrid.append(card);
    },
  );
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
