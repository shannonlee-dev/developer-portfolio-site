import { siteConfig } from '../config.js';
import { elements } from '../dom.js';

export function observeSections() {
  if (
    typeof IntersectionObserver === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        target.classList.remove('pending');
        target.classList.add('visible');
        observer.unobserve(target);
      });
    },
    { threshold: siteConfig.observerThreshold },
  );

  elements.revealTargets.forEach((target) => {
    target.classList.add('pending');
    observer.observe(target);
  });
}
