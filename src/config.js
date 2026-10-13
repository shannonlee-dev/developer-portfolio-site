const githubUsername = 'shannonlee-dev';

export const siteConfig = {
  githubUsername,
  githubReposEndpoint: `https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`,
  repositoryUrl: `https://github.com/${githubUsername}/developer-portfolio-site`,
  pagesUrl: `https://${githubUsername}.github.io/developer-portfolio-site/`,
  formspreeEndpoint: 'https://formspree.io/f/xvzyqdro',
  scrollTopThreshold: 300,
  navScrollThreshold: 60,
  observerThreshold: 0.2,
  requestTimeout: 12000,
};
