import { siteConfig } from '../config.js';
import { elements } from '../dom.js';
import { state } from '../state.js';

let requestInProgress = false;
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );

function safeRepositoryUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      !url.username &&
      !url.password
      ? url.href
      : '';
  } catch {
    return '';
  }
}

export function setProjectStatus(status, errorMessage = '') {
  state.projectStatus = status;
  state.projectError = errorMessage;
  renderProjects();
}

export function getLanguages(projects) {
  return ['All', ...new Set(projects.map(({ language }) => language).filter(Boolean))];
}

export function renderFilters() {
  const focusedLanguage = elements.filterBar.contains(document.activeElement)
    ? document.activeElement.dataset.language
    : null;
  elements.filterBar.replaceChildren();
  getLanguages(state.projects).forEach((language) => {
    const button = document.createElement('button');
    button.className = 'filter-button';
    button.classList.toggle('active', language === state.activeLanguage);
    button.setAttribute('aria-pressed', String(language === state.activeLanguage));
    button.type = 'button';
    button.dataset.language = language;
    button.textContent = language === 'All' ? '전체' : language;
    button.addEventListener('click', () => {
      state.activeLanguage = language;
      renderProjects();
    });
    elements.filterBar.append(button);
    if (language === focusedLanguage) button.focus({ preventScroll: true });
  });
}

export function getVisibleProjects() {
  return state.activeLanguage === 'All'
    ? state.projects
    : state.projects.filter(({ language }) => language === state.activeLanguage);
}

export function renderProjectCards(projects) {
  // Escape API text before template rendering; accept only GitHub HTTPS links.
  elements.projectsGrid.innerHTML = projects
    .map(({ name, description, html_url, stargazers_count = 0, language }, index) => {
      const url = safeRepositoryUrl(html_url);
      return `<article class="project-card">
      <span class="project-number" aria-hidden="true">PROJECT / ${String(index + 1).padStart(2, '0')}</span>
      <h3>${escapeHTML(name)}</h3>
      <p>${escapeHTML(description || '설명이 없는 저장소입니다.')}</p>
      <div class="project-meta"><span>${escapeHTML(language || '언어 미지정')}</span><span>별 ${escapeHTML(stargazers_count)}</span></div>
      ${url ? `<a class="text-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(name)} 저장소 열기 (새 탭)">저장소 보기 <span aria-hidden="true">↗</span></a>` : ''}
    </article>`;
    })
    .join('');
}

export function renderProjects() {
  const { projectStatus } = state;
  elements.projectsGrid.setAttribute('aria-busy', String(projectStatus === 'loading'));
  elements.projectStatus.classList.toggle('error', projectStatus === 'error');
  elements.projectStatus.classList.toggle('loading', projectStatus === 'loading');
  elements.retryProjects.hidden = projectStatus !== 'error';
  elements.retryProjects.disabled = projectStatus === 'loading';

  if (projectStatus !== 'success') {
    elements.projectsGrid.replaceChildren();
    elements.filterBar.replaceChildren();
    elements.projectStatus.textContent =
      projectStatus === 'loading'
        ? '로딩 중... GitHub 저장소를 불러오고 있습니다.'
        : state.projectError || '프로젝트를 불러올 수 없습니다. 다시 시도해 주세요.';
    return;
  }

  const projects = getVisibleProjects();
  if (state.projects.length) renderFilters();
  else elements.filterBar.replaceChildren();
  elements.projectStatus.textContent = projects.length
    ? `${projects.length}개의 프로젝트를 표시합니다.`
    : '표시할 프로젝트가 없습니다.';
  renderProjectCards(projects);
}

export async function loadProjects() {
  if (requestInProgress) return;
  requestInProgress = true;
  setProjectStatus('loading');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), siteConfig.requestTimeout);

  try {
    const response = await fetch(siteConfig.githubReposEndpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (response.status === 403 || response.status === 429) {
      throw new Error(
        `프로젝트를 불러올 수 없습니다. GitHub 요청 제한(${response.status})이 발생했습니다. 잠시 후 다시 시도해 주세요.`,
      );
    }
    if (!response.ok)
      throw new Error('프로젝트를 불러올 수 없습니다. 다시 시도해 주세요.');
    const repos = await response.json();
    if (
      !Array.isArray(repos) ||
      repos.some((repo) => !repo || typeof repo.name !== 'string')
    ) {
      throw new Error(
        '프로젝트를 불러올 수 없습니다. GitHub 응답 형식을 확인할 수 없습니다.',
      );
    }
    state.projects = repos
      .map((repo) => ({
        ...repo,
        description: typeof repo.description === 'string' ? repo.description : '',
        language: typeof repo.language === 'string' ? repo.language : null,
        stargazers_count: Number.isFinite(repo.stargazers_count)
          ? repo.stargazers_count
          : 0,
      }))
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 9);
    state.activeLanguage = 'All';
    setProjectStatus('success');
  } catch (error) {
    const message = controller.signal.aborted
      ? '프로젝트를 불러올 수 없습니다. 응답 시간이 초과되었습니다. 다시 시도해 주세요.'
      : error.message.startsWith('프로젝트를')
        ? error.message
        : '프로젝트를 불러올 수 없습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.';
    setProjectStatus('error', message);
  } finally {
    clearTimeout(timeout);
    requestInProgress = false;
  }
}
